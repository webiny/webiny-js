import { expect } from "chai";
import File from "./../src/entities/file";
import { Storage } from "webiny-file-storage";
import MockDriver from "./utils/storageDriverMock";
import { MemoryDriver } from "webiny-entity-memory";
import { jpegBase64, pngBase64 } from "./utils/base64Data";

const data1 = {
    name: "File1.jpeg",
    src: jpegBase64,
    type: "image/jpeg",
    tags: ["profile"]
};

const data2 = {
    name: "File2.jpeg",
    src: jpegBase64,
    type: "image/jpeg"
};

describe("File entity test", () => {
    beforeEach(async () => {
        File.driver = new MemoryDriver();
        const storage = new Storage(new MockDriver({ cdnUrl: "https://cdn.webiny.com" }));

        const file = new File();
        file.setStorageFolder("images");
        file.setStorage(storage);

        const file2 = new File();
        file2.setStorageFolder("documents");
        file2.setStorage(storage);

        return Promise.all([file.populate(data1).save(), file2.populate(data2).save()]);
    });

    it("should load file entity", async function() {
        const file = await File.findOne({ query: { name: "File1.jpeg" } });
        expect(file.name).to.equal("File1.jpeg");
        expect(file.ext).to.equal("jpeg");
        expect(file.type).to.equal("image/jpeg");
    });

    it("should load file from storage via entity", async function() {
        const file = await File.findOne({ query: { name: "File1.jpeg" } });
        const fileData = await file.getFile();
        const base64data = new Buffer(fileData.body, "binary").toString("base64");
        expect(base64data).to.equal(jpegBase64.split(",").pop());
    });

    it("should get file URL", async function() {
        const file = await File.findOne({ query: { name: "File1.jpeg" } });
        expect(file.getURL()).to.equal("https://cdn.webiny.com/" + file.src);
    });

    it("should contain storage folder", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpeg" } });
        const file2 = await File.findOne({ query: { name: "File2.jpeg" } });
        expect(file1.src).to.contain("images/");
        expect(file2.src).to.contain("documents/");
    });

    it("should contain tags", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpeg" } });
        expect(file1.tags).to.contain("profile");
    });

    it("should return JSON data with URL", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpeg" } });
        expect(await file1.toJSON("src")).to.deep.equal({
            id: file1.id,
            src: "https://cdn.webiny.com/" + file1.src
        });
    });

    it("should return absolute file path", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpeg" } });
        expect(await file1.getAbsolutePath()).to.equal(file1.src);
    });

    it("should update file contents", async function() {
        let file1 = await File.findOne({ query: { name: "File1.jpeg" } });
        const data = {
            name: "app-image.png",
            src: pngBase64,
            type: "image/png"
        };
        await file1.populate(data).save();

        file1 = await File.findOne({ query: { name: "app-image.png" } });
        const json = await file1.toJSON("src,name,type,ext");
        expect(json).to.deep.equal({
            id: file1.id,
            name: "app-image.png",
            src: "https://cdn.webiny.com/" + file1.src,
            type: "image/png",
            ext: "png"
        });

        const fileData = await file1.getFile();
        const fileBody = new Buffer(fileData.body, "binary").toString("base64");
        expect(fileBody).to.equal(pngBase64.split(",").pop());
    });

    it("should update file title without changing file contents", async function() {
        const file = await File.findOne({ query: { name: "File1.jpeg" } });
        const src = file.src;
        file.populate({ title: "Header", name: "new-name.jpeg", src: "some/new/source" });
        await file.save();

        expect(file.name).to.equal("File1.jpeg");
        expect(file.src).to.equal(src);
        expect(file.title).to.equal("Header");
        const fileData = await file.getFile();
        const fileBody = new Buffer(fileData.body, "binary").toString("base64");
        expect(fileBody).to.equal(jpegBase64.split(",").pop());
    });

    it("should permanently delete file entity", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpeg" } });
        await file1.delete();

        let file = await File.findOne({ query: { name: "File1.jpeg", deleted: true } });
        expect(file).to.be.null;
    });
});
