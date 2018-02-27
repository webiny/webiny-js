import { expect } from "chai";
import { Storage } from "webiny-file-storage";
import { MemoryDriver } from "webiny-entity-memory";

import registerAttributes from "./../src/attributes/registerAttributes";
import { jpegBase64, pngBase64 } from "./utils/base64Data";
import { Entity, File } from "../src/entities";
import userFactory from "./utils/user.entity";
import MockDriver from "./utils/storageDriverMock";

let User;

const data1 = {
    name: "File1.jpeg",
    src: jpegBase64,
    type: "image/jpeg",
    tags: ["passport"]
};

const data2 = {
    name: "File2.png",
    src: pngBase64,
    type: "image/png",
    tags: ["passport"]
};

describe("Files attribute test", () => {
    const storage = new Storage(new MockDriver({ cdnUrl: "https://cdn.webiny.com" }));

    before(() => {
        Entity.driver = new MemoryDriver();
        registerAttributes();
        User = userFactory({ documentStorage: storage, documentFolder: "users/documents" });
    });

    beforeEach(() => {
        Entity.driver.flush();
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

        console.log(Entity.driver.data);

        const documents = await user.documents;

        expect(await storage.getKeys()).to.have.lengthOf(2);

        const json = await user.toJSON("name,documents[id,name,tags]");

        expect(json).to.deep.equal({
            id: user.id,
            name: "user1",
            documents: [
                {
                    id: documents[0].id,
                    name: "File1.jpeg",
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

        //const files = await File.find();
        //expect(files).to.have.lengthOf(0);
    });
});
