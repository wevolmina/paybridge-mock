// Official price snapshot: 2026-10-26 KST. USD uses integer cents; KRW uses integer won.
export type RoomId = 'bedroom'|'kitchen'|'desk'|'bathroom';
export type Currency = 'KRW'|'USD';
export interface Device {id:string;name:string;protocol:string;power:string;price:null|{amount:number;currency:Currency;market:string;basis:string;checkedAt:string;sourceUrl:string};officialUrl:string|null;note:string;availability:string}
export interface Scenario {id:string;room:RoomId;title:string;description:string;check:string;flow:string[];brightness:number;curtain:number;options:string[];extras:string[]}
export interface Choice {scenarioId:string;deviceId:string;quantity:number;checked:boolean}
export const rooms:{id:RoomId;name:string;caption:string}[] = [{id:'bedroom',name:'침실',caption:'편안한 밤과 아침'},{id:'kitchen',name:'주방',caption:'물과 전력, 생활 감지'},{id:'desk',name:'데스크',caption:'집중과 휴식의 전환'},{id:'bathroom',name:'화장실',caption:'빠른 점등과 습기 관리'}];
export const devices:Device[] = [
  {
    "id": "badring",
    "name": "IKEA BADRING 바드링 · 405.043.53",
    "protocol": "Zigbee",
    "power": "AAA 충전지 1개",
    "price": {
      "amount": 12900,
      "currency": "KRW",
      "market": "한국 공식몰",
      "basis": "판매가",
      "checkedAt": "2026-10-26",
      "sourceUrl": "https://www.ikea.com/kr/ko/p/badring-water-leakage-sensor-smart-40504353/"
    },
    "officialUrl": "https://www.ikea.com/kr/ko/p/badring-water-leakage-sensor-smart-40504353/",
    "note": "건전지·허브 별도. 자체 경보음과 허브 알림을 구분합니다.",
    "availability": "확인 필요"
  },
  {
    "id": "aqara-leak",
    "name": "Aqara 누수 감지 센서 T1",
    "protocol": "Zigbee",
    "power": "배터리",
    "price": {
      "amount": 44000,
      "currency": "KRW",
      "market": "한국 공식몰",
      "basis": "판매가",
      "checkedAt": "2026-10-26",
      "sourceUrl": "https://aqaralife.shop/product/detail.html?product_no=34"
    },
    "officialUrl": "https://aqaralife.shop/product/detail.html?product_no=34",
    "note": "",
    "availability": "확인 필요"
  },
  {
    "id": "aqara-button",
    "name": "Aqara 무선 미니 스위치 T1",
    "protocol": "Zigbee",
    "power": "배터리",
    "price": {
      "amount": 23100,
      "currency": "KRW",
      "market": "한국 공식몰",
      "basis": "판매가",
      "checkedAt": "2026-10-26",
      "sourceUrl": "https://aqaralife.shop/product/detail.html?product_no=18"
    },
    "officialUrl": "https://aqaralife.shop/product/detail.html?product_no=18",
    "note": "",
    "availability": "재고는 공식몰에서 확인"
  },
  {
    "id": "aqara-door",
    "name": "Aqara 열림 감지 센서 T1",
    "protocol": "Zigbee",
    "power": "배터리",
    "price": {
      "amount": 24200,
      "currency": "KRW",
      "market": "한국 공식몰",
      "basis": "판매가",
      "checkedAt": "2026-10-26",
      "sourceUrl": "https://aqaralife.shop/product/detail.html?product_no=28"
    },
    "officialUrl": "https://aqaralife.shop/product/detail.html?product_no=28",
    "note": "",
    "availability": "공식몰 품절 표시 · 재확인"
  },
  {
    "id": "aqara-climate",
    "name": "Aqara 온습도 센서 T1",
    "protocol": "Zigbee",
    "power": "배터리",
    "price": {
      "amount": 28600,
      "currency": "KRW",
      "market": "한국 공식몰",
      "basis": "판매가",
      "checkedAt": "2026-10-26",
      "sourceUrl": "https://aqaralife.shop/product/detail.html?product_no=26"
    },
    "officialUrl": "https://aqaralife.shop/product/detail.html?product_no=26",
    "note": "",
    "availability": "공식몰 품절 표시 · 재확인"
  },
  {
    "id": "fp2",
    "name": "Aqara 활동 모니터링 센서 FP2",
    "protocol": "Wi-Fi",
    "power": "상시 USB 전원",
    "price": {
      "amount": 156200,
      "currency": "KRW",
      "market": "한국 공식몰",
      "basis": "판매가",
      "checkedAt": "2026-10-26",
      "sourceUrl": "https://aqaralife.shop/product/detail.html?product_no=35"
    },
    "officialUrl": "https://aqaralife.shop/product/detail.html?product_no=35",
    "note": "Zigbee 기기가 아닙니다. 다구역 예시이며 실제 설치 조건을 확인하세요.",
    "availability": "확인 필요"
  },
  {
    "id": "inspelning",
    "name": "IKEA INSPELNING · 105.698.45",
    "protocol": "Zigbee",
    "power": "콘센트",
    "price": {
      "amount": 12900,
      "currency": "KRW",
      "market": "한국 공식몰",
      "basis": "판매가",
      "checkedAt": "2026-10-26",
      "sourceUrl": "https://www.ikea.com/kr/ko/p/inspelning-plug-smart-energy-monitor-10569845/"
    },
    "officialUrl": "https://www.ikea.com/kr/ko/p/inspelning-plug-smart-energy-monitor-10569845/",
    "note": "소형 가전 전력 측정 비교용입니다. 식기세척기·오븐용 16A/20A 대체품으로 자동 추천하지 않습니다.",
    "availability": "확인 필요"
  },
  {
    "id": "fp1e",
    "name": "Aqara Presence Sensor FP1E",
    "protocol": "Zigbee",
    "power": "상시 USB 전원",
    "price": {
      "amount": 4999,
      "currency": "USD",
      "market": "미국 공식몰",
      "basis": "판매가",
      "checkedAt": "2026-10-26",
      "sourceUrl": "https://us.aqara.com/products/presence-sensor-fp1e"
    },
    "officialUrl": "https://us.aqara.com/products/presence-sensor-fp1e",
    "note": "국내 판매가가 아닌 USD 가격입니다. 단일 구역 재실 감지 후보입니다.",
    "availability": "확인 필요"
  },
  {
    "id": "sonoff-climate",
    "name": "SONOFF SNZB-02D · 1 Pack",
    "protocol": "Zigbee",
    "power": "배터리",
    "price": {
      "amount": 1390,
      "currency": "USD",
      "market": "글로벌 공식몰 · USD",
      "basis": "표시 할인가 · 세금 별도",
      "checkedAt": "2026-10-26",
      "sourceUrl": "https://sonoff.tech/products/sonoff-snzb-02d-zigbee-lcd-smart-temperature-humidity-sensor"
    },
    "officialUrl": "https://sonoff.tech/products/sonoff-snzb-02d-zigbee-lcd-smart-temperature-humidity-sensor",
    "note": "",
    "availability": "확인 필요"
  },
  {
    "id": "sonoff-button",
    "name": "SONOFF SNZB-01P · 1 Pack",
    "protocol": "Zigbee",
    "power": "CR2477",
    "price": {
      "amount": 1690,
      "currency": "USD",
      "market": "글로벌 공식몰 · USD",
      "basis": "표시 판매가 · 세금 별도",
      "checkedAt": "2026-10-26",
      "sourceUrl": "https://sonoff.tech/products/sonoff-zigbee-wireless-switch-snzb-01p"
    },
    "officialUrl": "https://sonoff.tech/products/sonoff-zigbee-wireless-switch-snzb-01p",
    "note": "",
    "availability": "확인 필요"
  },
  {
    "id": "sonoff-door",
    "name": "SONOFF SNZB-04P · 1 Pack",
    "protocol": "Zigbee",
    "power": "CR2477",
    "price": {
      "amount": 1590,
      "currency": "USD",
      "market": "글로벌 공식몰 · USD",
      "basis": "표시 판매가 · 세금 별도",
      "checkedAt": "2026-10-26",
      "sourceUrl": "https://sonoff.tech/products/sonoff-zigbee-door-window-sensor-snzb-04p"
    },
    "officialUrl": "https://sonoff.tech/products/sonoff-zigbee-door-window-sensor-snzb-04p",
    "note": "",
    "availability": "확인 필요"
  },
  {
    "id": "sonoff-presence",
    "name": "SONOFF SNZB-06P",
    "protocol": "Zigbee",
    "power": "상시 USB 전원",
    "price": {
      "amount": 1790,
      "currency": "USD",
      "market": "글로벌 공식몰 · USD",
      "basis": "표시 판매가 · 세금 별도",
      "checkedAt": "2026-10-26",
      "sourceUrl": "https://sonoff.tech/products/sonoff-zigbee-human-presence-sensor-snzb-06p"
    },
    "officialUrl": "https://sonoff.tech/products/sonoff-zigbee-human-presence-sensor-snzb-06p",
    "note": "단일 구역 재실 감지입니다. 구역을 세 개로 나누는 기능과 다릅니다.",
    "availability": "확인 필요"
  },
  {
    "id": "sonoff-relay",
    "name": "SONOFF ZBMINIL2",
    "protocol": "Zigbee",
    "power": "벽 배선 · 무중성선",
    "price": {
      "amount": 1290,
      "currency": "USD",
      "market": "글로벌 공식몰 · USD",
      "basis": "표시 할인가 · 세금 별도",
      "checkedAt": "2026-10-26",
      "sourceUrl": "https://sonoff.tech/products/sonoff-zbmini-extreme-zigbee-smart-switch-zbminil2"
    },
    "officialUrl": "https://sonoff.tech/products/sonoff-zbmini-extreme-zigbee-smart-switch-zbminil2",
    "note": "조명 부하·설치 공간·인증 확인 후 전문가 설치가 필요합니다.",
    "availability": "확인 필요"
  },
  {
    "id": "somrig",
    "name": "IKEA SOMRIG",
    "protocol": "Zigbee",
    "power": "AAA 배터리 후보",
    "price": null,
    "officialUrl": null,
    "note": "정확한 모델의 현재 공식 판매가를 확인하지 못했습니다. 견적에 임의 금액을 넣지 않습니다.",
    "availability": "확인 필요"
  },
  {
    "id": "vallhorn",
    "name": "IKEA VALLHORN",
    "protocol": "Zigbee",
    "power": "AAA 배터리 후보",
    "price": null,
    "officialUrl": null,
    "note": "정확한 모델의 현재 공식 판매가를 확인하지 못했습니다. 견적에 임의 금액을 넣지 않습니다.",
    "availability": "확인 필요"
  },
  {
    "id": "parasoll",
    "name": "IKEA PARASOLL",
    "protocol": "Zigbee",
    "power": "AAA 배터리 후보",
    "price": null,
    "officialUrl": null,
    "note": "정확한 모델의 현재 공식 판매가를 확인하지 못했습니다. 견적에 임의 금액을 넣지 않습니다.",
    "availability": "확인 필요"
  },
  {
    "id": "p1",
    "name": "Aqara 모션 센서 P1",
    "protocol": "Zigbee",
    "power": "배터리",
    "price": null,
    "officialUrl": null,
    "note": "정확한 모델의 현재 공식 판매가를 확인하지 못했습니다. 견적에 임의 금액을 넣지 않습니다.",
    "availability": "확인 필요"
  },
  {
    "id": "tradfri",
    "name": "IKEA TRÅDFRI 색온도 전구",
    "protocol": "Zigbee",
    "power": "전구 소켓",
    "price": null,
    "officialUrl": null,
    "note": "정확한 모델의 현재 공식 판매가를 확인하지 못했습니다. 견적에 임의 금액을 넣지 않습니다.",
    "availability": "확인 필요"
  },
  {
    "id": "curtain-robot",
    "name": "MOES Zigbee 커튼 로봇",
    "protocol": "Zigbee",
    "power": "충전식",
    "price": null,
    "officialUrl": "https://moeshouse.com/products/smart-electric-curtain-robot-timing-auto-opener-closer-app-remote-control",
    "note": "정확한 모델의 현재 공식 판매가를 확인하지 못했습니다. 견적에 임의 금액을 넣지 않습니다.",
    "availability": "확인 필요"
  },
  {
    "id": "moes-4",
    "name": "Moes / Tuya TS0044 4구 버튼",
    "protocol": "Zigbee",
    "power": "배터리",
    "price": null,
    "officialUrl": null,
    "note": "정확한 모델의 현재 공식 판매가를 확인하지 못했습니다. 견적에 임의 금액을 넣지 않습니다.",
    "availability": "확인 필요"
  },
  {
    "id": "zy-m100",
    "name": "Tuya ZY-M100",
    "protocol": "Zigbee",
    "power": "상시 USB 전원",
    "price": null,
    "officialUrl": null,
    "note": "정확한 모델의 현재 공식 판매가를 확인하지 못했습니다. 견적에 임의 금액을 넣지 않습니다.",
    "availability": "확인 필요"
  },
  {
    "id": "tuya-plug",
    "name": "Tuya 고부하 전력 측정 KR 플러그",
    "protocol": "Zigbee",
    "power": "콘센트",
    "price": null,
    "officialUrl": null,
    "note": "정확한 모델의 현재 공식 판매가를 확인하지 못했습니다. 견적에 임의 금액을 넣지 않습니다.",
    "availability": "확인 필요"
  },
  {
    "id": "aqara-h1",
    "name": "Aqara H1 무중성선 스위치",
    "protocol": "Zigbee",
    "power": "벽 배선",
    "price": null,
    "officialUrl": null,
    "note": "정확한 모델의 현재 공식 판매가를 확인하지 못했습니다. 견적에 임의 금액을 넣지 않습니다.",
    "availability": "확인 필요"
  },
  {
    "id": "mattress-diy",
    "name": "도어 센서 + 매트리스 압력 패드 DIY",
    "protocol": "Zigbee",
    "power": "센서별 확인",
    "price": null,
    "officialUrl": null,
    "note": "정확한 모델의 현재 공식 판매가를 확인하지 못했습니다. 견적에 임의 금액을 넣지 않습니다.",
    "availability": "확인 필요"
  }
];
export const scenarios:Scenario[] = [
  {
    "id": "sleep",
    "room": "bedroom",
    "title": "머리맡 취침 버튼",
    "description": "천장등을 끄고 커튼을 닫습니다. 발밑 센서는 대기합니다.",
    "check": "정확한 모델·버튼 동작·배터리 종류 확인",
    "flow": [
      "버튼 누르기",
      "취침 규칙",
      "조명 소등"
    ],
    "brightness": 0,
    "curtain": 0,
    "options": [
      "aqara-button",
      "somrig"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재"
    ]
  },
  {
    "id": "footlight",
    "room": "bedroom",
    "title": "새벽에 침대에서 내려오기",
    "description": "바닥 쪽 조명만 15%로 켭니다. 눈부심을 줄이는 배치를 보여 줍니다.",
    "check": "침대 하단 설치 각도·실제 감지 범위·대기 시간 시험",
    "flow": [
      "바닥 움직임 감지",
      "새벽 시간 확인",
      "하단 점등"
    ],
    "brightness": 15,
    "curtain": 0,
    "options": [
      "p1",
      "vallhorn"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재"
    ]
  },
  {
    "id": "curtain",
    "room": "bedroom",
    "title": "아침에 커튼 열기",
    "description": "커튼이 열리며 햇살과 기상 조명이 들어옵니다.",
    "check": "레일·봉·커튼 무게·충전 위치·양개형 로봇 수량 확인",
    "flow": [
      "기상 예약",
      "커튼 열기",
      "기상 조명 70%"
    ],
    "brightness": 70,
    "curtain": 100,
    "options": [
      "curtain-robot"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재"
    ]
  },
  {
    "id": "mattress",
    "room": "bedroom",
    "title": "매트리스에 누워 보기",
    "description": "매트리스 아래 압력 패드를 도면으로 보여 줍니다.",
    "check": "DIY(직접 제작)·개조·하중 시험 필요. 0.1초 반응 보장 아님",
    "flow": [
      "압력 변화",
      "접점 신호",
      "침대 재실 상태"
    ],
    "brightness": 35,
    "curtain": 25,
    "options": [
      "mattress-diy"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재",
      "압력 패드·납땜·접점·하중 시험. 완제품이 아닙니다."
    ]
  },
  {
    "id": "leak",
    "room": "kitchen",
    "title": "싱크대 아래 누수",
    "description": "하부장 아래 물기와 센서 경고 문구를 보여 줍니다.",
    "check": "경보 방식·설치 위치·실제 물 접촉 시험",
    "flow": [
      "물 접촉",
      "누수 감지",
      "경고 표시"
    ],
    "brightness": 60,
    "curtain": 40,
    "options": [
      "badring",
      "aqara-leak"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재"
    ]
  },
  {
    "id": "appliance",
    "room": "kitchen",
    "title": "식기세척기 작동 완료",
    "description": "전력 수치가 낮아진 뒤 일정 시간 유지되면 완료를 알립니다. 대형 가전용 고부하 플러그는 별도 적합성 확인이 필요합니다.",
    "check": "16A·20A 표기 외 인증·연속 부하·접지·가전 제조사 허용 조건 확인",
    "flow": [
      "전력 하락",
      "일정 시간 유지",
      "완료 알림"
    ],
    "brightness": 60,
    "curtain": 40,
    "options": [
      "tuya-plug",
      "inspelning"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재"
    ]
  },
  {
    "id": "presence",
    "room": "kitchen",
    "title": "설거지 중 가만히 서 있기",
    "description": "재실 센서 감지 범위와 작업등 유지 상태를 보여 줍니다.",
    "check": "상시 전원·정확한 세부 모델·물줄기 및 환풍기 오감지 시험",
    "flow": [
      "재실 감지",
      "작업등 유지",
      "자리 비움 후 소등"
    ],
    "brightness": 85,
    "curtain": 40,
    "options": [
      "fp1e",
      "zy-m100"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재"
    ]
  },
  {
    "id": "fridge",
    "room": "kitchen",
    "title": "냉장고 문 덜 닫힘",
    "description": "문 열림이 유지되면 주의 문구를 보여 줍니다.",
    "check": "자석 감지 간격·외부 부착 위치·알림 대기 시간 확인",
    "flow": [
      "문 열림",
      "설정 시간 경과",
      "알림"
    ],
    "brightness": 60,
    "curtain": 40,
    "options": [
      "aqara-door",
      "parasoll"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재"
    ]
  },
  {
    "id": "shortcuts",
    "room": "desk",
    "title": "4구 버튼으로 업무 시작",
    "description": "집중·회의·휴식에 따른 조명 변화를 보여 줍니다.",
    "check": "세부 모델별 클릭·더블클릭·길게 누르기 지원 확인",
    "flow": [
      "버튼 동작",
      "선택 규칙",
      "집중 조명"
    ],
    "brightness": 90,
    "curtain": 50,
    "options": [
      "moes-4"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재",
      "4개 버튼 × 클릭·더블클릭·길게 누르기 = 최대 12개 동작은 모델별 확인"
    ]
  },
  {
    "id": "hidden-button",
    "room": "desk",
    "title": "책상 밑 숨김 버튼",
    "description": "상판 아래 버튼의 부착 위치를 확대해 보여 줍니다.",
    "check": "PC 전원 제어는 별도 연결 필요. 버튼만으로 바로 켜지지 않음",
    "flow": [
      "숨김 버튼",
      "별도 PC 연결",
      "작업 준비"
    ],
    "brightness": 75,
    "curtain": 50,
    "options": [
      "sonoff-button",
      "somrig"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재"
    ]
  },
  {
    "id": "desk-light",
    "room": "desk",
    "title": "따뜻한 조명으로 휴식",
    "description": "조명 색과 밝기를 휴식 분위기로 바꿉니다.",
    "check": "소켓·밝기·색온도 조절 지원을 정확한 모델로 확인",
    "flow": [
      "휴식 선택",
      "밝기 낮춤",
      "따뜻한 색"
    ],
    "brightness": 35,
    "curtain": 50,
    "options": [
      "tradfri"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재"
    ]
  },
  {
    "id": "climate",
    "room": "desk",
    "title": "온도·습도 확인",
    "description": "기기의 작은 화면 대신 옆 카드에도 큰 숫자를 보여 줍니다.",
    "check": "온습도만으로 이산화탄소 농도나 공기질을 판단하지 않음",
    "flow": [
      "온습도 측정",
      "상태 표시",
      "사용자 확인"
    ],
    "brightness": 65,
    "curtain": 50,
    "options": [
      "sonoff-climate",
      "aqara-climate"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재"
    ]
  },
  {
    "id": "door-light",
    "room": "bathroom",
    "title": "문 열고 들어가기",
    "description": "문 열림 신호에 조명이 켜지는 모습을 보여 줍니다.",
    "check": "5% 열림은 연출값. 실제 반응은 자석과 센서 간격으로 결정",
    "flow": [
      "문 열림 신호",
      "점등 규칙",
      "조명 켜짐"
    ],
    "brightness": 90,
    "curtain": 20,
    "options": [
      "aqara-door",
      "sonoff-door"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재"
    ]
  },
  {
    "id": "zones",
    "room": "bathroom",
    "title": "감지 구역 나누기",
    "description": "한 구역 센서와 여러 구역을 구분하는 센서를 비교합니다. FP2를 선택하면 세면대·변기·샤워 구역을 나누는 예시가 나타납니다.",
    "check": "FP2는 Zigbee 기기가 아님. 구역 수·연결 방식을 별도 비교",
    "flow": [
      "구역 감지",
      "해당 조명 선택",
      "상태 표시"
    ],
    "brightness": 75,
    "curtain": 20,
    "options": [
      "sonoff-presence",
      "fp2"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재"
    ]
  },
  {
    "id": "ventilation",
    "room": "bathroom",
    "title": "샤워 후 습기 빼기",
    "description": "습도 변화와 환풍기 작동 조건을 함께 보여 줍니다.",
    "check": "습도 기준·종료 조건·설치 위치·방수 조건 확인",
    "flow": [
      "습도 상승",
      "환풍 규칙",
      "기준 회복 후 종료"
    ],
    "brightness": 80,
    "curtain": 20,
    "options": [
      "aqara-climate",
      "sonoff-climate"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재"
    ]
  },
  {
    "id": "wiring",
    "room": "bathroom",
    "title": "벽 스위치 설치 확인",
    "description": "스위치함 내부의 배선 조건을 도면으로 살펴봅니다.",
    "check": "중성선·부하·설치 공간·제조사 조건 확인. 전기 작업은 전문가 진행",
    "flow": [
      "배선 확인",
      "설치 적합성 검토",
      "기기 선택"
    ],
    "brightness": 70,
    "curtain": 20,
    "options": [
      "sonoff-relay",
      "aqara-h1"
    ],
    "extras": [
      "호환 허브 또는 HA 코디네이터",
      "연결할 조명·가전 및 설치 부자재"
    ]
  }
];

