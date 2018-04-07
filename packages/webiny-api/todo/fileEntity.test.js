import fs from "fs";
import { expect } from "chai";
import { File, Entity } from "./../src";
import registerBufferAttribute from "./../src/attributes/registerBufferAttribute";
import { Storage } from "webiny-file-storage";
import MockDriver from "./utils/storageDriverMock";
import { MemoryDriver } from "webiny-entity-memory";

describe("File entity test", () => {
    let jpgBuffer;
    let jpgBase64;
    let pngBuffer;
    let pngBase64;
    let storage;

    before(() => {
        registerBufferAttribute();
    });

    beforeEach(async () => {
        Entity.driver = new MemoryDriver();
        storage = new Storage(new MockDriver({ cdnUrl: "https://cdn.webiny.com" }));

        const file = new File();
        file.setStorageFolder("images");
        file.setStorage(storage);

        const file2 = new File();
        file2.setStorageFolder("documents");
        file2.setStorage(storage);

        jpgBuffer = fs.readFileSync(__dirname + "/utils/lenna.jpg");
        jpgBase64 = "data:image/jpg;base64," + jpgBuffer.toString("base64");
        pngBuffer = fs.readFileSync(__dirname + "/utils/lenna.png");
        pngBase64 = "data:image/png;base64," + pngBuffer.toString("base64");

        const data1 = {
            name: "File1.jpg",
            data: jpgBase64,
            type: "image/jpg",
            tags: ["profile"]
        };

        const data2 = {
            name: "File2.jpg",
            data: jpgBase64,
            type: "image/jpg"
        };

        return Promise.all([file.populate(data1).save(), file2.populate(data2).save()]);
    });

    it("should load file entity", async function() {
        const file = await File.findOne({ query: { name: "File1.jpg" } });
        expect(file.name).to.equal("File1.jpg");
        expect(file.ext).to.equal("jpg");
        expect(file.type).to.equal("image/jpeg");
    });

    it("should load file from storage via entity", async function() {
        const file = await File.findOne({ query: { name: "File1.jpg" } });
        const { body } = await file.getFile();
        expect(Buffer.from(body, "binary").equals(jpgBuffer)).to.be.true;
    });

    it("should get file URL", async function() {
        const file = await File.findOne({ query: { name: "File1.jpg" } });
        expect(file.getURL()).to.equal("https://cdn.webiny.com/" + file.key);
    });

    it("should contain storage folder", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpg" } });
        const file2 = await File.findOne({ query: { name: "File2.jpg" } });
        expect(file1.key).to.contain("images/");
        expect(file2.key).to.contain("documents/");
    });

    it("should contain tags", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpg" } });
        expect(file1.tags).to.contain("profile");
    });

    it("should return JSON data with URL", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpg" } });
        expect(await file1.toJSON("src")).to.deep.equal({
            id: file1.id,
            src: "https://cdn.webiny.com/" + file1.key
        });
    });

    it("should return absolute file path", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpg" } });
        expect(await file1.getAbsolutePath()).to.equal(file1.key);
    });

    it("should update file contents", async function() {
        let file1 = await File.findOne({ query: { name: "File1.jpg" } });
        const data = {
            name: "app-image.png",
            data: pngBase64,
            type: "image/png"
        };
        await file1.populate(data).save();

        file1 = await File.findOne({ query: { name: "app-image.png" } });
        const json = await file1.toJSON("src,name,type,ext");
        expect(json).to.deep.equal({
            id: file1.id,
            name: "app-image.png",
            src: "https://cdn.webiny.com/" + file1.key,
            type: "image/png",
            ext: "png"
        });

        const fileData = await file1.getFile();
        expect(Buffer.from(fileData.body, "binary").equals(pngBuffer)).to.be.true;
    });

    it("should update file title without changing file contents", async function() {
        const file = await File.findOne({ query: { name: "File1.jpg" } });
        const key = file.key;
        file.populate({ title: "Header", name: "new-name.jpg" });
        await file.save();

        expect(file.name).to.equal("File1.jpg");
        expect(file.key).to.equal(key);
        expect(file.title).to.equal("Header");
        const fileData = await file.getFile();
        expect(Buffer.from(fileData.body, "binary").equals(jpgBuffer)).to.be.true;
    });

    it("should permanently delete file entity", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpg" } });
        await file1.delete();

        let file = await File.findOne({ query: { name: "File1.jpg", deleted: true } });
        expect(file).to.be.null;
    });
});
