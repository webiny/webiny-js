import { Context } from "@webiny/api/types";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { CmsModelField } from "~/types";
import { CmsRichTextRendererPlugin, RTEContents, RichTextRenderer } from "~/plugins";
import { RichTextPluginsProcessor } from "./RichTextPluginsProcessor";

const renderersMap = new Map<string, Promise<RichTextRenderer<unknown>>>();

const getRendererByType = async (format: string, context: Context) => {
    if (!renderersMap.has(format)) {
        const renderersFactory = new Promise<RichTextRenderer<unknown>>(resolve => {
            const plugins = context.plugins
                .byType<CmsRichTextRendererPlugin<unknown>>(CmsRichTextRendererPlugin.type)
                .filter(plugin => plugin.format === format);

            const renderer = new RichTextPluginsProcessor(plugins);

            resolve((contents: RTEContents) => {
                return renderer.render(contents);
            });
        });
        renderersMap.set(format, renderersFactory);
    }

    return renderersMap.get(format) as Promise<RichTextRenderer<unknown>>;
};

interface ResolverArgs {
    format?: string;
}

export const createRichTextResolver = (
    field: CmsModelField
): GraphQLFieldResolver<any, ResolverArgs> => {
    return async (entry, args, context) => {
        const rawValue = entry[field.fieldId] as RTEContents;
        const outputFormat = args.format;

        if (!outputFormat) {
            return rawValue;
        }

        const render = await getRendererByType(outputFormat, context);

        if (field.multipleValues) {
            return rawValue.map(render);
        }

        return render(rawValue);
    };
};
