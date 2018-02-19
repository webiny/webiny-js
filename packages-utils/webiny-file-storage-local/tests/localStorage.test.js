import chai from "chai";
import path from "path";
import chaiAsPromised from "chai-as-promised";
import fs from "fs-extra";

chai.use(chaiAsPromised);
chai.should();
const expect = chai.expect;

import { Storage } from "webiny-file-storage";
import LocalDriver from "./../lib";

describe("LocalStorageDriver class test", function() {
    const publicUrl = "https://cdn.domain.com";
    const storageRoot = __dirname + "/storage";

    const localDriver = new LocalDriver({
        directory: storageRoot,
        createDatePrefix: true,
        publicUrl
    });

    const localDriver2 = new LocalDriver({
        directory: storageRoot
    });

    const storage = new Storage(localDriver);
    const storage2 = new Storage(localDriver2);

    const file1 = { key: "file.txt", data: { body: "test message" } };
    const file2 = { key: "file2.txt", data: { body: "test message" } };

    before(() => {
        fs.emptyDirSync(__dirname + "/storage");
    });

    after(() => {
        fs.emptyDirSync(__dirname + "/storage");
        fs.removeSync(__dirname + "/storage");
    });

    it("should return an empty list of keys", function() {
        return storage.getKeys("/", "**/*").should.become([]);
    });

    it("should store a file with date prefix", async function() {
        file1.key = await storage.setFile(file1.key, file1.data);
        expect(file1.key).to.be.a("string");
    });

    it("should store a file without date prefix", async function() {
        file2.key = await storage2.setFile(file2.key, file2.data);
        expect(file2.key).to.not.match(/^\d{4}\/\d{2}\/\d{2}\//);
    });

    it("should not store an empty file body", async function() {
        return storage.setFile(file1.key, { body: null }).should.be.rejected;
    });

    it("should return a list of keys containing 1 key", function() {
        return storage.getKeys().should.become([file2.key]);
    });

    it("should return a list of keys containing 2 keys", async function() {
        return storage.getKeys("/", "**/*").should.become([file1.key, file2.key]);
    });

    it("should return a file as a string", function() {
        return storage.getFile(file1.key, { encoding: "utf8" }).should.become({
            body: file1.data.body
        });
    });

    it("should return a file as a Buffer", function() {
        return storage.getFile(file1.key).then(data => {
            expect(data.body).to.be.an.instanceof(Buffer);
            expect(data.body.toString()).to.equal("test message");
        });
    });

    it("should set file meta", async function() {
        return storage.setMeta(file1.key, {}).should.become(true);
    });

    it("should return empty meta", async function() {
        return storage.getMeta(file1.key).should.become(null);
    });

    it("should confirm that file exists", function() {
        return storage.exists(file1.key).should.become(true);
    });

    it("should confirm that file does not exist", function() {
        return storage.exists("/path/114").should.become(false);
    });

    it("should return time when file was modified", function() {
        return storage.getTimeModified(file1.key).then(data => {
            expect(data).to.be.a("number");
        });
    });

    it("should not return time modified", function() {
        return storage.getTimeModified("/path/does/not/exist").should.be.rejected;
    });

    it("should update a file without changing the key", async function() {
        file1.data.body = "file-updated";
        const newKey = await storage.setFile(file1.key, file1.data);
        expect(newKey).to.equal(file1.key);
    });

    it("should return file size", function() {
        return storage.getSize(file1.key).then(data => {
            expect(data).to.be.a("number");
        });
    });

    it("should not return file size", function() {
        return storage.getSize("/path/does/not/exist").should.be.rejected;
    });

    it("should return file content type", function() {
        return storage.getContentType(file1.key).should.become("text/plain");
    });

    it("should return a public file URL", function() {
        expect(storage.getURL(file1.key)).to.equal(publicUrl + file1.key);
    });

    it("should not return a public file URL", function() {
        expect(storage2.getURL(file1.key)).to.equal(file1.key);
    });

    it("should return an absolute path to file", function() {
        return storage.getAbsolutePath(file1.key).should.become(path.join(storageRoot, file1.key));
    });

    it("should rename a file", async function() {
        const newKey = "/new/key";
        await storage.rename(file1.key, newKey);
        file1.key = newKey;
        return storage.getFile("/new/key", { encoding: "utf8" }).should.become(file1.data);
    });

    it("should delete a file", async function() {
        await storage.delete(file1.key);
        return storage.getFile(file1.key).should.be.rejected;
    });
});
