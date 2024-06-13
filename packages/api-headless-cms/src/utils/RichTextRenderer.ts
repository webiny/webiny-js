import { CmsRichTextRendererPlugin, RichTextContents } from "~/plugins";
import { CmsContext } from "~/types";
import { RichTextPluginsProcessor } from "~/graphqlFields/richText/RichTextPluginsProcessor";

export class RichTextRenderer {
    private renderersMap = new Map<string, RichTextPluginsProcessor>();
    private plugins: CmsRichTextRendererPlugin[] = [];

    private constructor(plugins: CmsRichTextRendererPlugin[]) {
        this.plugins = plugins;
    }

    static create(context: CmsContext) {
        const rendererPlugins = context.plugins.byType<CmsRichTextRendererPlugin>(
            CmsRichTextRendererPlugin.type
        );
        return new RichTextRenderer(rendererPlugins);
    }

    async render(format: string, contents: RichTextContents) {
        const renderer = this.getRendererByType(format);

        return renderer.render(contents);
    }

    private getRendererByType(format: string) {
        if (!this.renderersMap.has(format)) {
            const plugins = this.plugins.filter(plugin => plugin.format === format);

            this.renderersMap.set(format, new RichTextPluginsProcessor(plugins));
        }

        return this.renderersMap.get(format) as RichTextPluginsProcessor;
    }
}