export const deviceById = Object.fromEntries(devices.map(d=>[d.id,d])) as Record<string,Device>;
export const formatPrice=(p:Device['price'])=>p ? p.currency==='KRW'?new Intl.NumberFormat('ko-KR').format(p.amount)+'원':'US$'+(p.amount/100).toFixed(2) : '공식 가격 확인 필요';
export function restoreChoices(raw:string|null):Choice[]{try{const data=JSON.parse(raw||'[]');if(!Array.isArray(data))return [];const seen=new Set<string>();return data.flatMap(v=>{if(!v||typeof v!=='object')return [];const s=scenarios.find(s=>s.id===v.scenarioId);if(!s||!s.options.includes(v.deviceId)||!Number.isInteger(v.quantity)||v.quantity<1||v.quantity>10||seen.has(s.id))return [];seen.add(s.id);return [{scenarioId:s.id,deviceId:v.deviceId,quantity:v.quantity,checked:false}];});}catch{return []}}
export function quote(choices:Choice[]){const result={KRW:0,USD:0,unknown:0};for(const c of choices){const s=scenarios.find(s=>s.id===c.scenarioId);const d=deviceById[c.deviceId];if(!s||!s.options.includes(c.deviceId)||!Number.isInteger(c.quantity)||c.quantity<1||c.quantity>10)throw Error('INVALID_CHOICE');if(d.price)result[d.price.currency]+=d.price.amount*c.quantity;else result.unknown+=c.quantity;}return result;}
export interface SceneState {room:RoomId;scenarioId:string;brightness:number;curtain:number;door:number;wet:boolean;presence:boolean;fan:boolean;zones:number;pressure:boolean;blueprint:boolean;temperature:number;humidity:number;power:number;warm:boolean}
export function sceneState(s:Scenario,deviceId:string,active=true):SceneState{return {room:s.room,scenarioId:s.id,brightness:active?s.brightness:0,curtain:active?s.curtain:0,door:active&&['door-light','fridge'].includes(s.id)?.3:0,wet:active&&s.id==='leak',presence:active&&['presence','zones'].includes(s.id),fan:active&&s.id==='ventilation',zones:s.id==='zones'&&deviceId==='fp2'?3:1,pressure:active&&s.id==='mattress',blueprint:s.id==='wiring'||s.id==='mattress',temperature:active?27:23,humidity:active&&s.id==='ventilation'?78:48,power:active?2:1800,warm:s.id!=='shortcuts'};}
