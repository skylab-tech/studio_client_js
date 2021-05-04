const { assert } = require('chai');
const restler = require('restler');
const sinon = require('sinon');

const skylabStudio = require('../lib/skylabStudio');

const API_KEY = 'API_CLIENT_TEST_KEY';

describe('Skylab Studio API client', () => {
  let client;

  before((done) => {
    client = skylabStudio(API_KEY);

    done();
  });

  describe('photos', () => {
    describe('listPhotos', () => {
      it('should return the photos', (done) => {
        const stub = sinon.stub(restler, 'get').returns({
          once: sinon.stub().yields([{ id: 1 }], {}),
        });

        client.listPhotos({}, (err, result) => {
          assert.equal(result.length, 1);

          stub.restore();

          done();
        });
      });
    });

    describe('createPhoto', () => {
      it('should return the created photo', (done) => {
        const stub = sinon.stub(restler, 'postJson').returns({
          once: sinon.stub().yields({ id: 1 }, {}),
        });

        client.createPhoto({}, (err, result) => {
          assert.equal(result.id, 1);

          stub.restore();

          done();
        });
      });
    });

    describe('getPhoto', () => {
      it('should return the photo', (done) => {
        const stub = sinon.stub(restler, 'get').returns({
          once: sinon.stub().yields({ id: 1 }, {}),
        });

        client.getPhoto({ id: 1 }, (err, result) => {
          assert.equal(result.id, 1);

          stub.restore();

          done();
        });
      });
    });

    describe('updatePhoto', () => {
      it('should return the updated photo', (done) => {
        const stub = sinon.stub(restler, 'patchJson').returns({
          once: sinon.stub().yields({ id: 1 }, {}),
        });

        client.updatePhoto({ id: 1 }, (err, result) => {
          assert.equal(result.id, 1);

          stub.restore();

          done();
        });
      });
    });

    describe('deletePhoto', () => {
      it('should return empty object', (done) => {
        const stub = sinon.stub(restler, 'del').returns({
          once: sinon.stub().yields({}, { statusCode: 204 }),
        });

        client.deletePhoto({ id: 1 }, (err, result) => {
          assert.isEmpty(result);

          stub.restore();

          done();
        });
      });
    });
  });
});
