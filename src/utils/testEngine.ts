import { 
  findNakedTripleHint, 
  findHiddenTripleHint, 
  findSwordfishHint, 
  evaluateBoardDifficulty 
} from './hintLogic';
import type { Board } from './sudokuBase';

// Helper to create empty board
const createEmptyBoard = (): Board => Array.from({ length: 9 }, () => Array(9).fill(0));

// Test 1: Naked Triple Detection
const testNakedTriple = () => {
  console.log('--- Test: Naked Triple ---');
  const board = createEmptyBoard();
  
  // Initialize notes with size 9 sets
  const notes: Set<number>[][] = Array.from({ length: 9 }, () => 
    Array.from({ length: 9 }, () => new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9]))
  );

  // Set up Naked Triple in Row 0:
  // Cell (0,0): {1, 2}
  // Cell (0,1): {2, 3}
  // Cell (0,2): {1, 3}
  // Cell (0,3): {1, 2, 3, 4} (4 should remain after elimination)
  
  notes[0][0] = new Set([1, 2]);
  notes[0][1] = new Set([2, 3]);
  notes[0][2] = new Set([1, 3]);
  notes[0][3] = new Set([1, 2, 3, 4]);

  const hint = findNakedTripleHint(board, notes);

  if (hint && hint.technique === '드러난 3쌍') {
    console.log('✅ PASS: Naked Triple technique detected successfully!');
    // Verify removable notes contains eliminating (0,3) value 1, 2, 3
    const eliminatedValues = hint.removableNotes?.filter(n => n.row === 0 && n.col === 3).map(n => n.value) || [];
    const hasCorrectEliminations = [1, 2, 3].every(val => eliminatedValues.includes(val));
    
    if (hasCorrectEliminations) {
      console.log('✅ PASS: Correct candidates (1, 2, 3) earmarked for removal from non-triple cells!');
    } else {
      console.error('❌ FAIL: Incorrect eliminations. Got:', eliminatedValues);
    }
  } else {
    console.error('❌ FAIL: Naked Triple technique not detected.');
  }
};

// Test 2: Hidden Triple Detection
const testHiddenTriple = () => {
  console.log('--- Test: Hidden Triple ---');
  const board = createEmptyBoard();
  const notes: Set<number>[][] = Array.from({ length: 9 }, () => 
    Array.from({ length: 9 }, () => new Set<number>([4, 5, 6, 7, 8, 9]))
  );

  // Hidden Triple of {1, 2, 3} in Row 0, cells (0,0), (0,1), (0,2)
  // Let's add them mixed with other numbers
  notes[0][0] = new Set([1, 2, 4, 5]);
  notes[0][1] = new Set([2, 3, 5, 6]);
  notes[0][2] = new Set([1, 3, 6, 7]);
  
  // Make sure no other cells in Row 0 contain 1, 2, or 3
  // They are already initialized to [4, 5, 6, 7, 8, 9] which is safe!

  const hint = findHiddenTripleHint(board, notes);

  if (hint && hint.technique === '숨은 3쌍') {
    console.log('✅ PASS: Hidden Triple technique detected successfully!');
    
    // Verify removable notes contains removing 4, 5, 6, 7 from those cells
    const eliminated = hint.removableNotes || [];
    const cell00Removals = eliminated.filter(n => n.row === 0 && n.col === 0).map(n => n.value);
    const cell01Removals = eliminated.filter(n => n.row === 0 && n.col === 1).map(n => n.value);
    const cell02Removals = eliminated.filter(n => n.row === 0 && n.col === 2).map(n => n.value);

    if (cell00Removals.includes(4) && cell00Removals.includes(5) &&
        cell01Removals.includes(5) && cell01Removals.includes(6) &&
        cell02Removals.includes(6) && cell02Removals.includes(7)) {
      console.log('✅ PASS: Correct candidates earmarked for removal from Hidden Triple cells!');
    } else {
      console.error('❌ FAIL: Incorrect eliminations for hidden triple cells. Got:', eliminated);
    }
  } else {
    console.error('❌ FAIL: Hidden Triple technique not detected.');
  }
};

// Test 3: Swordfish Detection
const testSwordfish = () => {
  console.log('--- Test: Swordfish ---');
  const board = createEmptyBoard();
  
  // Initialize notes to a safe set of candidates (without 5)
  const notes: Set<number>[][] = Array.from({ length: 9 }, () => 
    Array.from({ length: 9 }, () => new Set<number>([1, 2, 3, 4, 6, 7, 8, 9]))
  );

  // Row 1: Col 0, 3
  notes[1][0].add(5);
  notes[1][3].add(5);

  // Row 4: Col 3, 6
  notes[4][3].add(5);
  notes[4][6].add(5);

  // Row 7: Col 0, 6
  notes[7][0].add(5);
  notes[7][6].add(5);

  // Add 5 to cells we want to eliminate (Row 2 Col 0, Row 5 Col 3)
  notes[2][0].add(5);
  notes[5][3].add(5);

  const hint = findSwordfishHint(board, notes);

  if (hint && hint.technique === '소드피쉬') {
    console.log('✅ PASS: Swordfish technique detected successfully!');
    const eliminated = hint.removableNotes || [];
    const hasCorrectEliminations = eliminated.some(n => n.row === 2 && n.col === 0 && n.value === 5) &&
                                   eliminated.some(n => n.row === 5 && n.col === 3 && n.value === 5);
    
    if (hasCorrectEliminations) {
      console.log('✅ PASS: Correct candidates (5) earmarked for removal from Swordfish columns!');
    } else {
      console.error('❌ FAIL: Incorrect Swordfish eliminations. Got:', eliminated);
    }
  } else {
    console.error('❌ FAIL: Swordfish technique not detected.');
  }
};

// Run all tests
const runAllTests = () => {
  console.log('🚀 RUNNING SUDOKU ENGINE TEST SUITE');
  try {
    testNakedTriple();
    testHiddenTriple();
    testSwordfish();
    
    console.log('--- Test: Difficulty Evaluation ---');
    const emptyBoard = createEmptyBoard();
    const difficulty = evaluateBoardDifficulty(emptyBoard);
    console.log(`✅ PASS: Difficulty of empty board evaluated to: ${difficulty}`);
    
    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('💥 TEST RUN ENCOUNTERED AN ERROR:', err);
  }
};

runAllTests();
