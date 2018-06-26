import fs from "fs";
import { Storage } from "webiny-file-storage";
import { MemoryDriver } from "webiny-entity-memory";
import userFactory from "./utils/storageUserFactory";

import registerImageAttributes from "../src/attributes/registerImageAttributes";
import entityFactory from "./utils/Event.entity";
import imageProcessor from "./utils/imageProcessor";

import { Entity, File, Image, api } from "webiny-api";
import SecurityService from "../src/services/securityService";
import JwtToken from "../src/security/tokens/jwtToken";

import registerIdentityAttribute from "./../src/attributes/registerIdentityAttribute";
import registerPasswordAttribute from "./../src/attributes/registerPasswordAttribute";
import registerFileAttributes from "./../src/attributes/registerFileAttributes";
import registerBufferAttribute from "../src/attributes/registerBufferAttribute";
import MockDriver from "./utils/storageDriverMock";

let Event, User;

describe("Image attribute test", () => {
    let jpgBuffer;
    let jpgBase64;
    let pngBuffer;
    let pngBase64;
    let data1;
    let data2;

    const storage = new Storage(new MockDriver({ cdnUrl: "https://cdn.webiny.com" }));

    beforeAll(() => {
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
        registerImageAttributes({ entity: Image });

        Event = entityFactory({ storage, folder: "events/images", processor: imageProcessor });
        User = userFactory({ storage, folder: "users/documents" });

        jpgBuffer = fs.readFileSync(__dirname + "/utils/lenna.jpg");
        jpgBase64 = "data:image/jpg;base64," + jpgBuffer.toString("base64");
        pngBuffer = fs.readFileSync(__dirname + "/utils/lenna.png");
        pngBase64 = "data:image/png;base64," + pngBuffer.toString("base64");

        data1 = {
            name: "File1.jpg",
            data: jpgBase64,
            type: "image/jpg",
            tags: ["passport"]
        };

        data2 = {
            name: "File2.png",
            data: pngBase64,
            type: "image/png",
            tags: ["passport"]
        };
    });

    beforeEach(() => {
        Entity.driver.flush();
        storage.driver.flush();
    });

    it("should save image entity", async function() {
        const event = new Event();
        const eventData = {
            name: "event1",
            image: data1
        };

        event.populate(eventData);
        await event.save();

        const image = await event.image;
        const imageURL = image.getURL();
        const json = await event.toJSON("name,image[id,name,src,width,height,tags]");

        expect(imageURL).toContain("/events/images/");
        expect(json).toEqual({
            id: event.id,
            name: "event1",
            image: {
                id: image.id,
                name: "File1.jpg",
                src: imageURL,
                width: 500,
                height: 539,
                tags: ["event-header", "passport"]
            }
        });

        expect(await storage.getKeys()).toHaveLength(1);
    });

    it("should delete previous image entity when populating with new image data", async function() {
        const event = new Event();
        const eventData = {
            name: "event1",
            image: data1
        };

        event.populate(eventData);
        await event.save();

        const image1 = await event.image;
        await event.populate({ image: data2 }).save();
        const image2 = await event.image;

        const json = await event.toJSON("name,image[id,name,tags]");

        expect(image1.id).not.toBe(image2.id);
        expect(json).toEqual({
            id: event.id,
            name: "event1",
            image: {
                id: image2.id,
                name: "File2.png",
                tags: ["event-header", "passport"]
            }
        });

        expect(await storage.getKeys()).toHaveLength(1);
    });

    it("should delete previous file entity when setting to `null`", async function() {
        const event = new Event();
        const eventData = {
            name: "event1",
            image: data1
        };

        event.populate(eventData);
        await event.save();
        await event.populate({ image: null }).save();

        const image2 = await event.image;
        const json = await event.toJSON("name,image[id,name,tags]");

        expect(image2).toBeNull();
        expect(json).toEqual({
            id: event.id,
            name: "event1",
            image: null
        });

        const files = await Image.find();
        expect(files.length).toBe(0);

        const keys = await storage.getKeys();
        expect(keys).toHaveLength(0);
    });
});
