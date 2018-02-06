import { expect } from "chai";

import { Entity } from "webiny-entity";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("dynamic entity class test", function() {
    afterEach(() => sandbox.restore());

    it("should be able to assign a function that will be executed and return a class", async () => {
        class A extends Entity {}

        class B extends Entity {}

        class C extends Entity {}

        class Main extends Entity {
            constructor() {
                super();
                this.attr("type").char();
                this.attr("entity").entity(() => {
                    switch (this.type) {
                        case "A":
                            return A;
                        case "B":
                            return B;
                        default:
                            return C;
                    }
                });
            }
        }

        const main = new Main();
        expect(main.getAttribute("entity").getEntityClass()).to.equal(C);

        main.type = "A";
        expect(main.getAttribute("entity").getEntityClass()).to.equal(A);

        main.type = "B";
        expect(main.getAttribute("entity").getEntityClass()).to.equal(B);
    });

    it("return a class", async () => {
        class C extends Entity {}

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
