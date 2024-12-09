import React, { useState, useEffect, useRef } from 'react';
import { ReactComponent as Mic_muted } from '../assets/svgs/mic_muted.svg';
import { ReactComponent as Vid_on } from '../assets/svgs/vid.svg';
import { ReactComponent as Mic_on } from '../assets/svgs/mic_on.svg';
import { ReactComponent as Vid_muted } from '../assets/svgs/vid_muted.svg';
import { ReactComponent as Quit_v } from '../assets/svgs/quit.svg';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import axios from 'axios'; // Axios로 백엔드 API 호출
import * as faceapi from 'face-api.js';

const MainServer =
  process.env.REACT_APP_MAIN_SERVER_IP +
  ':' +
  process.env.REACT_APP_MAIN_SERVER_PORT;

const SigServer =
  process.env.REACT_APP_SIG_SERVER_IP +
  ':' +
  process.env.REACT_APP_SIG_SERVER_PORT;

const VoiceServer =
  process.env.REACT_APP_VOICE_SERVER_IP +
  ':' +
  process.env.REACT_APP_VOICE_SERVER_PORT;

// 음량 임계값 설정
const VOLUME_START_THRESHOLD = 30; // 녹음 시작 임계값
const VOLUME_STOP_THRESHOLD = 20; // 녹음 중지 임계값
const SILENCE_DURATION = 2000; // 침묵 지속 시간 (밀리초)

