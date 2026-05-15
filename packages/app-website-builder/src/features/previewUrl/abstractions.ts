import { createAbstraction } from "@webiny/feature/admin";

export interface IPreviewUrlModifier {
    modify(url: URL): Promise<void>;
}

export const PreviewUrlModifier = createAbstraction<IPreviewUrlModifier>(
    "WebsiteBuilder/PreviewUrlModifier"
);

export namespace PreviewUrlModifier {
    export type Interface = IPreviewUrlModifier;
}
