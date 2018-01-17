import chai from 'chai';
import sinon from 'sinon';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
chai.should();
const { expect, assert } = chai;

import { Storage, File } from '../src';
import MockDriver from './mockDriver';

describe('File class test', function () {
    const cdnUrl = 'https://cdn.webiny.com';
    const mockDriver = new MockDriver({ cdnUrl, createDatePrefix: true });
    const storage = new Storage(mockDriver);

    const file1 = {
        key: '/path/1',
        data: { body: 'file1', meta: { ext: 'jpg', size: 412, timeModified: Date.now() } }
    };

    it('should store file body and meta', async function () {
        const file = new File(file1.key, storage);
        file.setBody(file1.data.body);
        file.setMeta(file1.data.meta);
        await file.save();

        // Update file key for use in the following tests
        file1.key = file.getKey();
        return Promise.all([
            storage.exists(file.getKey()).should.become(true),
            storage.getFile(file.getKey()).should.become(file1.data)
        ]);
    });

    it('should not store empty file body', async function () {
        const file = new File(file1.key, storage);
        return file.save().should.become(false);
    });

    it('should return storage instance', function () {
        const file = new File(file1.key, storage);
        assert.equal(file.getStorage(), storage);
    });

    it('should return file URL', function () {
        const file = new File(file1.key, storage);
        assert.equal(file.getUrl(), cdnUrl + file1.key);
    });

    it('should return file body', function () {
        const file = new File(file1.key, storage);
        return file.getBody().should.become(file1.data.body);
    });

    it('should return already loaded file body', async function () {
        const spy = sinon.spy(storage, 'getFile');
        const file = new File(file1.key, storage);
        await file.getBody();
        await file.getBody().should.become(file1.data.body);
        sinon.assert.calledOnce(spy);
    });

    it('should return already loaded file meta', async function () {
        const spy = sinon.spy(storage, 'getMeta');
        const file = new File(file1.key, storage);
        await file.getMeta();
        await file.getMeta().should.become(file1.data.meta);
        sinon.assert.calledOnce(spy);
    });

    it('should return file meta', function () {
        const file = new File(file1.key, storage);
        return file.getMeta().should.become(file1.data.meta);
    });

    it('should not return file body', function () {
        const file = new File('/missing/key', storage);
        return file.getBody().should.become(null);
    });

    it('should return time modified', function () {
        const file = new File(file1.key, storage);
        return file.getTimeModified().should.become(file1.data.meta.timeModified);
    });

    it('should return file size', function () {
        const file = new File(file1.key, storage);
        return file.getSize().should.become(file1.data.meta.size);
    });

    it('should return absolute file path', function () {
        const file = new File(file1.key, storage);
        return file.getAbsolutePath().should.become(file1.key);
    });

    it('should rename a file', async function () {
        const newKey = '/new/path';
        const file = new File(file1.key, storage);
        await file.rename(newKey);
        file1.key = newKey;
        return storage.getFile(file1.key).should.become(file1.data);
    });

    it('should delete a file', async function () {
        const file = new File(file1.key, storage);
        await file.delete();
        return storage.getFile(file1.key).should.become(null);
    });
});