const MeetingTeacher = () => {
  const [data, setData] = useState([]); // 추천 답변
  const [after1min, setAfter1min] = useState(false); // 1분 지났는지 여부
  const [expressions, setExpressions] = useState('대기'); // 학생 감정 인식

  // 상태 관리 (UI 업데이트용)
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomID] = useState('');
  const [partnerConnected, setPartnerConnected] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const webSocket = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [stream, setStream] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 참조 관리 (변경 사항 유지용)
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isRecordingRef = useRef(false);
  const audioChunksRef = useRef([]);
  const recordingStartTimeRef = useRef(null);

  // 오디오 컨텍스트 및 분석기
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);

  // 평균 음량 계산 함수
  const calculateVolume = dataArray => {
    if (isMuted) return 0.0;
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length;
  };

  // 오디오 스트림 가져오기 및 AudioContext 설정
  const getAudioStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      audioStreamRef.current = stream;

      const context = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(context);

      const source = context.createMediaStreamSource(stream);
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 2048; // 주파수 분석 크기 설정 (필요에 따라 조정)
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      detectSpeech(analyserNode);
    } catch (err) {
      console.error('마이크 접근 오류:', err);
    }
  };

  // 발화 감지 함수
  const detectSpeech = analyserNode => {
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkVolume = () => {
      analyserNode.getByteFrequencyData(dataArray);
      const volume = calculateVolume(dataArray);

      //console.log('현재 볼륨:', volume);

      // 발화 시작 감지
      if (volume > VOLUME_START_THRESHOLD && !isRecordingRef.current) {
        console.log('볼륨이 시작 임계값을 초과했습니다. 녹음을 시작합니다.');
        startRecording();
      }

      // 발화 중지 감지
      if (
        volume < VOLUME_STOP_THRESHOLD &&
        isRecordingRef.current &&
        !silenceTimerRef.current
      ) {
        console.log('볼륨이 중지 임계값 이하입니다. 침묵 타이머를 시작합니다.');
        silenceTimerRef.current = setTimeout(() => {
          console.log('침묵 지속 시간이 충족되었습니다. 녹음을 중지합니다.');
          stopRecording();
        }, SILENCE_DURATION);
      }

      // 발화가 다시 감지되면 침묵 타이머 취소
      if (volume > VOLUME_START_THRESHOLD && silenceTimerRef.current) {
        console.log(
          '볼륨이 다시 시작 임계값을 초과했습니다. 침묵 타이머를 취소합니다.',
        );
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      requestAnimationFrame(checkVolume);
    };

    checkVolume();
  };

  const startRecording = () => {
    if (isRecordingRef.current) {
      console.log('이미 녹음 중입니다. 녹음 시작을 무시합니다.');
      return;
    }

    try {
      // **녹음 시작 시간을 기록**
      recordingStartTimeRef.current = new Date();

      const options = MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : { mimeType: 'audio/ogg' };
      const mediaRecorder = new MediaRecorder(audioStreamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) {
          console.log('데이터가 준비되었습니다:', e.data);
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('녹음이 중지되었습니다. 오디오 데이터를 처리합니다.');
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        // **파일 이름 생성 시 녹음 시작 시간 사용**
        const fileName = generateFileName(recordingStartTimeRef.current);

        setAudioBlob(blob);
        sendAudioToServer(blob, fileName); // 파일 이름을 전달
        audioChunksRef.current = []; // 녹음 후 청크 초기화
      };

      mediaRecorder.start(); // timeslice 없이 시작
      console.log('MediaRecorder가 시작되었습니다.');
      isRecordingRef.current = true;
      setIsRecording(true);
    } catch (error) {
      console.error('녹음 시작 오류:', error);
    }
  };

  // **추가: 파일 이름 생성 함수**
  const generateFileName = date => {
    const pad = num => String(num).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // 월은 0부터 시작하므로 +1
    const day = pad(date.getDate());

    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `T_${location.search.split('=')[1]}_${year}${month}${day}_${hours}${minutes}${seconds}.webm`;
  };

  // 녹음 중지 함수
  const stopRecording = () => {
    if (!isRecordingRef.current) {
      console.log('녹음 중이 아닙니다. 녹음 중지를 무시합니다.');
      return;
    }

    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
        console.log('MediaRecorder.stop()이 호출되었습니다.');
      }
      isRecordingRef.current = false;
      setIsRecording(false);
    } catch (error) {
      console.error('녹음 중지 오류:', error);
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  // 서버로 오디오 전송 함수
  const sendAudioToServer = async (blob, fileName) => {
    // fileName 추가
    const formData = new FormData();
    formData.append('audio', blob, fileName); // 생성된 파일 이름 사용

    try {
      const response = await fetch(
        'https://' + VoiceServer + '/api/v2/upload',
        {
          method: 'POST',
          body: formData,

          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`, // 헤더 설정
          },
        },
      );
      console.log('오디오가 성공적으로 전송되었습니다:', response);
    } catch (error) {
      console.error('오디오 전송 오류:', error);
    }
  };

  useEffect(() => {
    getAudioStream();

    return () => {
      // 컴포넌트 언마운트 시 정리 작업
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  // 방 ID 처리
  useEffect(() => {
    if (location) {
      const queryRoomId = location.search.split('=')[1];
      setRoomID(queryRoomId);
    }
  }, [location]);

  // WebSocket 및 WebRTC 초기화
  useEffect(() => {
    let isMounted = true; // 컴포넌트 마운트 상태 확인
    if (!roomId) return;

    const setupWebSocket = () => {
      webSocket.current = new WebSocket('wss://' + SigServer + '/signal/');

      webSocket.current.onopen = () => {
        console.log('Connected to signaling server');
        webSocket.current.send(
          JSON.stringify({ action: 'join_room', room_id: roomId }),
        );
      };

      webSocket.current.onmessage = async message => {
        try {
          const data = JSON.parse(message.data);
          console.log('Received message:', data);

          if (data.status === 'error') {
            console.error(`WebSocket error: ${data.message}`);
            alert(data.message);
            navigate('/');
            return;
          }

          if (data.status === 'success') {
            setIsConnected(true);
            console.log(`Successfully joined room: ${roomId}`);
          }

          if (data.offer) {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(data.offer),
            );
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            webSocket.current.send(
              JSON.stringify({ action: 'answer', answer, room_id: roomId }),
            );
          } else if (data.answer) {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(data.answer),
            );
          } else if (data.candidate) {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(data.candidate),
            );
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };

      webSocket.current.onerror = error => {
        console.error('WebSocket error:', error);
      };

      webSocket.current.onclose = () => {
        console.log('WebSocket connection closed');
      };
    };

    const setupPeerConnection = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(localStream);
        localVideoRef.current.srcObject = localStream;

        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        peerConnection.current.onicecandidate = event => {
          if (event.candidate) {
            webSocket.current.send(
              JSON.stringify({
                action: 'candidate',
                candidate: event.candidate,
                room_id: roomId,
              }),
            );
          }
        };

        peerConnection.current.ontrack = event => {
          if (isMounted) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        localStream.getTracks().forEach(track => {
          peerConnection.current.addTrack(track, localStream);
        });

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        webSocket.current.send(
          JSON.stringify({ action: 'offer', offer, room_id: roomId }),
        );
      } catch (error) {
        console.error('Error setting up peer connection:', error);
      }
    };

    setupWebSocket();
    setupPeerConnection();

    return () => {
      isMounted = false;
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      if (webSocket.current) {
        webSocket.current.close();
        webSocket.current = null;
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    };
  }, [roomId]);

  // 음소거 토글
  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // 비디오 토글
  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const summary = async () => {
    const jwtToken = localStorage.getItem('accessToken');

    try {
      const response = await axios.post(
        'https://' + MainServer + '/api/v1/end',
        {
          roomId: roomId,
          teacherName: localStorage.getItem('userName'),
          studentName: localStorage.getItem('stdName'),
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        },
      );
      if (response.status === 200) {
        console.log('Succeeded to summary', response.data);
      } else {
        console.log('Succeeded to summary', response);
      }
    } catch (err) {
      console.error('Failed to summary', err);
    }
  };

  // 회의 종료
  const quit = () => {
    if (isRecordingRef.current) {
      stopRecording();
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (webSocket.current) {
      webSocket.current.close();
      webSocket.current = null;
    }
    summary();
    navigate('/endmeeting');
  };

  const postData = async () => {
    const jwtToken = localStorage.getItem('accessToken');

    try {
      const response = await axios.post(
        'https://' + MainServer + '/api/v1/recommendations',
        {
          teacherName: window.localStorage.getItem('userName'),
          studentName: window.localStorage.getItem('stdName'),
          roomId: roomId,
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        },
      );
      if (response.status === 200) {
        console.log('Succeeded to get recommendations', response.data.message);
        setData(prev => {
          const updated = [response.data.message, ...prev]; // 최신 데이터를 맨 앞에 추가
          return updated.slice(0, 3); // 앞에서 3개 요소만 유지
        });
      } else {
        console.log('Succeeded to get recommendations', response);
      }
    } catch (err) {
      console.error('Failed to get recommendations', err);
    }
  };

  // 1분 지난 후 최초로 추천 API 실행
  useEffect(() => {
    const timer = setTimeout(() => {
      setAfter1min(true);
      console.log('1분 지남');
      postData();
    }, 60000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // 1분이 지난 경우 주기적으로 주기적으로 API 실행
  useEffect(() => {
    if (after1min) {
      const interval = setInterval(() => {
        console.log('추천 API 실행');
        postData();
      }, 20000);

      return () => clearInterval(interval);
    }
  }, [after1min]);

  // 모델 로드 및 감정 분석 시작
  const handleExpression = async () => {
    if (remoteVideoRef.current) {
      const video = remoteVideoRef.current;
      console.log('here1');

      // 모델 로드
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models');
      console.log('here2');

      // 얼굴 감지 및 감정 분석
      setInterval(async () => {
        if (video) {
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();
          console.log(detections);
          // 얼굴이 감지된 경우에만 실행
          if (detections.length > 0) {
            const expressions = detections[0].expressions;
            const dominantEmotion = Object.entries(expressions).reduce(
              (max, [emotion, value]) =>
                value > max.value ? { emotion, value } : max,
              { emotion: null, value: 0 },
            );

            console.log(
              `Dominant Emotion: ${dominantEmotion.emotion}, Value: ${dominantEmotion.value}`,
            );
            setExpressions(dominantEmotion.emotion.toUpperCase());
          } else {
            setExpressions('대기');
          }
        }
      }, 10000);
    }
  };

  return (
    <VideoChatContainer>
      <MainContent>
        <RemoteVideoContainer>
          <RemoteVideo
            ref={remoteVideoRef}
            autoPlay
            onPlay={handleExpression}
            playsInline
          />
          <LiveIndicator>
            <BlinkingDot>🔴</BlinkingDot> <Live>LIVE</Live>
          </LiveIndicator>
          <LocalVideoContainer>
            <LocalVideo ref={localVideoRef} autoPlay playsInline muted />
            <LocalLabel>내 비디오</LocalLabel>
          </LocalVideoContainer>
        </RemoteVideoContainer>
        <Assistant>
          <Text_1>AI 어시스턴트</Text_1>
          <Line_1 />
          <Sentiment>
            <Text_2>얼굴 감정 인식 결과</Text_2>
            <Split />
            <Text_2>{expressions}</Text_2>
          </Sentiment>
          <Line_1 />
          <GPTs>
            <Text_3>AI 답변 제안</Text_3>
            <Sugs>
              {data.map(recommend => (
                <Suggestion key={recommend}>{recommend}</Suggestion>
              ))}
            </Sugs>
          </GPTs>
          <Line_1 />
          <Codes>
            <div>참여코드 : {roomId}</div>
          </Codes>
        </Assistant>
      </MainContent>

      <Controls>
        <button onClick={toggleMute}>
          {isMuted ? <MicMuted /> : <MicOn />}
        </button>
        <button onClick={toggleVideo}>
          {isVideoOff ? <VidMuted /> : <VidOn />}
        </button>
        <button onClick={quit}>
          <Quit />
        </button>
      </Controls>
    </VideoChatContainer>
  );
};

export default MeetingTeacher;

// Styled components
const Text_1 = styled.div`
  font-size: 25px;
  font-weight: 600;
  margin-top: 30px;
  margin-left: 30px;
  margin-bottom: 16px;
  color: rgb(72, 69, 56);
`;

const Text_3 = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: rgb(72, 69, 56);
  margin-top: 8%;
  margin-bottom: 8%;
`;

const Sugs = styled.div`
  width: 80%;
  height: 80%;
  overflow: auto;
`;

const Codes = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 16px;
  font-weight: 600;
  color: rgb(72, 69, 56);
  margin-top: 8%;
  margin-bottom: 8%;
  justify-content: center;
  align-items: center;
`;

const Suggestion = styled.div`
  font-size: 16px;
  font-weight: 300;
  color: rgb(72, 69, 56);
  margin-top: 5%;
  margin-bottom: 5%;
`;

const GPTs = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  justify-content: flex-start;
  width: 100%;
  margin-left: 10%;
  height: 68%;
`;

const Sentiment = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 90%;
  margin-left: 5%;
  height: 70px;
`;

const Text_2 = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: rgb(72, 69, 56);
  font-size: 16px;
  font-weight: 600;
`;

const Split = styled.div`
  height: 60%;
  width: 1px;
  background-color: rgb(72, 69, 56);
`;

const Line_1 = styled.div`
  height: 1px;
  width: 90%;
  margin-left: 5%;
  background-color: rgb(72, 69, 56);
`;

const MicMuted = styled(Mic_muted)`
  width: 48px;
  height: 48px;
`;

const VidOn = styled(Vid_on)`
  width: 48px;
  height: 48px;
`;

const VidMuted = styled(Vid_muted)`
  width: 48px;
  height: 48px;
`;

const MicOn = styled(Mic_on)`
  width: 48px;
  height: 48px;
`;

const Quit = styled(Quit_v)`
  width: 48px;
  height: 48px;
`;

const VideoChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3%;
  height: 100vh;
  background-color: #f5f5f5;
  position: relative;
  overflow: hidden;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const Assistant = styled.div`
  display: flex;
  flex-direction: column;
  height: 90%;
  width: 20%;
  border-radius: 30px;
  border: 1px solid rgb(0, 187, 249);
  background-color: white;
  justify-content: space-between;
`;

const RemoteVideoContainer = styled.div`
  position: relative;
  margin-left: 24px;
  margin-right: 24px;
  aspect-ratio: 16 / 9;
  height: 100%;
  width: 70%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-radius: 12px;
`;

const RemoteVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  position: relative;
`;

const LiveIndicator = styled.div`
  display: flex;
  position: absolute;
  justify-content: center;
  align-items: center;
  gap: 5px;
  top: 10px;
  right: 10px;
  padding: 5px 10px;
  background-color: rgb(255, 255, 255);
  color: rgb(0, 0, 0);
  border: 1px solid rgb(255, 0, 0);
  border-radius: 8px;
  font-size: 14px;
`;

const LocalVideoContainer = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 180px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background-color: black;
  border: 1px solid rgb(255, 255, 255);
`;

const LocalVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const LocalLabel = styled.div`
  position: absolute;
  bottom: 5px;
  right: 5px;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 12px;
`;

const Controls = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;

  button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
  }
`;

const blink = keyframes`
  50% {
    opacity: 0;
  }
`;

const BlinkingDot = styled.span`
  display: inline-block;
  animation: ${blink} 1s step-start infinite;
`;

const Live = styled.div``;
