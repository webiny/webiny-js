import { expect } from "chai";

import { Entity, EntityError } from "webiny-entity";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("dynamic entity class test", function() {
    afterEach(() => sandbox.restore());

    it("should return a class", async () => {
        class C extends Entity {}

        C.classId = "C";

        class Main extends Entity {
            constructor() {
                super();
                this.attr("type").char();
                this.attr("entity").entity(C);
            }
        }

        const main = new Main();
        expect(main.getAttribute("entity").getEntityClass()).to.equal(C);
    });
});
