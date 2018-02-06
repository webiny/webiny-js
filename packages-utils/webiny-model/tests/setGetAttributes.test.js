import { assert } from "chai";
import BasicModel from "./models/basicModel.js";

const model = new BasicModel();

describe("set and get attribute values test", function() {
    it("should set and get attribute values correctly", function() {
        model.attr1 = "field1Value";
        assert.equal(model.attr1, "field1Value");

        model.attr2 = "field2Value";
        assert.equal(model.attr2, "field2Value");

        model.attr3 = "field3Value";
        assert.equal(model.attr3, "field3Value");
    });
});
