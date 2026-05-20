# 스도쿠 (Sudoku Solo Edition)

React, TypeScript, Vite, Tailwind CSS v4로 만든 고도로 정제된 1인용 스도쿠 웹 앱입니다. 강력한 힌트 엔진과 개인화된 통계 시스템을 통해 스도쿠 실력을 향상시키고 몰입감 넘치는 플레이 경험을 제공합니다.

## 주요 기능

- **한국어 UI:** 메뉴, 설정, 통계, 힌트, 접근성 라벨까지 한국어로 완벽 지원합니다.
- **몰입을 위한 Zen 모드:** 타이머와 실수 횟수를 숨기고 오직 숫자에만 집중할 수 있는 평온한 플레이 환경을 제공합니다.
- **감성 테마 및 해금 시스템:** 
    - 기본 6종 테마 + **신규 3종(심야, 숲, 모래)** 테마 제공.
    - 특정 난이도 클리어 및 누적 승수를 통한 테마 잠금 해제 시스템으로 수집의 재미를 더했습니다.
- **웹 오디오 기반 효과음:** 별도의 파일 없이 Web Audio API를 활용한 경쾌한 입력음과 효과음을 지원합니다.
- **개인화된 성장 기록:**
    - **실력 지수(Skill Index):** 난이도와 퍼포먼스를 종합한 나만의 실력 점수를 측정합니다.
    - **해결 기술 통계:** 힌트를 통해 사용된 다양한 스도쿠 기법(X-Wing, Swordfish 등)을 추적하여 학습 상태를 보여줍니다.
- **단계형 지능형 힌트:** 단순 정답 제시를 넘어, 논리적 기법을 단계별로 설명하여 실력 향상을 돕습니다.
- **오늘의 문제:** 매일 갱신되는 난이도별 일일 퍼즐과 과거 문제 풀기 기능을 지원합니다.
- **로컬 저장 및 반응형 디자인:** 모든 진행 상태는 로컬 스토리지에 안전하게 저장되며, 모든 기기에서 최적화된 화면을 제공합니다.

## 기술 스택

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS v4 (Modern CSS-first approach)
- **Audio:** Web Audio API (Synthesized game sounds)
- **Build Tool:** Vite
- **Storage:** Browser Local Storage

## 시작하기

### 설치 및 실행

```bash
npm install
npm run dev
```

### 빌드 및 분석

```bash
npm run build   # 프로덕션 빌드
npm run lint    # 코드 스타일 체크
```

## 게임 시스템

1. **Zen 모드:** 설정에서 활성화하여 압박감 없는 명상적 플레이가 가능합니다.
2. **테마 해금 조건:**
    - **심야 (Midnight):** 첫 승리 시 해금
    - **숲 (Forest):** 누적 10승 달성 시 해금
    - **모래 (Sand):** '전문가' 난이도 클리어 시 해금
3. **실력 지수:** 플레이 데이터가 쌓일수록 더 정확한 나의 위치를 점수로 확인할 수 있습니다.

## 프로젝트 구조

- `src/hooks/useSudoku.ts`: 게임 코어 상태, 히스토리, 통계 및 해금 로직
- `src/utils/hintLogic.ts`: 고급 스도쿠 기법 판정 엔진
- `src/utils/soundManager.ts`: Web Audio API 기반 오디오 유틸리티
- `src/utils/sudoku.ts`: 시드 기반 퍼즐 생성 및 검증 로직
- `src/components/`: UI 컴포넌트 (Board, Cell, Controls, Header, StatsChart 등)

## 라이선스

MIT
