import { Plugin } from "@webiny/plugins";

export interface RichTextContents {
    [key: string]: any;
}

export interface CmsRichTextRenderer<T> {
    (contents: RichTextContents): Promise<T>;
}

export interface RichTextRendererMiddleware<T> {
    (contents: RichTextContents, next: CmsRichTextRenderer<T>): Promise<T> | T;
}

interface CmsRichTextRendererConstructorParams<T> {
    format: string;
    render: RichTextRendererMiddleware<T>;
}

export class CmsRichTextRendererPlugin<T = unknown> extends Plugin {
    public static override readonly type: string = "cms-rich-text-renderer";
    private readonly outputFormat: string;
    private readonly renderer: RichTextRendererMiddleware<T>;

    constructor(format: string, renderer: RichTextRendererMiddleware<T>) {
        super();
        this.outputFormat = format;
        this.renderer = renderer;
    }

    get format() {
        return this.outputFormat;
    }

    async render(contents: RichTextContents, next: CmsRichTextRenderer<T>) {
        return this.renderer(contents, next);
    }
}

export const createRichTextRenderer = <T>(
    params: CmsRichTextRendererConstructorParams<T>
): CmsRichTextRendererPlugin<T> => {
    return new CmsRichTextRendererPlugin<T>(params.format, params.render);
};
