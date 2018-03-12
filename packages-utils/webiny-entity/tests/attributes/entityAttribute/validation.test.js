import { ModelError } from "webiny-model";
import { QueryResult } from "../../../src/index";
import { User, Company } from "../../entities/userCompanyImage";
import { One, Two } from "../../entities/oneTwoThree";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();
import { assert } from "chai";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
chai.should();

describe("entity attribute test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => User.getEntityPool().flush());

    it("should fail because an invalid instance was set", async () => {
        const user = new User();

        user.firstName = "John";
        user.lastName = "Doe";
        user.company = {
            name: "Company",
            image: new Company()
        };

        let error = null;
        try {
            await user.validate();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(
            error.data.invalidAttributes.company.data.invalidAttributes.image.type,
            ModelError.INVALID_ATTRIBUTE
        );
    });

    it("should validate root and nested values ", async () => {
        const user = new User();
        user.populate({
            firstName: "John",
            lastName: "Doe",
            company: {
                image: {
                    size: 123.45
                }
            }
        });

        let error = null;
        try {
            await user.validate();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(error.type, ModelError.INVALID_ATTRIBUTES);
        let invalid = error.data.invalidAttributes.company.data.invalidAttributes;

        assert.hasAllKeys(invalid, ["name", "image"]);
        assert.equal(invalid.name.data.validator, "required");

        assert.hasAllKeys(invalid.image.data.invalidAttributes, ["filename"]);
        assert.equal(invalid.image.data.invalidAttributes.filename.data.validator, "required");

        user.populate({
            company: {
                image: {
                    filename: "image.jpg"
                }
            }
        });

        error = null;
        try {
            await user.validate();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(error.type, ModelError.INVALID_ATTRIBUTES);
        invalid = error.data.invalidAttributes.company.data.invalidAttributes;

        assert.hasAllKeys(invalid, ["name"]);
        assert.equal(invalid.name.data.validator, "required");

        user.populate({
            company: {
                name: "Company"
            }
        });

        error = null;
        try {
            await user.validate();
        } catch (e) {
            error = e;
        }

        assert.isNull(error);
    });

    it("should validate if attribute is being loaded", async () => {
        let findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One" });
            });

        const one = await One.findById("one");

        await one.save();
        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });
        assert.equal(findById.callCount, 1);
        findById.restore();

        assert.deepEqual(one.getAttribute("two").value.state, { loaded: false, loading: false });
        one.two = 123;

        one.save().should.be.rejectedWith(ModelError);
    });

    it("should validate on attribute level and recursively on entity level", async () => {
        let findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One" });
            });

        const one = await One.findById("one");
        findById.restore();

        one
            .attr("requiredEntity")
            .entity(Two)
            .setValidators("required");

        let error = null;
        try {
            await one.validate();
        } catch (e) {
            error = e;
        }

        assert.deepEqual(error.data, {
            invalidAttributes: {
                requiredEntity: {
                    type: "invalidAttribute",
                    data: {
                        message: "Value is required.",
                        value: null,
                        validator: "required"
                    },
                    message: "Invalid attribute."
                }
            }
        });

        one.requiredEntity = { name: "two" };
        await one.validate();
    });

    it("should throw error since invalid ID was set", async () => {
        let entityFindById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One", two: "two" });
            });

        const one = await One.findById("a");

        assert.equal(entityFindById.callCount, 1);
        entityFindById.restore();

        one.two = "anotherTwo";

        let entitySave = sandbox.stub(One.getDriver(), "save").callsFake(() => new QueryResult());

        let error = null;
        try {
            await one.validate();
        } catch (e) {
            error = e;
        }

        assert.deepEqual(error.data, {
            invalidAttributes: {
                two: {
                    type: "invalidAttribute",
                    data: {},
                    message:
                        "Validation failed, received string, expecting instance of Entity class."
                }
            }
        });

        entityFindById.restore();
        entitySave.restore();
    });
});
