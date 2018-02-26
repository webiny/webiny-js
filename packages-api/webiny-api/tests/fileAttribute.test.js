import { expect } from "chai";
import { Storage } from "webiny-file-storage";
import { MemoryDriver } from "webiny-entity-memory";

import registerAttributes from "./../src/attributes/registerAttributes";
import { jpegBase64 } from "./utils/base64Data";
import { Entity } from "../src/entities";
import userFactory from "./utils/user.entity";
import MockDriver from "./utils/storageDriverMock";

let User;

const data1 = {
    name: "File1.jpeg",
    src: jpegBase64,
    type: "image/jpeg",
    tags: ["passport"]
};

describe("File attribute test", () => {
    before(() => {
        Entity.driver = new MemoryDriver();
        registerAttributes();
        const storage = new Storage(new MockDriver({ cdnUrl: "https://cdn.webiny.com" }));
        User = userFactory({ documentStorage: storage });
    });

    it("should save file entity", async function() {
        return;

        const user = new User();
        const userData = {
            name: "user1",
            document: data1
        };

        user.populate(userData);
        await user.document;
        await user.save();
        const fileUrl = user.document.getUrl();
        const json = await user.toJSON("name,document[name,src,tags]");
        expect(json).to.deep.equal({
            name: "user1",
            document: {
                name: "File1.jpeg",
                src: fileUrl,
                tags: ["user", "passport"]
            }
        });
    });
});
