import { assert } from "chai";
import Model from "./../src/model";
import sinon from "sinon";
const sandbox = sinon.sandbox.create();

describe("setDefaultValue test", function() {
    it("should set/get default values", async () => {
        const model = new Model(function() {
            this.attr("email")
                .char()
                .setValidators("required,email")
                .setDefaultValue("test@gmail.com");
            this.attr("something")
                .boolean()
                .setValidators("required")
                .setDefaultValue(false);
            this.attr("something2")
                .integer()
                .setDefaultValue(555);
            this.attr("something3")
                .integer()
                .setDefaultValue(() => 666);
            this.attr("createdOn")
                .date()
                .setValidators()
                .setDefaultValue(new Date());
        });

        await model.populate({});

        assert.equal(model.email, "test@gmail.com");
        assert.equal(model.something, false);
        assert.equal(model.something2, 555);
        assert.equal(model.something3, 666);
        assert.instanceOf(model.createdOn, Date);
    });

    it("should call setValue for setting default value and mark attribute as dirty", async () => {
        const model = new Model(function() {
            this.attr("email")
                .char()
                .setValidators("required,email")
                .setDefaultValue("test@gmail.com");
        });

        const setValueSpy = sandbox.spy(model.getAttribute("email"), "setValue");
        await model.populate({});

        assert.equal(model.email, "test@gmail.com");
        assert.isTrue(model.getAttribute("email").value.isDirty());
        assert.equal(setValueSpy.callCount, 1);
        assert.equal(setValueSpy.getCall(0).args[0], "test@gmail.com");

        setValueSpy.restore();
    });
});
