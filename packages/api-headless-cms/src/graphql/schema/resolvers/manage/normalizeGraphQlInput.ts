import { mutableSet } from "@webiny/utils/dotProp/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { CmsEntryResolverFactory, CmsModel } from "~/types/index.js";
import type { IContentEntryTraverser } from "~/features/contentEntry/ContentEntryTraverser/ContentEntryTraverser.js";
import { ContentEntryTraverserProvider } from "~/features/contentEntry/ContentEntryTraverser/index.js";
import type { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

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
            const normalizer = new GraphQlInputNormalizer(traverser, params.fieldRegistry);
            const normalizedInput = await normalizer.normalize(params.model, input);

            return resolver(parent, { ...args, data: normalizedInput }, context, info);
        };
    };
};

class GraphQlInputNormalizer {
    private readonly traverser: IContentEntryTraverser;
    private readonly fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;

    constructor(
        traverser: IContentEntryTraverser,
        fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface
    ) {
        this.traverser = traverser;
        this.fieldRegistry = fieldRegistry;
    }

    async normalize(model: CmsModel, data: GenericRecord<string>) {
        const values = structuredClone(data.values || {});

        await this.traverser.traverse(values, async ({ path, value, field }) => {
            const fieldImpl = this.fieldRegistry.get(field.type);
            if (fieldImpl && typeof fieldImpl.manage.normalizeInput === "function") {
                const normalizedValue = await fieldImpl.manage.normalizeInput({
                    model,
                    field,
                    input: value
                });

                mutableSet(values, path, normalizedValue);
            }
        });

        return { ...data, values };
    }
}
