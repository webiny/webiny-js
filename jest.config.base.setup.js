// The `jest.config.base.setup.js` file is run by Jest before running the actual test suite.
// By being able to access the `jest` object, we can globally apply the settings we need.

// Runs failed tests five times until they pass or until the max number of retries is exhausted.
// https://jestjs.io/docs/jest-object#jestretrytimesnumretries-options
jest.retryTimes(5);
