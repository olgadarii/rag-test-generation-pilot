module.exports = {
  use: { baseURL: 'http://localhost:3000' },
  reporter: [['list'], ['json', { outputFile: 'results.json' }]],
};
