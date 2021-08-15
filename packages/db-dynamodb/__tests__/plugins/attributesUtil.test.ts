import { ContextInterface } from "@webiny/handler/types";
import { PluginsContainer } from "@webiny/plugins";
import { getExtraAttributes } from "~/utils/attributes";
import { AttributePlugin, Params } from "~/plugins/definitions/AttributePlugin";

const testEntityName = "testEntity";
class TestEntityAttributePlugin extends AttributePlugin {
    public constructor(params: Omit<Params, "entity">) {
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
    let context: ContextInterface;

    beforeEach(() => {
        context = {
            args: [],
            plugins: new PluginsContainer(),
            WEBINY_VERSION: process.env.WEBINY_VERSION
        };
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
