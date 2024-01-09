# 경북대학교 컴퓨터학부 종합설계프로젝트 1 - 미디어 서버 기반의 WebRTC 서비스

![header](https://capsule-render.vercel.app/api?type=rounded&color=a8d5eb&height=200&section=header&text=미디어서버%20기반의%20WebRTC%20서비스&fontAlignY=45&desc=경북대학교%20컴퓨터학부%20종합설계프로젝트%201&descAlignY=65&fontSize=50&fontColor=363636&animation=fadeIn)


## 팀 소개
| [<img src="https://github.com/poi933.png" width="100px">](https://github.com/poi933) | [<img src="https://github.com/LeeWongeun.png" width="100px">](https://github.com/LeeWongeun) | [<img src="https://github.com/yongtaecheon.png" width="100px">](https://github.com/whyyhyh) | [<img src="https://github.com/choimyungbin.png" width="100px">](https://github.com/choimyungbin) |
| :-----: | :-----: | :-----: | :-----: |
| [이성원](https://github.com/poi933) | [이원근](https://github.com/LeeWongeun) | [천용태](https://github.com/yongtaecheon) | [최명빈](https://github.com/choimyungbin) |
|Backend|Backend|Frontend|Backend|

## 실행 화면
![image01](https://github.com/yongtaecheon/KNU_webRTC/assets/94237345/36f5c374-7343-4f09-b1d8-4e99bcdd0d58)

## 1. 과제 수행배경
어느 곳이든 현장에서의 안전에 대한 관제, 모니터링이 중요시 되고 있다. 최근 태풍 ‘힌남노’로 인하여 포항시 한 아파트 주차장에 주민이 오랜 시간 동안 갇히는 사고가 발생했다. 이러한 사고를 예방하기 위해서 빠른 대처 및 실시간 모니터링의 중요성이 대두되고 있다.

최근 코로나19로 인한 언택트 시기를 겪으면서 실시간성을 중요시한 비대면 커뮤니티 플랫폼들이유행했다. 특히 webRTC 오픈소스는 높은 실시간성과 특정 프로그램의 활용없이 웹을 통하여 음성및 화상 통화가 가능하다. 이 webRTC 기술을 현장에 접목시켜 우수한 실시간 관제 및 사고예방 시스템을 만들어 보고자 한다.

## 2. 과제목표
1. 다대다 음성 및 화상 통화
2. CCTV 영상 실시간 스트리밍
3. 파일 전송

## 3. 기술 스택
### 미디어 서버
- Kurento
### 백엔드 서버
- Node.js
- Coturn(STUN/Turn Server)
### 시그널링 서버
- Javascript

## 4. 구현 방법
<img width="800" src="https://github.com/yongtaecheon/KNU_webRTC/assets/71762087/a9381103-ac7d-4b6f-a86e-847e7ad634ec">

## 5. 기대 효과 및 활용 방안
본 서비스는 신속한 사고 대처를 위해 CCTV와 WebRTC를 사용해 실시간으로 사고 현장을 모니터링하고, 화상통화를 이용해 회의할 수 있는 서비스이다. 본 서비스를 통해 다음과 같은 효과를 기대해볼 수 있다.

1) 실시간 모니터링의 이점을 이용해 긴급한 사고가 발생하였을 때 실시간 모니터링을 통해 시간을 지체하지 않고 곧바로 대처할 수 있다. 실시간 영상공유를 통해 정확히 상황을 감지할 수 있고, 이에 따라 신속한 대처가 가능하다.

2) 인명사고 뿐만 아니라 펫 케어에도 본 서비스를 확장 가능하다. 반려동물을 기를 경우 주인이 관리하지 못하는 상황이 생길 수 있는데 가정 외에서도 반려동물의 상태나 집의 상황을 관제, 사고가 생길 경우 즉시 해결하는데 도움을 줄 수 있다.

3) 스마트 팜이란 자율제어 등 정보통신기술을 접목시킨 농업 환경을 의미한다. WebRTC를 스마트팜에 이용할 경우 원격으로 농업현장을 모니터링하고, 이를 자율 제어와 접목해 실시간으로 환경 제어가 가능하다. 이를 통해 농촌의 고령화에 따른 인력부족, 기후변화에 따른 병충해 증가를 보완할 수 있다.
