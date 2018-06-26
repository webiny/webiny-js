import fs from "fs";
import { Storage } from "webiny-file-storage";
import { MemoryDriver } from "webiny-entity-memory";
import { Entity, File, api } from "webiny-api";
import SecurityService from "../src/services/securityService";
import JwtToken from "../src/security/tokens/jwtToken";

import registerIdentityAttribute from "./../src/attributes/registerIdentityAttribute";
import registerPasswordAttribute from "./../src/attributes/registerPasswordAttribute";
import registerFileAttributes from "./../src/attributes/registerFileAttributes";
import registerBufferAttribute from "../src/attributes/registerBufferAttribute";

import userFactory from "./utils/storageUserFactory";
import MockDriver from "./utils/storageDriverMock";

describe("Files attribute test", () => {
    let User;
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
        Entity.driver = new MemoryDriver();
        storage.driver.flush();
    });

    it("should save file entities", async function() {
        const user = new User();
        const userData = {
            name: "user1",
            documents: [data1, data2]
        };

        user.populate(userData);
        await user.save();

        const documents = await user.documents;
        expect(await storage.getKeys()).toHaveLength(2);
        const json = await user.toJSON("name,documents[id,name,tags]");

        expect(json).toEqual({
            id: user.id,
            name: "user1",
            documents: [
                {
                    id: documents[0].id,
                    name: "File1.jpg",
                    tags: ["user", "passport"]
                },
                {
                    id: documents[1].id,
                    name: "File2.png",
                    tags: ["user", "passport"]
                }
            ]
        });
    });

    it("should delete file entities when set to `null`", async function() {
        const user = new User();
        const userData = {
            name: "user1",
            documents: [data1, data2]
        };

        user.populate(userData);
        await user.save();

        expect(await storage.getKeys()).toHaveLength(2);

        user.documents = [];
        await user.save();

        const documents = await user.documents;
        expect(documents).toHaveLength(0);

        const files = await File.find();
        expect(files).toHaveLength(0);
    });
});
