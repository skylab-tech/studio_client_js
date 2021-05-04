const { assert } = require('chai');
const sinon = require('sinon');

const skylabStudio = require('../lib/skylabStudio');

const API_KEY = 'API_CLIENT_TEST_KEY';

describe('Skylab Studio API client', () => {
  let client;

  before((done) => {
    client = skylabStudio(API_KEY);

    done();
  });

  describe('_debug', () => {
    it('should console.log parameter when debug mode is on', (done) => {
      client.DEBUG = true;

      const spy = sinon.spy(console, 'log');

      client._debug('test');

      assert(spy.withArgs('SKYLABTECH: test').calledOnce);

      spy.restore();

      done();
    });

    it('should not console.log parameter when debug mode is off', (done) => {
      client.DEBUG = false;

      const spy = sinon.spy(console, 'log');

      client._debug('test');

      assert(spy.withArgs('SKYLABTECH: test').notCalled);

      spy.restore();

      done();
    });
  });

  describe('_buildHeaders', () => {
    it('should build the headers', (done) => {
      const headers = client._buildHeaders('test');

      assert.equal(Object.keys(headers).length, 2);

      done();
    });
  });

  describe('_getOptions', () => {
    it('should return options', (done) => {
      const options = client._getOptions();

      assert.isDefined(options.headers);

      done();
    });
  });

  describe('_buildUrl', () => {
    it('should build default URL', (done) => {
      const url = client._buildUrl();

      assert.equal(url, 'https://studio.skylabtech.ai/api/v1/');

      done();
    });

    it('should build URL with resource', (done) => {
      const url = client._buildUrl('jobs');

      assert.equal(url, 'https://studio.skylabtech.ai/api/v1/jobs');

      done();
    });

    it('should build URL with identified', (done) => {
      const url = client._buildUrl('jobs', '1');

      assert.equal(url, 'https://studio.skylabtech.ai/api/v1/jobs/1');

      done();
    });

    it('should build URL with action', (done) => {
      const url = client._buildUrl('jobs', '1', 'process');

      assert.equal(url, 'https://studio.skylabtech.ai/api/v1/jobs/1/process');

      done();
    });
  });

  describe('_handleResponse', () => {
    it('should handle client errors', (done) => {
      const spy = sinon.spy(client, '_handleClientError');

      client._handleResponse(new Error('Test error'), null, null);

      assert(spy.calledOnce);

      spy.restore();

      done();
    });

    it('should handle success for 200 response code', (done) => {
      const spy = sinon.spy(client, '_handleSuccess');

      client._handleResponse(null, { statusCode: 200 }, null);

      assert(spy.calledOnce);

      spy.restore();

      done();
    });

    it('should handle success for 399 response code', (done) => {
      const spy = sinon.spy(client, '_handleSuccess');

      client._handleResponse(null, { statusCode: 399 }, null);

      assert(spy.calledOnce);

      spy.restore();

      done();
    });

    it('should handle server error for 400 response code', (done) => {
      const spy = sinon.spy(client, '_handleServerError');

      client._handleResponse(null, { statusCode: 400 }, null);

      assert(spy.calledOnce);

      spy.restore();

      done();
    });
  });

  describe('_handleClientError', () => {
    it('should invoke callback', (done) => {
      const stub = sinon.stub();

      client._handleClientError(new Error('Test error'), null, stub);

      assert(stub.calledOnce);

      done();
    });
  });

  describe('_handleSuccess', () => {
    it('should invoke callback', (done) => {
      const stub = sinon.stub();

      client._handleSuccess({}, { statusCode: 200 }, stub);

      assert(stub.calledOnce);

      done();
    });
  });

  describe('_handleServerError', () => {
    it('should invoke callback', (done) => {
      const stub = sinon.stub();

      client._handleServerError({}, { statusCode: 400 }, stub);

      assert(stub.calledOnce);

      done();
    });
  });
});
