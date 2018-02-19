import { assert } from "chai";
import Model from "./../lib/model";

describe("onSet test", function() {
    it("should increment the value by 3 on set", async () => {
        const model = new Model(function() {
            this.attr("number")
                .integer()
                .onSet(value => value + 3);
        });

        model.populate({ number: 2 });
        assert.equal(model.getAttribute("number").value.getCurrent(), 5);
        assert.equal(model.number, 5);
    });
});
