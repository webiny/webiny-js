import { assert } from "chai";
import Model from "./../lib/model";

describe("validateType / validateValue test", function() {
    it("empty validateType / validateValue should not do anything", async () => {
        const model = new Model(function() {
            this.attr("email").dynamic();
        });

        const attribute = model.getAttribute("email");
        await attribute.validateType();
        await attribute.validateValue();
    });
});
