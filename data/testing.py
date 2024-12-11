from openai import OpenAI
import jsonlines
import csv
import os
client = OpenAI(api_key="")

evaluation_criteria = [
    "대화의 자연스러움",
    "전문성",
    "긍정적 태도",
    "자기 결정 지원",
    "응답의 간결성",
    "부적절한 내용 여부"
]

data = []
with jsonlines.open("./val_data_1202_2.jsonl") as read_file:
    for line in read_file.iter():
        data.append(line)


def eval(dataline, result, real):
    prompt = f"""
    이전 대화: {dataline}
    이전 대화에 대한 AI 상담사 모델의 응답: {result}
    현실 답변 : {real}

    작업 지시: 주어진 이전 대화에서 AI 상담사의 응답을 아래의 평가 기준에 따라 1점에서 5점까지 점수를 부여하고, 각 점수에 대한 간단한 이유를 작성하세요. 진로 상담을 주제로 하며, 실제 데이터상 답변은 위에서 주어진 현실 답변임을 참고합니다.

    평가 기준:
    - 대화의 자연스러움: AI의 응답이 대화 흐름에 어색함 없이 자연스럽게 이어지는지 평가합니다.
    - 전문성: AI의 응답이 내담자의 진로에 대한 전문적이고 신뢰할 수 있는 정보를 제공하는지 평가합니다.
    - 긍정적 태도: AI가 내담자에게 긍정적이고 지지적인 태도를 보이는지 평가합니다.
    - 자기 결정 지원: AI가 내담자가 스스로 결정을 내릴 수 있도록 돕는지 평가합니다.
    - 응답의 간결성: AI의 응답이 불필요하게 장황하지 않고 간결한지 평가합니다.
    - 부적절한 내용 여부: AI의 응답에 진로 상담가로서 부적절한 내용이 없는지 평가합니다.

    평가 방법:
    - 각 평가 기준에 대해 1점(매우 부족)에서 10점(매우 우수)까지 점수를 부여하세요.
    - 각 점수에 대한 간단한 이유를 작성하여 평가의 근거를 명확히 하세요.
    - 위의 모델 응답을 다음 평가 기준에 따라 1에서 5까지 점수로 평가하세요.
    - 맨 마지막줄에 6개 점수를 정수 형태로 /를 기준으로 나열하여주세요. "최종결과 : 2/4/5/1/3/4" 형태로 보여주세요.
    """

    completion = client.chat.completions.create(
        model='gpt-4o-mini',
        messages=[
            {"role": "user", "content": prompt},
        ]
    )
    return completion.choices[0].message.content.strip("\n")


def call(dataline, pickmodel):
    completion = client.chat.completions.create(
        model=pickmodel,
        messages=dataline
    )
    return completion.choices[0].message.content.strip("\n")


def score(vali):
    try:
        score_before = list(
            map(int, vali.split('\n')[-1].split(":")[-1].strip().split("/")))
        return score_before
    except:
        return [-1, -1, -1, -1, -1, -1]


file = open("./result_withnoprompt.csv", 'w', encoding='utf-8')
writer = csv.writer(file, quotechar='"', quoting=csv.QUOTE_MINIMAL)
writer.writerow(['순번', '입력', 'gpt-4o-mini-2024-07-18', '파인튜닝이후',
                '이전점수', '이후점수', '이전합산', '이후합산', '실제답변', '이전평가', '이후평가'])

goods = 0
nos = 0
goods_sum = [0, 0]

ind = 1
for i in data:
    real_data = i['target'].strip("\n")
    message = i['prompt']
    before = call(message, "gpt-4o-mini-2024-07-18")
    after = call(message, "ft:gpt-4o-mini-2024-07-18:personal:hsver2:AW7mRKCh")
    os.system('cls')
    print(ind, "번째")
    print()
    for j in message:
        print(f"{'T' if j['role'] == 'assistant' else 'S'} : {j['content']}")
    print()
    print("추천 답안\n")
    print(before)
    print()
    x_before = int(input("평가 점수 : 1~6 : "))

    os.system('cls')
    print(ind, "번째")
    print()
    for j in message[1:]:
        print(f"{'T' if j['role'] == 'assistant' else 'S'} : {j['content']}")
    print()
    print("추천 답안\n")
    print(after)
    print()
    x_after = int(input("평가 점수 : 1~6 : "))

    val_before = eval(message, before, real_data)
    val_after = eval(message, after, real_data)
    score_before = score(val_before) + [x_before]
    score_after = score(val_after) + [x_after]
    writer.writerow([ind, message, before, after, score_before, score_after, sum(
        score_before), sum(score_after), real_data, val_before, val_after])
    ind += 1
    if score_before[0] != -1 and score_after[0] != -1:
        goods += 1
        goods_sum[0] += sum(score_before)
        goods_sum[1] += sum(score_after)
    else:
        nos += 1


file.close()

print("점수합산성공회수 :", goods)
print("점수합산실패횟수 :", nos)
print("파인튜닝 이전 총점 :", goods_sum[0])
print("파인튜닝 이후 점수총점 :", goods_sum[1])
