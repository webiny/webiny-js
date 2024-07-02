import { CmsRichTextRendererPlugin, RichTextContents } from "~/plugins";

interface RichTextRenderer {
    render(contents: RichTextContents): Promise<unknown>;
}

class NullRenderer implements RichTextRenderer {
    render(): Promise<unknown> {
        return Promise.resolve(null);
    }
}

export class RichTextPluginsProcessor {
    private renderer: RichTextRenderer;

    constructor(plugins: CmsRichTextRendererPlugin<unknown>[]) {
        this.renderer = plugins.reduce<RichTextRenderer>(
            (renderer, plugin) => new RichTextRendererDecorator(plugin, renderer),
            new NullRenderer()
        );
    }

    async render(contents: RichTextContents) {
        return this.renderer.render(contents);
    }
}

class RichTextRendererDecorator implements RichTextRenderer {
    private plugin: CmsRichTextRendererPlugin<unknown>;
    private readonly renderer: RichTextRenderer;

    constructor(plugin: CmsRichTextRendererPlugin<unknown>, renderer: RichTextRenderer) {
        this.renderer = renderer;
        this.plugin = plugin;
    }

    render(contents: RichTextContents) {
        return this.plugin.render(contents, this.next);
    }

    private next = (contents: RichTextContents) => {
        return this.renderer.render(contents);
    };
}
