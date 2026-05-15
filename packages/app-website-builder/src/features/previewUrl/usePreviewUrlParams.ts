import { useContainer } from "@webiny/app-admin";
import { PreviewUrlModifier } from "./abstractions.js";
import type { IPreviewUrlModifier } from "./abstractions.js";

export const usePreviewUrlParams = (): IPreviewUrlModifier | null => {
    const container = useContainer();
    const [modifier = null] = container.resolveAll(PreviewUrlModifier);
    return modifier;
};
