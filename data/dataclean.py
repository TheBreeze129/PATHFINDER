import json
import tiktoken
import os
from sklearn.model_selection import train_test_split


encoding = tiktoken.encoding_for_model("gpt-4o-mini")
with open("./상담기록_데이터_고등학교.json", encoding='utf-8') as f: 
    counseling_datas = json.load(f)

with open('./학생기초정보_데이터_고등학교.json', encoding='utf-8') as f:
    student_metadata = json.load(f)

print(len(counseling_datas))
print()

#학생데이터 전처리
student_datas = {student_metadata[x]["meta_basics"]['index']:(student_metadata[x]["meta_basics"]['school_type'], student_metadata[x]["meta_basics"]['gender']) for x in student_metadata}

# genderdata = {'남':0,'여':0,'무응답':0}

jjjj = []


data = {"직업정보탐색":{4:[],6:[],8:[],10:[]}, "직업이해":{4:[],6:[],8:[],10:[]}, "자아이해":{4:[],6:[],8:[],10:[]}, "기타":{4:[],6:[],8:[],10:[]}, "교육기회탐색":{4:[],6:[],8:[],10:[]}}
tokens = 0
ttttttt = list(counseling_datas.values())
for counseling_data in ttttttt[300:350]:
    print(len(jjjj), ":개")
    student_idx = counseling_data['meta']['student_idx']
    student_gender = student_datas[student_idx][1]
    student_grade = student_datas[student_idx][0]
    if len(student_gender) == 1:
        student_gender += '성'
    conversations = counseling_data['conversation']
    for conversation in conversations:
        utterances = [[x['speaker_idx'][0], x['utterance']] for x in conversation['utterances']]
        prev = utterances[0][0]
        prev_idx = 0
        deleted = []
        for i in range(1, len(utterances)):
            if utterances[i][0] == prev:
                utterances[prev_idx][1] += (" " + utterances[i][1])
                deleted.append(i)
            else:
                prev = utterances[i][0]
                prev_idx = i
        deleted.reverse()
        for i in deleted:
            del utterances[i]

        os.system('cls')
        print("Conversation!")
        print()
        for i in range(len(utterances)):
            if '[이모티콘]' in utterances[i][1]:
                utterances[i][1] = utterances[i][1].replace('[이모티콘]', "")
            print(utterances[i][0], ":", utterances[i][1])
        print()
        hmm = input('hmm...')
        if hmm != "":
            temps = {'student_info':student_gender, 'conv_category':conversation['conv_category'], 'conv':utterances}
            jjjj.append(temps)


with open("./cleaned_data_10001.jsonl",'w', encoding='utf-8') as f:
    for i in jjjj:
        f.write(json.dumps(i,ensure_ascii=False) + "\n")