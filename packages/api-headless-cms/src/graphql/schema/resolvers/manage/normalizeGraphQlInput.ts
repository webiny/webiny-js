import set from "lodash/set";
import { GenericRecord } from "@webiny/api/types";
import { CmsEntryResolverFactory, CmsFieldTypePlugins, CmsModel } from "~/types";
import { ContentEntryTraverser } from "~/utils/contentEntryTraverser/ContentEntryTraverser";

/**
 * This decorates a resolver factory, and normalizes `args.data`.
 * This is necessary to separate GraphQL related hacks (like lack of support for union input type)
 * from our own programmatic API. We want the input into our domain logic to be free of GraphQL hacks.
 */
export const normalizeGraphQlInput = (
    resolverFactory: CmsEntryResolverFactory
): CmsEntryResolverFactory => {
    return params => {
        const resolver = resolverFactory(params);

        return async (parent, args, context, info) => {
            const input = args.data;

            if (!input) {
                return resolver(parent, args, context, info);
            }

            const traverser = await context.cms.getEntryTraverser(params.model.modelId);
            const normalizer = new GraphQlInputNormalizer(traverser, params.fieldTypePlugins);
            const normalizedInput = await normalizer.normalize(params.model, input);

            return resolver(parent, { ...args, data: normalizedInput }, context, info);
        };
    };
};

class GraphQlInputNormalizer {
    private readonly traverser: ContentEntryTraverser;
    private readonly fieldTypePlugins: CmsFieldTypePlugins;

    constructor(traverser: ContentEntryTraverser, fieldTypePlugins: CmsFieldTypePlugins) {
        this.traverser = traverser;
        this.fieldTypePlugins = fieldTypePlugins;
    }

    async normalize(model: CmsModel, data: GenericRecord<string>) {
        const output = structuredClone(data);

        await this.traverser.traverse(output, async ({ path, value, field }) => {
            const fieldPlugin = this.fieldTypePlugins[field.type];
            if (fieldPlugin && typeof fieldPlugin.manage.normalizeInput === "function") {
                const normalizedValue = await fieldPlugin.manage.normalizeInput({
                    model,
                    field,
                    input: value
                });

                set(output, path, normalizedValue);
            }
        });

        return output;
    }
}
