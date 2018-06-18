import BasicModel from "./models/basicModel.js";

const model = new BasicModel();

describe("set and get attribute values test", () => {
    test("should set and get attribute values correctly", () => {
        model.attr1 = "field1Value";
        expect(model.attr1).toEqual("field1Value");

        model.attr2 = "field2Value";
        expect(model.attr2).toEqual("field2Value");

        model.attr3 = "field3Value";
        expect(model.attr3).toEqual("field3Value");
    });
});
