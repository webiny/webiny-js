import { ModelError } from "@webiny/model";
import { QueryResult } from "@webiny/entity";
import { User, Company } from "../../entities/userCompanyImage";
import { One, Two } from "../../entities/oneTwoThree";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("entity attribute test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => User.getEntityPool().flush());

    test("should fail because an invalid instance was set", async () => {
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

        expect(error).toBeInstanceOf(ModelError);
        expect(error.data.invalidAttributes.company.data.invalidAttributes.image.code).toEqual(
            ModelError.INVALID_ATTRIBUTE
        );
    });

    test("should validate root and nested values ", async () => {
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

        expect(error).toBeInstanceOf(ModelError);
        expect(error.code).toEqual(ModelError.INVALID_ATTRIBUTES);
        let invalid = error.data.invalidAttributes.company.data.invalidAttributes;

        expect(Object.keys(invalid)).toEqual(["name", "image"]);
        expect(invalid.name.data.validator).toEqual("required");

        expect(Object.keys(invalid.image.data.invalidAttributes)).toEqual(["filename"]);
        expect(invalid.image.data.invalidAttributes.filename.data.validator).toEqual("required");

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

        expect(error).toBeInstanceOf(ModelError);
        expect(error.code).toEqual(ModelError.INVALID_ATTRIBUTES);
        invalid = error.data.invalidAttributes.company.data.invalidAttributes;

        expect(Object.keys(invalid)).toEqual(["name"]);
        expect(invalid.name.data.validator).toEqual("required");

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

        expect(error).toBeNull();
    });

    test("should validate if attribute is being loaded", async () => {
        let findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One" });
            });

        const one = await One.findById("one");

        await one.save();
        expect(one.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });
        expect(findById.callCount).toEqual(1);
        findById.restore();

        expect(one.getAttribute("two").value.state).toEqual({ loaded: false, loading: false });
        one.two = 123;

        await expect(one.save()).rejects.toThrow(ModelError);
    });

    test("should validate on attribute level and recursively on entity level", async () => {
        let findById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One" });
            });

        const one = await One.findById("one");
        findById.restore();

        one.attr("requiredEntity")
            .entity(Two)
            .setValidators("required");

        let error = null;
        try {
            await one.validate();
        } catch (e) {
            error = e;
        }

        expect(error.data).toEqual({
            invalidAttributes: {
                requiredEntity: {
                    code: "INVALID_ATTRIBUTE",
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

    test("should throw error since invalid ID was set", async () => {
        let entityFindById = sandbox
            .stub(One.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "one", name: "One", two: "two" });
            });

        const one = await One.findById("a");

        expect(entityFindById.callCount).toEqual(1);
        entityFindById.restore();

        one.two = "anotherTwo";

        let entitySave = sandbox.stub(One.getDriver(), "save").callsFake(() => new QueryResult());

        let error = null;
        try {
            await one.validate();
        } catch (e) {
            error = e;
        }

        expect(error.data).toEqual({
            invalidAttributes: {
                two: {
                    code: "INVALID_ATTRIBUTE",
                    data: null,
                    message:
                        "Validation failed, received string, expecting instance of Entity class."
                }
            }
        });

        entityFindById.restore();
        entitySave.restore();
    });
});
