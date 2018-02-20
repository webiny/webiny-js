import { assert } from "chai";
import Model from "./../../src/model";

const model = new Model(function() {
    this.attr("attribute").dynamic(() => {
        return 5;
    });

    this.attr("amount1").integer();
    this.attr("amount2").integer();

    this.attr("sum").dynamic(({ model }) => {
        return model.getAttribute("amount1").getValue() + model.getAttribute("amount2").getValue();
    });
    this.attr("div").dynamic(function() {
        return this.getAttribute("amount1").getValue() / this.getAttribute("amount2").getValue();
    });
});

describe("attribute boolean test", function() {
    it("should return a number", () => {
        assert.equal(model.attribute, 5);
    });

    it("shouldn't assign value", () => {
        model.attribute = 10;
        assert.equal(model.attribute, 5);
    });

    it("should accept arrow function as an attribute callback", () => {
        model.amount1 = 5;
        model.amount2 = 10;

        assert.equal(model.sum, 15);

        model.amount1 = 10;
        model.amount2 = 90;

        assert.equal(model.sum, 100);
    });

    it("should accept regular function as an attribute callback", () => {
        model.amount1 = 100;
        model.amount2 = 50;

        assert.equal(model.div, 2);

        model.amount1 = 2;
        model.amount2 = 2;

        assert.equal(model.div, 1);
    });
});
