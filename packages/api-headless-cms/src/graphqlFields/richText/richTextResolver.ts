import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { CmsContext, CmsModelField } from "~/types";
import { RichTextContents } from "~/plugins";
import { RichTextRenderer } from "~/utils/RichTextRenderer";

interface ResolverArgs {
    format?: string;
}

export const createRichTextResolver = (
    field: CmsModelField
): GraphQLFieldResolver<any, ResolverArgs> => {
    return async (entry, args, context) => {
        const rawValue = entry[field.fieldId] as RichTextContents;
        const outputFormat = args.format;

        if (!outputFormat) {
            return rawValue;
        }

        const renderer = RichTextRenderer.create(context as CmsContext);

        if (field.multipleValues) {
            return (rawValue as RichTextContents[]).map(value =>
                renderer.render(outputFormat, value)
            );
        }

        return renderer.render(outputFormat, rawValue);
    };
};
