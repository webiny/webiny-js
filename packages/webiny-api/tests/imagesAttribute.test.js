import { expect } from "chai";
import fs from "fs";
import { Storage } from "webiny-file-storage";
import { MemoryDriver } from "webiny-entity-memory";

import registerAttributes from "./../src/attributes/registerImageAttributes";
import registerBufferAttribute from "../src/attributes/registerBufferAttribute";
import { Entity, Image } from "../src/entities";
import entityFactory from "./utils/event.entity";
import MockDriver from "./utils/storageDriverMock";
import imageProcessor from "./utils/imageProcessor";

describe("Images attribute test", () => {
    let Event;
    let jpgBuffer;
    let jpgBase64;
    let pngBuffer;
    let pngBase64;
    let data1;
    let data2;

    const storage = new Storage(new MockDriver({ cdnUrl: "https://cdn.webiny.com" }));

    before(() => {
        registerBufferAttribute();
        registerAttributes({ entity: Image });
        Event = entityFactory({ storage, folder: "events/images", processor: imageProcessor });

        jpgBuffer = fs.readFileSync(__dirname + "/utils/lenna.jpg");
        jpgBase64 = "data:image/jpg;base64," + jpgBuffer.toString("base64");
        pngBuffer = fs.readFileSync(__dirname + "/utils/lenna.png");
        pngBase64 = "data:image/png;base64," + pngBuffer.toString("base64");

        data1 = {
            name: "Image1.jpg",
            data: jpgBase64,
            type: "image/jpg",
            tags: ["passport"]
        };

        data2 = {
            name: "Image2.png",
            data: pngBase64,
            type: "image/png",
            tags: ["passport"]
        };
    });

    beforeEach(() => {
        Entity.driver = new MemoryDriver();
        storage.driver.flush();
    });

    it("should save image entities", async function() {
        const user = new Event();
        const userData = {
            name: "user1",
            images: [data1, data2]
        };

        user.populate(userData);
        await user.save();

        const images = await user.images;
        expect(await storage.getKeys()).to.have.lengthOf(2);
        const json = await user.toJSON("name,images[id,name,tags]");

        expect(json).to.deep.equal({
            id: user.id,
            name: "user1",
            images: [
                {
                    id: images[0].id,
                    name: "Image1.jpg",
                    tags: ["event-image", "passport"]
                },
                {
                    id: images[1].id,
                    name: "Image2.png",
                    tags: ["event-image", "passport"]
                }
            ]
        });
    });

    it("should delete image entities when set to `null`", async function() {
        const user = new Event();
        const userData = {
            name: "user1",
            images: [data1, data2]
        };

        user.populate(userData);
        await user.save();

        expect(await storage.getKeys()).to.have.lengthOf(2);

        user.images = [];
        await user.save();

        const images = await user.images;
        expect(images).to.have.lengthOf(0);

        const files = await Image.find();
        expect(files).to.have.lengthOf(0);
    });
});
