import { Plugin } from "@webiny/plugins";

export interface RTEContents {
    [key: string]: any;
}

export interface RichTextRenderer<T> {
    (contents: RTEContents): Promise<T>;
}

export interface RichTextRendererMiddleware<T> {
    (contents: RTEContents, next: RichTextRenderer<T>): Promise<T> | T;
}

interface CmsRichTextRendererConstructorParams<T> {
    format: string;
    render: RichTextRendererMiddleware<T>;
}

export class CmsRichTextRendererPlugin<T> extends Plugin {
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

    async render(contents: RTEContents, next: RichTextRenderer<T>) {
        return this.renderer(contents, next);
    }
}

export const createRichTextRenderer = <T>(
    params: CmsRichTextRendererConstructorParams<T>
): CmsRichTextRendererPlugin<T> => {
    return new CmsRichTextRendererPlugin<T>(params.format, params.render);
};
