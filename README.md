# 🧩 Sudoku Master

React와 TypeScript, Tailwind CSS v4를 사용하여 만든 현대적인 스도쿠 웹 애플리케이션입니다. 동적인 퍼즐 생성 알고리즘과 다양한 편의 기능을 제공합니다.

![Sudoku Preview](https://via.placeholder.com/800x450?text=Sudoku+Master+App)

## ✨ 주요 기능 (Key Features)

- **동적 퍼즐 생성 (Dynamic Puzzle Generation):** 백트래킹 알고리즘을 사용하여 매번 새로운 풀이 가능한 스도쿠 보드를 생성합니다.
- **메모 모드 (Note Mode):** 각 칸에 들어갈 수 있는 숫자 후보들을 메모할 수 있습니다.
- **실시간 검증 (Real-time Validation):** 규칙에 어긋나는 숫자를 입력하면 즉시 빨간색으로 표시됩니다.
- **힌트 시스템 (Hint System):** 막히는 구간에서 정답을 한 칸씩 확인할 수 있습니다.
- **타이머 (Timer):** 퍼즐을 푸는 데 걸리는 시간을 측정합니다.
- **반응형 디자인 (Responsive UI):** Tailwind CSS v4를 활용하여 모바일과 데스크톱 환경 모두에서 최적화된 화면을 제공합니다.

## 🛠 기술 스택 (Tech Stack)

- **Frontend:** React (TypeScript)
- **Styling:** Tailwind CSS v4
- **Build Tool:** Vite
- **Algorithm:** Backtracking (for Sudoku solving & generation)

## 🚀 시작하기 (Getting Started)

### 사전 준비 (Prerequisites)
- [Node.js](https://nodejs.org/) (v18 이상 권장)
- npm

### 설치 및 실행 (Installation & Run)

1. 저장소 복제:
   ```bash
   git clone https://github.com/chanpa09/Sudoku.git
   cd Sudoku
   ```

2. 의존성 설치:
   ```bash
   npm install
   ```

3. 개발 서버 실행:
   ```bash
   npm run dev
   ```
   브라우저에서 `http://localhost:5173`으로 접속하세요.

4. 프로젝트 빌드:
   ```bash
   npm run build
   ```

## 🎮 게임 방법 (How to Play)

1. 비어 있는 칸을 클릭하여 선택합니다.
2. 아래 숫자 패드(1-9)를 클릭하여 숫자를 입력합니다.
3. 숫자를 한 번 더 클릭하면 입력된 숫자가 삭제됩니다.
4. **Notes 버튼:** 토글하여 메모 모드를 켜고 끌 수 있습니다. 메모 모드에서는 칸에 작은 숫자로 후보군을 표시합니다.
5. **Hint 버튼:** 선택한 칸의 정답을 채워줍니다.
6. **New Game:** 현재 게임을 초기화하고 새로운 퍼즐을 생성합니다.

## 📂 폴더 구조 (Folder Structure)

- `src/utils/sudoku.ts`: 스도쿠 핵심 알고리즘 (생성, 검증, 해결)
- `src/hooks/useSudoku.ts`: 게임 상태 및 비즈니스 로직 관리 커스텀 훅
- `src/components/`: UI 컴포넌트
  - `Board.tsx`: 9x9 그리드 렌더링
  - `Cell.tsx`: 개별 칸 렌더링 및 스타일링
  - `Controls.tsx`: 숫자 패드 및 액션 버튼
  - `Header.tsx`: 타이머 및 게임 정보 표시

## 📝 라이선스 (License)

이 프로젝트는 MIT 라이선스를 따릅니다.
