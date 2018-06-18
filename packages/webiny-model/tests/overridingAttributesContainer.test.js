import { Model, ModelAttribute } from "./../src";
import DefaultAttributesContainer from "./../src/defaultAttributesContainer";
import { AttributesContainer } from "../src";

class DefaultAttributesContainerOverride extends DefaultAttributesContainer {
    newAttribute() {
        return 5;
    }
}

class ModelOverride extends Model {
    createAttributesContainer() {
        return new DefaultAttributesContainerOverride(this);
    }
}

const model = new ModelOverride();

describe("overriding attributes container test", () => {
    test("old methods should work", () => {
        expect(typeof model.getAttributesContainer().boolean).toBe("function");
        expect(typeof model.getAttributesContainer().char).toBe("function");
        expect(typeof model.getAttributesContainer().integer).toBe("function");
    });

    test("new method should work", () => {
        expect(typeof model.getAttributesContainer().newAttribute).toBe("function");
        expect(model.getAttributesContainer().newAttribute()).toEqual(5);
    });

    test("should be able to work with a custom attribute", async () => {
        class IdentityModel extends Model {
            constructor() {
                super();
                this.attr("classId").char();
                this.attr("identity").char();
            }
        }

        class IdentityAttribute extends ModelAttribute {
            constructor(name: string, attributesContainer: AttributesContainer) {
                super(name, attributesContainer, IdentityModel);
            }
        }

        class Issue extends Model {
            constructor() {
                super();
                this.attr("title").char();
                this.attr("assignedTo").custom(IdentityAttribute);
            }
        }

        const issue = new Issue();
        issue.populate({
            title: "testing custom attribute",
            assignedTo: {
                classId: "User",
                identity: 44
            }
        });

        const json = await issue.toJSON("title,assignedTo[classId,identity]");
        expect(json).toEqual({
            title: "testing custom attribute",
            assignedTo: {
                classId: "User",
                identity: 44
            }
        });
    });
});
