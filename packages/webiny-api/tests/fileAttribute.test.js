import fs from "fs";
import { Storage } from "webiny-file-storage";
import { MemoryDriver } from "webiny-entity-memory";
import { Entity, File } from "webiny-api/lib/entities";
import { api } from "webiny-api";
import SecurityService from "../src/services/securityService";
import JwtToken from "../src/security/tokens/jwtToken";

import registerIdentityAttribute from "./../src/attributes/registerIdentityAttribute";
import registerPasswordAttribute from "./../src/attributes/registerPasswordAttribute";
import registerFileAttributes from "./../src/attributes/registerFileAttributes";
import registerBufferAttribute from "../src/attributes/registerBufferAttribute";
import userFactory from "./utils/storageUserFactory";
import MockDriver from "./utils/storageDriverMock";

let User;

describe("File attribute test", () => {
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

    it("should save file entity", async function() {
        const user = new User();
        const userData = {
            name: "user1",
            document: data1
        };

        user.populate(userData);
        await user.save();
        const document = await user.document;
        const fileUrl = document.getURL();
        const json = await user.toJSON("name,document[id,name,src,tags]");

        expect(fileUrl).toContain("/users/documents/");
        expect(json).toEqual({
            id: user.id,
            name: "user1",
            document: {
                id: document.id,
                name: "File1.jpg",
                src: fileUrl,
                tags: ["user", "passport"]
            }
        });

        expect(await storage.getKeys()).toHaveLength(1);
    });

    it("should delete previous file entity when populating with new file data", async function() {
        const user = new User();
        const userData = {
            name: "user1",
            document: data1
        };

        user.populate(userData);
        await user.save();

        const document1 = await user.document;
        user.populate({ document: data2 });
        await user.save();
        const document2 = await user.document;

        const json = await user.toJSON("name,document[id,name,tags]");

        expect(document1.id).not.toBe(document2.id);
        expect(json).toEqual({
            id: user.id,
            name: "user1",
            document: {
                id: document2.id,
                name: "File2.png",
                tags: ["user", "passport"]
            }
        });

        expect(await storage.getKeys()).toHaveLength(1);
    });

    it("should delete previous file entity when setting to `null`", async function() {
        const user = new User();
        const userData = {
            name: "user1",
            document: data1
        };

        user.populate(userData);

        await user.save();

        await user.populate({ document: null }).save();

        const document2 = await user.document;
        const json = await user.toJSON("name,document[id,name,tags]");

        expect(document2).toBeNull();
        expect(json).toEqual({
            id: user.id,
            name: "user1",
            document: null
        });

        const files = await File.find();
        expect(files.length).toEqual(0);

        const keys = await storage.getKeys();
        expect(keys).toHaveLength(0);
    });
});
