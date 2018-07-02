import fs from "fs";
import { Storage } from "webiny-file-storage";
import userFactory from "./utils/storageUserFactory";
import MockDriver from "./utils/storageDriverMock";
import { MemoryDriver } from "webiny-entity-memory";

import SecurityService from "webiny-api/services/securityService";
import JwtToken from "webiny-api/security/tokens/jwtToken";
import { Entity, File } from "webiny-api/entities";
import { api } from "webiny-api";

import registerIdentityAttribute from "webiny-api/attributes/registerIdentityAttribute";
import registerPasswordAttribute from "webiny-api/attributes/registerPasswordAttribute";
import registerFileAttributes from "webiny-api/attributes/registerFileAttributes";
import registerBufferAttribute from "webiny-api/attributes/registerBufferAttribute";

describe("File entity test", () => {
    let jpgBuffer;
    let jpgBase64;
    let pngBuffer;
    let pngBase64;
    let storage;
    let User;

    beforeAll(() => {
        storage = new Storage(new MockDriver({ cdnUrl: "https://cdn.webiny.com" }));
        User = userFactory({ storage, folder: "users/documents" });

        // Register service (for identity attribute).
        api.services.register("security", () => {
            return new SecurityService({
                token: new JwtToken({ secret: "MyS3cr3tK3Y" }),
                identities: [{ identity: User }]
            });
        });

        // Configure Memory entity driver.
        Entity.driver = new MemoryDriver();

        // Register attributes.
        registerIdentityAttribute();
        registerPasswordAttribute();
        registerFileAttributes({ entity: File });
        registerBufferAttribute();
    });

    beforeEach(async () => {
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
        expect(file.name).toBe("File1.jpg");
        expect(file.ext).toBe("jpg");
        expect(file.type).toBe("image/jpeg");
    });

    it("should load file from storage via entity", async function() {
        const file = await File.findOne({ query: { name: "File1.jpg" } });
        const { body } = await file.getFile();
        expect(Buffer.from(body, "binary").equals(jpgBuffer)).toBe(true);
    });

    it("should get file URL", async function() {
        const file = await File.findOne({ query: { name: "File1.jpg" } });
        expect(file.getURL()).toBe("https://cdn.webiny.com/" + file.key);
    });

    it("should contain storage folder", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpg" } });
        const file2 = await File.findOne({ query: { name: "File2.jpg" } });
        expect(file1.key).toContain("images/");
        expect(file2.key).toContain("documents/");
    });

    it("should contain tags", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpg" } });
        expect(file1.tags).toContain("profile");
    });

    it("should return JSON data with URL", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpg" } });
        expect(await file1.toJSON("src")).toEqual({
            id: file1.id,
            src: "https://cdn.webiny.com/" + file1.key
        });
    });

    it("should return absolute file path", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpg" } });
        expect(await file1.getAbsolutePath()).toBe(file1.key);
    });

    it("should update file contents", async function() {
        let file1 = await File.findOne({ query: { name: "File1.jpg" } });
        const data = {
            name: "app-image.png",
            data: pngBase64,
            type: "image/png"
        };
        await file1.populate(data).save();

        const json = await file1.toJSON("src,name,type,ext");
        expect(json).toEqual({
            id: file1.id,
            name: "app-image.png",
            src: "https://cdn.webiny.com/" + file1.key,
            type: "image/png",
            ext: "png"
        });

        const fileData = await file1.getFile();
        expect(Buffer.from(fileData.body, "binary").equals(pngBuffer)).toBe(true);
    });

    it("should update file title without changing file contents", async function() {
        const file = await File.findOne({ query: { name: "File1.jpg" } });
        const key = file.key;
        file.populate({ title: "Header", name: "new-name.jpg" });
        await file.save();

        expect(file.name).toBe("new-name.jpg");
        expect(file.key).toBe(key);
        expect(file.title).toBe("Header");
        const fileData = await file.getFile();
        expect(Buffer.from(fileData.body, "binary").equals(jpgBuffer)).toBe(true);
    });

    it("should permanently delete file entity", async function() {
        const file1 = await File.findOne({ query: { name: "File1.jpg" } });
        await file1.delete();

        let file = await File.findOne({ query: { name: "File1.jpg", deleted: true } });
        expect(file).toBeNull();
    });
});
