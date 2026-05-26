const { roundUp, getRoomOrientInfo, calcRoom, findOptimisations } = require('../js/carpet-calculator.js');

describe('roundUp', () => {
  test('rounds up to step', () => {
    expect(roundUp(5.3, 0.5)).toBe(5.5);
    expect(roundUp(5.0, 0.5)).toBe(5.0);
  });
  test('handles invalid step', () => {
    expect(roundUp(5.3, 0)).toBe(5.3);
  });
});

describe('getRoomOrientInfo', () => {
  test('auto orientation for square room', () => {
    const room = { length: 4, width: 4, orientation: 'auto' };
    const result = getRoomOrientInfo(room, 4);
    expect(result.totalDrops).toBe(1);
    expect(result.orientLabel).toBe('along length');
  });
  test('forced length orientation', () => {
    const room = { length: 5, width: 3, orientation: 'length' };
    const result = getRoomOrientInfo(room, 4);
    expect(result.runSide).toBe(5);
    expect(result.acrossSide).toBe(3);
  });
  test('auto picks orientation with fewest drops', () => {
    // 5x3 room on 4m roll: along-length=1 drop (run=5,across=3), along-width=2 drops
    const room = { length: 5, width: 3, orientation: 'auto' };
    const result = getRoomOrientInfo(room, 4);
    expect(result.totalDrops).toBe(1);
    expect(result.runSide).toBe(5);
  });
});

describe('calcRoom', () => {
  test('calculates basic room without offcuts', () => {
    const room = { length: 4, width: 3 };
    const result = calcRoom(room, 4, 0.1, []);
    expect(result.drops).toBe(1);
    expect(result.carpetArea).toBeCloseTo(12);
  });

  test('uses offcut for full room with surplus stored back', () => {
    // Room 4x3, forced along-length: run=4, across=3. Offcut 5m wide covers it with 2m surplus.
    const room = { length: 4, width: 3, orientation: 'length' };
    const offcuts = [{ from: 'Room1', width: 5, length: 4 }];
    const result = calcRoom(room, 4, 0.1, offcuts);
    expect(result.offcutUsed).toContain('Entire room from offcut');
    expect(offcuts.length).toBe(1); // 2m surplus stored back
    expect(offcuts[0].width).toBeCloseTo(2);
  });

  test('uses offcut for full room with no surplus', () => {
    // Room 4x4 on 4m roll: run=4, across=4. Offcut exactly 4m wide, no surplus.
    const room = { length: 4, width: 4, orientation: 'length' };
    const offcuts = [{ from: 'Room1', width: 4, length: 4 }];
    const result = calcRoom(room, 4, 0.1, offcuts);
    expect(result.offcutUsed).toContain('Entire room from offcut');
    expect(offcuts.length).toBe(0); // no surplus, nothing stored back
  });

  test('best-fit: uses snuggest offcut, preserves wider one', () => {
    // Room needs 1m across. Two offcuts: 1.5m and 3m. Should pick 1.5m (snuggest fit).
    const room = { length: 4, width: 1, orientation: 'length' };
    const offcuts = [
      { from: 'BigRoom', width: 3, length: 5 },
      { from: 'SmallRoom', width: 1.5, length: 5 },
    ];
    calcRoom(room, 4, 0.1, offcuts);
    // SmallRoom (1.5m) consumed as best fit; its 0.5m surplus stored back; BigRoom preserved
    expect(offcuts.length).toBe(2);
    expect(offcuts.some(o => o.from === 'BigRoom' && o.width === 3)).toBe(true);
    expect(offcuts.some(o => o.from === 'SmallRoom')).toBe(true); // 0.5m surplus
  });

  test('handles room with waste per drop', () => {
    // Room 5x3 on 4m roll, forced along-length: run=5, across=3 (1 drop)
    // roomLen = roundUp(1*(5+0.1), 0.1) = 5.1
    const room = { length: 5, width: 3, orientation: 'length' };
    const result = calcRoom(room, 4, 0.1, [], 0, 0.1);
    expect(result.roomLen).toBeGreaterThan(5);
  });

  test('partial last drop from offcut', () => {
    // Room 5m run, 6m across on 4m roll: 2 drops (D1=4m, D2=2m). Offcut covers 2m last drop.
    const room = { length: 5, width: 6, orientation: 'length' };
    const offcuts = [{ from: 'Donor', width: 2.5, length: 5 }];
    const result = calcRoom(room, 4, 0.1, offcuts);
    expect(result.offcutUsed).toContain('Last drop');
    expect(result.drops).toBe(2);
  });
});

describe('findOptimisations', () => {
  test('detects single beneficiary extension', () => {
    const rollWidth = 4, roundTo = 0.1;
    // Room A: 5x3 → run=5, across=3, offcutW=1m. Room B: 4x0.8 → fits in 1m offcut.
    const rooms = [
      { name: 'A', length: 5, width: 3, orientation: 'length' },
      { name: 'B', length: 4, width: 0.8, orientation: 'length' },
    ];
    const opts = findOptimisations(rooms, rollWidth, roundTo);
    // No extension needed if A's run (5) already >= B's run (4)
    // A's offcut is 1m wide, B needs 0.8m → fits, but extendTo=4 <= currentA=5 → no extension
    // The live system handles this naturally; no pre-scan entry needed
    expect(opts[0]).toBeUndefined();
  });

  test('detects extension when donor run is shorter than beneficiary', () => {
    const rollWidth = 4, roundTo = 0.1;
    // Room A: 3x3 → run=3, across=3, offcutW=1m. Room B: 5x0.8 → needs run=5 > 3=currentA.
    const rooms = [
      { name: 'A', length: 3, width: 3, orientation: 'length' },
      { name: 'B', length: 5, width: 0.8, orientation: 'length' },
    ];
    const opts = findOptimisations(rooms, rollWidth, roundTo);
    expect(opts[0]).toBeDefined();
    expect(opts[0].extendTo).toBe(5);
    expect(opts[0].beneficiaryName).toContain('B');
  });

  test('packs multiple beneficiaries when offcut width allows cascade', () => {
    const rollWidth = 4, roundTo = 0.1;
    // Room A: 3x1 → run=3, across=1, offcutW=3m. Rooms B(1m) and C(1m) both fit in 3m offcut.
    // B needs run=4 > 3 → extension needed.
    const rooms = [
      { name: 'A', length: 3, width: 1, orientation: 'length' },
      { name: 'B', length: 4, width: 1, orientation: 'length' },
      { name: 'C', length: 4, width: 1, orientation: 'length' },
    ];
    const opts = findOptimisations(rooms, rollWidth, roundTo);
    expect(opts[0]).toBeDefined();
    expect(opts[0].beneficiaryName).toContain('B');
    expect(opts[0].beneficiaryName).toContain('C');
    expect(opts[0].allBeneficiaries).toHaveLength(2);
  });
});
