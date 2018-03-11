import fs from "fs";
import { expect } from "chai";
import { Image, Entity } from "./../src";
import registerBufferAttribute from "./../src/attributes/registerBufferAttribute";
import { Storage } from "webiny-file-storage";
import imageProcessor from "webiny-jimp";
import MockDriver from "./utils/storageDriverMock";
import { MemoryDriver } from "webiny-entity-memory";

describe("Image entity test", () => {
    let jpgBuffer;
    let jpgBase64;
    let storage;
    let processor = imageProcessor();

    before(() => {
        registerBufferAttribute();
    });

    beforeEach(async () => {
        Entity.driver = new MemoryDriver();
        storage = new Storage(new MockDriver({ cdnUrl: "https://cdn.webiny.com" }));

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
        expect(image.width).to.equal(500);
        expect(image.height).to.equal(539);
        expect(image.preset).to.equal("original");
    });

    it("should dynamically calculate aspect ratio", async () => {
        const image = await Image.findOne({ query: { name: "image.jpg" } });
        expect(image.aspectRatio).to.equal(parseFloat((image.width / image.height).toFixed(3)));
    });

    it("should dynamically determine image orientation", async () => {
        const image = await Image.findOne({ query: { name: "image.jpg" } });
        expect(image.isPortrait).to.be.true;
        expect(image.isLandscape).to.be.false;
    });

    it("should dynamically resize image according to the preset name", async () => {
        const image = await Image.findOne({ query: { name: "image.jpg" } });
        image.setProcessor(processor);
        image.setStorage(storage);
        image.setPresets({ thumbnail: [{ action: "resize", width: 100, height: 100 }] });
        const src = await image.getURL("thumbnail");
        expect(src).to.include("-thumbnail");

        const presetImage = await Image.findOne({
            query: { name: "image.jpg", preset: "thumbnail" }
        });
        expect(await presetImage.src).to.equal(src);
        expect(await presetImage.get("ref.id")).to.equal(image.id);
        expect(presetImage.refClassId).to.equal(image.classId);
        expect(presetImage.width).to.equal(100);
        expect(presetImage.height).to.equal(100);
    });

    it("should dynamically resize image according to the preset name requested via `toJSON`", async () => {
        const image = await Image.findOne({ query: { name: "image.jpg" } });
        image.setProcessor(processor);
        image.setStorage(storage);
        image.setPresets({ thumbnail: [{ action: "resize", width: 100, height: 100 }] });
        const src = await image.getURL("thumbnail");

        const json = await image.toJSON("name,src:thumbnail");
        expect(json).to.deep.equal({ id: image.id, name: "image.jpeg", src });
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
        expect(presetImage).to.be.instanceof(Image);
        expect(presetImage.preset).to.equal("thumbnail");

        const images = await Image.find();
        expect(images).to.have.lengthOf(1);
    });
});
