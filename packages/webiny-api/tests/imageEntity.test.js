import fs from "fs";
import { Image, Entity } from "webiny-api/lib/entities";
import { api } from "webiny-api";
import { Storage } from "webiny-file-storage";
import imageProcessor from "webiny-jimp";
import userFactory from "./utils/storageUserFactory";

import registerIdentityAttribute from "./../src/attributes/registerIdentityAttribute";
import registerPasswordAttribute from "./../src/attributes/registerPasswordAttribute";
import registerFileAttributes from "./../src/attributes/registerFileAttributes";
import registerBufferAttribute from "../src/attributes/registerBufferAttribute";
import MockDriver from "./utils/storageDriverMock";

import { MemoryDriver } from "webiny-entity-memory";
import SecurityService from "../src/services/securityService";
import JwtToken from "../src/security/tokens/jwtToken";

let User;

describe("Image entity test", () => {
    let jpgBuffer;
    let jpgBase64;
    let storage;
    let processor = imageProcessor();

    beforeAll(async () => {
        // Register service (for identity attribute).
        api.services.register("security", () => {
            return new SecurityService({
                token: new JwtToken({ secret: "MyS3cr3tK3Y" }),
                identities: [{ identity: User }]
            });
        });

        // Configure Memory entity driver.
        Entity.driver = new MemoryDriver();

        storage = new Storage(new MockDriver({ cdnUrl: "https://cdn.webiny.com" }));
        User = userFactory({ storage, folder: "users/documents" });

        registerIdentityAttribute();
        registerPasswordAttribute();
        registerFileAttributes({ entity: File });
        registerBufferAttribute();

        const image = new Image();
        image.setProcessor(processor);
        image.setStorageFolder("images");
        image.setStorage(storage);

        const image2 = new Image();
        image2.setProcessor(processor);
        image2.setStorage(storage);

        jpgBuffer = fs.readFileSync(__dirname + "/utils/lenna.jpg");
        jpgBase64 = "data:image/jpg;base64," + jpgBuffer.toString("base64");

        const data1 = {
            name: "image.jpg",
            data: jpgBase64,
            type: "image/jpg",
            tags: ["profile"]
        };

        return image.populate(data1).save();
    });

    it("should store image width and height", async () => {
        const image = await Image.findOne({ query: { name: "image.jpg" } });
        expect(image.width).toEqual(500);
        expect(image.height).toEqual(539);
        expect(image.preset).toEqual("original");
    });

    it("should dynamically calculate aspect ratio", async () => {
        const image = await Image.findOne({ query: { name: "image.jpg" } });
        expect(image.aspectRatio).toEqual(parseFloat((image.width / image.height).toFixed(3)));
    });

    it("should dynamically determine image orientation", async () => {
        const image = await Image.findOne({ query: { name: "image.jpg" } });
        expect(image.isPortrait).toBe(true);
        expect(image.isLandscape).toBe(false);
    });

    it("should dynamically resize image according to the preset name", async () => {
        const image = await Image.findOne({ query: { name: "image.jpg" } });
        image.setProcessor(processor);
        image.setStorage(storage);
        image.setPresets({
            thumbnail: [{ action: "resize", width: 100, height: 100 }],
            small: [{ action: "resize", width: 50 }]
        });

        // Get `thumbnail`
        const src = await image.getURL("thumbnail");
        expect(src).toContain("-thumbnail");

        const thumbnail = await Image.findOne({
            query: { name: "image.jpg", preset: "thumbnail" }
        });
        expect(await thumbnail.src).toEqual(src);
        expect(await thumbnail.get("ref.id")).toEqual(image.id);
        expect(thumbnail.refClassId).toEqual(image.classId);
        expect(thumbnail.width).toEqual(100);
        expect(thumbnail.height).toEqual(100);

        // Get `small`
        const src2 = await image.getURL("small");
        expect(src2).toContain("-small");

        const small = await Image.findOne({
            query: { name: "image.jpg", preset: "small" }
        });
        expect(await small.src).toEqual(src2);
        expect(small.width).toEqual(50);
        expect(small.height < 100).toBe(true);
    });

    it("should dynamically resize image according to the preset name requested via `toJSON`", async () => {
        const image = await Image.findOne({ query: { name: "image.jpg" } });
        image.setProcessor(processor);
        image.setStorage(storage);
        image.setPresets({ thumbnail: [{ action: "resize", width: 100, height: 100 }] });
        const src = await image.getURL("thumbnail");

        const json = await image.toJSON("name,src:thumbnail");
        expect(json).toEqual({ id: image.id, name: "image.jpg", src });
    });

    it("should only load original images when using `find`", async () => {
        const image = await Image.findOne({ query: { name: "image.jpg" } });
        image.setProcessor(processor);
        image.setStorage(storage);
        image.setPresets({ thumbnail: [{ action: "resize", width: 100, height: 100 }] });
        await image.getURL("thumbnail");

        // Verify preset image was created
        const presetImage = await Image.findOne({
            query: { name: "image.jpg", preset: "thumbnail" }
        });
        expect(presetImage).toBeInstanceOf(Image);
        expect(presetImage.preset).toEqual("thumbnail");

        const images = await Image.find();
        expect(images).toHaveLength(1);
    });
});
