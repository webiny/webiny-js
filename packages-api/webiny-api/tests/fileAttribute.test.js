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

describe("File attribute test", () => {
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

        expect(fileUrl).to.contain("/users/documents/");
        expect(json).to.deep.equal({
            id: user.id,
            name: "user1",
            document: {
                id: document.id,
                name: "File1.jpeg",
                src: fileUrl,
                tags: ["user", "passport"]
            }
        });

        expect(await storage.getKeys()).to.have.lengthOf(1);
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
        await user.populate({ document: data2 }).save();
        const document2 = await user.document;

        const json = await user.toJSON("name,document[id,name,tags]");

        expect(document1.id).to.not.equal(document2.id);
        expect(json).to.deep.equal({
            id: user.id,
            name: "user1",
            document: {
                id: document2.id,
                name: "File2.png",
                tags: ["user", "passport"]
            }
        });

        expect(await storage.getKeys()).to.have.lengthOf(1);
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

        expect(document2).to.be.null;
        expect(json).to.deep.equal({
            id: user.id,
            name: "user1",
            document: null
        });

        const files = await File.find();
        expect(files.length).to.equal(0);

        const keys = await storage.getKeys();
        expect(keys).to.have.lengthOf(0);
    });
});
