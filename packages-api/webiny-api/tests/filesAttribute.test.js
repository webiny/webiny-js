import { expect } from "chai";
import fs from "fs";
import { Storage } from "webiny-file-storage";
import { MemoryDriver } from "webiny-entity-memory";

import registerAttributes from "./../src/attributes/registerFileAttributes";
import { Entity, File } from "../src/entities";
import userFactory from "./utils/user.entity";
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

    before(() => {
        registerAttributes({ entity: File });
        User = userFactory({ documentStorage: storage, documentFolder: "users/documents" });
        jpgBuffer = fs.readFileSync(__dirname + "/utils/lenna.jpg");
        jpgBase64 = "data:image/jpg;base64," + jpgBuffer.toString("base64");
        pngBuffer = fs.readFileSync(__dirname + "/utils/lenna.png");
        pngBase64 = "data:image/png;base64," + pngBuffer.toString("base64");

        data1 = {
            name: "File1.jpg",
            src: jpgBase64,
            type: "image/jpg",
            tags: ["passport"]
        };

        data2 = {
            name: "File2.png",
            src: pngBase64,
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
        expect(await storage.getKeys()).to.have.lengthOf(2);
        const json = await user.toJSON("name,documents[id,name,tags]");

        expect(json).to.deep.equal({
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

        expect(await storage.getKeys()).to.have.lengthOf(2);

        user.documents = [];
        await user.save();

        const documents = await user.documents;
        expect(documents).to.have.lengthOf(0);

        const files = await File.find();
        expect(files).to.have.lengthOf(0);
    });
});
