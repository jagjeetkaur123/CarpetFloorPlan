const { getRandomColor } = require('../js/app.js');

describe('getRandomColor', () => {
  test('returns valid color from list', () => {
    const color = getRandomColor();
    const validColors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];
    expect(validColors).toContain(color);
  });
});