const { roundUp, getRoomOrientInfo, calcRoom } = require('../js/carpet-calculator.js');

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
});

describe('calcRoom', () => {
  test('calculates basic room without offcuts', () => {
    const room = { length: 4, width: 3 };
    const result = calcRoom(room, 4, 0.1, []);
    expect(result.drops).toBe(1);
    expect(result.carpetArea).toBeCloseTo(12);
  });
  test('uses offcut for full room', () => {
    const room = { length: 4, width: 3 };
    const offcuts = [{ from: 'Room1', width: 4, length: 4 }];
    const result = calcRoom(room, 4, 0.1, offcuts);
    expect(result.offcutUsed).toContain('Entire room from offcut');
    expect(offcuts.length).toBe(1); // surplus added back
  });
  test('handles room with waste', () => {
    const room = { length: 4, width: 3 };
    const result = calcRoom(room, 4, 0.1, [], 0, 0.1);
    expect(result.roomLen).toBeGreaterThan(4);
  });
});