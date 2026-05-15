import { createAbstraction } from "@webiny/feature/admin";

export interface IPreviewUrlModifier {
    getQueryParams(): Record<string, string>;
}

export const PreviewUrlModifier = createAbstraction<IPreviewUrlModifier>(
    "WebsiteBuilder/PreviewUrlModifier"
);

export namespace PreviewUrlModifier {
    export type Interface = IPreviewUrlModifier;
}
