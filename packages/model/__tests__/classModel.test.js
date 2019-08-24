import BasicModel from "./models/basicModel.js";

const model = new BasicModel();

describe("class model test", () => {
    test("should return three attributes when getAttributes is called", () => {
        expect(Object.keys(model.getAttributes())).toEqual(["attr1", "attr2", "attr3"]);
    });

    test("should return attribute when called with getAttribute is called", () => {
        expect(model.getAttribute("attr1")).toBeDefined();
        expect(model.getAttribute("attr2")).toBeDefined();
        expect(model.getAttribute("attr3")).toBeDefined();
    });
});
