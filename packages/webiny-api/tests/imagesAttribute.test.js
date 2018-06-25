import fs from "fs";
import { Storage } from "webiny-file-storage";
import { MemoryDriver } from "webiny-entity-memory";
import { Image, Entity, api } from "webiny-api";
import registerImageAttributes from "./../src/attributes/registerImageAttributes";
import MyUser from "./entities/myUser";
import entityFactory from "./utils/Event.entity";
import imageProcessor from "./utils/imageProcessor";

import registerIdentityAttribute from "./../src/attributes/registerIdentityAttribute";
import registerPasswordAttribute from "./../src/attributes/registerPasswordAttribute";
import registerFileAttributes from "./../src/attributes/registerFileAttributes";
import registerBufferAttribute from "../src/attributes/registerBufferAttribute";
import MockDriver from "./utils/storageDriverMock";

import SecurityService from "../src/services/securityService";
import JwtToken from "../src/security/tokens/jwtToken";

describe("Images attribute test", () => {
    let Event;
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
                identities: [{ identity: MyUser }]
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

        // Insert test user
        const user = new MyUser();
        user.populate({ username: "admin@webiny.com", password: "dev" });
        const user2 = new MyUser();
        user2.populate({ username: "test@webiny.com", password: "admin" });
        return Promise.all([user.save(), user2.save()]);
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
        expect(await storage.getKeys()).toHaveLength(2);
        const json = await user.toJSON("name,images[id,name,tags]");

        expect(json).toEqual({
            id: user.id,
            name: "user1",
            images: [
                {
                    id: images[0].id,
                    name: "File1.jpg",
                    tags: ["event-image", "passport"]
                },
                {
                    id: images[1].id,
                    name: "File2.png",
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

        expect(await storage.getKeys()).toHaveLength(2);

        user.images = [];
        await user.save();

        const images = await user.images;
        expect(images).toHaveLength(0);

        const files = await Image.find();
        expect(files).toHaveLength(0);
    });
});
