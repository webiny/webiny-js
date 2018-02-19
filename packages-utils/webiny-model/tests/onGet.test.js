import { assert } from "chai";
import Model from "./../lib/model";

describe("onGet test", function() {
    it("should increment value by 2 on get", async () => {
        const model = new Model(function() {
            this.attr("number")
                .integer()
                .onGet(value => value + 2);
        });

        model.populate({ number: 2 });
        assert.equal(model.getAttribute("number").value.getCurrent(), 2);
        assert.equal(model.number, 4);
    });
});
