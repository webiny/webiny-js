import set from "lodash/set.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { CmsEntryResolverFactory, CmsFieldTypePlugins, CmsModel } from "~/types/index.js";
import type { IContentEntryTraverser } from "~/features/contentEntry/ContentEntryTraverser/ContentEntryTraverser.js";
import { ContentEntryTraverserProvider } from "~/features/contentEntry/ContentEntryTraverser/index.js";

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

            const traverserProvider = context.container.resolve(ContentEntryTraverserProvider);
            const traverser = await traverserProvider.getTraverser(params.model.modelId);
            const normalizer = new GraphQlInputNormalizer(traverser, params.fieldTypePlugins);
            const normalizedInput = await normalizer.normalize(params.model, input);

            return resolver(parent, { ...args, data: normalizedInput }, context, info);
        };
    };
};

class GraphQlInputNormalizer {
    private readonly traverser: IContentEntryTraverser;
    private readonly fieldTypePlugins: CmsFieldTypePlugins;

    constructor(traverser: IContentEntryTraverser, fieldTypePlugins: CmsFieldTypePlugins) {
        this.traverser = traverser;
        this.fieldTypePlugins = fieldTypePlugins;
    }

    async normalize(model: CmsModel, data: GenericRecord<string>) {
        const values = structuredClone(data.values || {});

        await this.traverser.traverse(values, async ({ path, value, field }) => {
            const fieldPlugin = this.fieldTypePlugins[field.type];
            if (fieldPlugin && typeof fieldPlugin.manage.normalizeInput === "function") {
                const normalizedValue = await fieldPlugin.manage.normalizeInput({
                    model,
                    field,
                    input: value
                });

                set(values, path, normalizedValue);
            }
        });

        return { ...data, values };
    }
}
