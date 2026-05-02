export default {
  testEnvironment: 'jsdom',
  transform: {},
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'src/**/*.jsx',
    '!src/main.jsx',
    '!src/App.jsx'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
