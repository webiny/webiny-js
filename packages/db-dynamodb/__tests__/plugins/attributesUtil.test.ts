import { Context } from "@webiny/api";
import { getExtraAttributes } from "~/utils/attributes";
import { AttributePlugin, AttributePluginParams } from "~/plugins/definitions/AttributePlugin";

const testEntityName = "testEntity";
class TestEntityAttributePlugin extends AttributePlugin {
    public constructor(params: Omit<AttributePluginParams, "entity">) {
        super({
            ...params,
            entity: testEntityName
        });
    }
}

const stringAttribute = new TestEntityAttributePlugin({
    attribute: "text",
    params: {
        type: "string"
    }
});
const numberAttribute = new TestEntityAttributePlugin({
    attribute: "number",
    params: {
        type: "number"
    }
});
const booleanAttribute = new TestEntityAttributePlugin({
    attribute: "boolean",
    params: {
        type: "boolean"
    }
});

describe("get extra attributes", () => {
    let context: Context;

    beforeEach(() => {
        context = new Context({
            WEBINY_VERSION: process.env.WEBINY_VERSION || "w.w.w"
        });
        context.plugins.register([stringAttribute, numberAttribute, booleanAttribute]);
    });

    it("should get a list of new attributes with definitions to add", () => {
        const result = getExtraAttributes(context, "testEntity");

        expect(result).toEqual({
            ...stringAttribute.getDefinition(),
            ...numberAttribute.getDefinition(),
            ...booleanAttribute.getDefinition()
        });
    });
});
