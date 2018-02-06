import { assert } from "chai";
import { Model, ModelAttribute } from "./../src";
import DefaultAttributesContainer from "./../src/defaultAttributesContainer";

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

describe("overriding attributes container test", function() {
    it("old methods should work", () => {
        assert.isFunction(model.getAttributesContainer().boolean);
        assert.isFunction(model.getAttributesContainer().char);
        assert.isFunction(model.getAttributesContainer().integer);
    });

    it("new method should work", () => {
        assert.isFunction(model.getAttributesContainer().newAttribute);
        assert.equal(model.getAttributesContainer().newAttribute(), 5);
    });

    it("should be able to work with a custom attribute", async () => {
        class IdentityModel extends Model {
            constructor() {
                super();
                this.attr("classId").char();
                this.attr("identity").char();
            }
        }

        class IdentityAttribute extends ModelAttribute {
            constructor() {
                super();
                this.modelClass = IdentityModel;
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
        assert.deepEqual(json, {
            title: "testing custom attribute",
            assignedTo: {
                classId: "User",
                identity: 44
            }
        });
    });
});
