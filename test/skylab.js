const skylab = require('../lib/skylab');

const API_KEY = 'API_CLIENT_TEST_KEY';

describe('SkylabTech API client', () => {
  // eslint-disable-next-line no-unused-vars
  let client;

  before((done) => {
    client = skylab(API_KEY);

    done();
  });
});
