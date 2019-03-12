const { assert } = require('chai');
const restler = require('restler');
const sinon = require('sinon');

const skylabGenesis = require('../lib/skylabGenesis');

const API_KEY = 'API_CLIENT_TEST_KEY';

describe('Skylab Genesis API client', () => {
  let client;

  before((done) => {
    client = skylabGenesis(API_KEY);

    done();
  });

  describe('jobs', () => {
    describe('listJobs', () => {
      it('should return the jobs', (done) => {
        const stub = sinon.stub(restler, 'get').returns({
          once: sinon.stub().yields([{ id: 1 }], {}),
        });

        client.listJobs({}, (err, result) => {
          assert.equal(result.length, 1);

          stub.restore();

          done();
        });
      });
    });

    describe('createJob', () => {
      it('should return the created job', (done) => {
        const stub = sinon.stub(restler, 'postJson').returns({
          once: sinon.stub().yields({ id: 1 }, {}),
        });

        client.createJob({}, (err, result) => {
          assert.equal(result.id, 1);

          stub.restore();

          done();
        });
      });
    });

    describe('getJob', () => {
      it('should return the job', (done) => {
        const stub = sinon.stub(restler, 'get').returns({
          once: sinon.stub().yields({ id: 1 }, {}),
        });

        client.getJob({ id: 1 }, (err, result) => {
          assert.equal(result.id, 1);

          stub.restore();

          done();
        });
      });
    });

    describe('updateJob', () => {
      it('should return the updated job', (done) => {
        const stub = sinon.stub(restler, 'patchJson').returns({
          once: sinon.stub().yields({ id: 1 }, {}),
        });

        client.updateJob({ id: 1 }, (err, result) => {
          assert.equal(result.id, 1);

          stub.restore();

          done();
        });
      });
    });

    describe('deleteJob', () => {
      it('should return empty object', (done) => {
        const stub = sinon.stub(restler, 'del').returns({
          once: sinon.stub().yields({}, { statusCode: 204 }),
        });

        client.deleteJob({ id: 1 }, (err, result) => {
          assert.isEmpty(result);

          stub.restore();

          done();
        });
      });
    });

    describe('processJob', () => {
      it('should return the processed job', (done) => {
        const stub = sinon.stub(restler, 'post').returns({
          once: sinon.stub().yields({ id: 1 }, {}),
        });

        client.processJob({ id: 1 }, (err, result) => {
          assert.equal(result.id, 1);

          stub.restore();

          done();
        });
      });
    });

    describe('cancelJob', () => {
      it('should return the canceled job', (done) => {
        const stub = sinon.stub(restler, 'post').returns({
          once: sinon.stub().yields({ id: 1 }, {}),
        });

        client.cancelJob({ id: 1 }, (err, result) => {
          assert.equal(result.id, 1);

          stub.restore();

          done();
        });
      });
    });
  });
});
