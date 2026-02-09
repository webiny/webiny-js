import type { GraphQLFieldResolver } from "@webiny/handler-graphql/types.js";
import type { CmsModelField } from "~/types/index.js";

interface ResolverArgs {
    format?: string;
}

interface RichTextContents {
    state: string;
    html: string;
}

export const createRichTextResolver = (
    field: CmsModelField
): GraphQLFieldResolver<any, ResolverArgs> => {
    return async (entry, args) => {
        const rawValue = entry[field.fieldId] as RichTextContents;
        const outputFormat = args.format;

        // If `lexical` state is requested explicitly
        if (outputFormat === "lexical") {
            if (field.multipleValues) {
                return (rawValue as unknown as RichTextContents[]).map(value => value.state);
            }
            return rawValue?.state ?? null;
        }

        // Otherwise return HTML
        if (field.multipleValues) {
            return (rawValue as unknown as RichTextContents[]).map(value => value?.html ?? null);
        }

        return rawValue?.html ?? null;
    };
};
