import { useContainer } from "@webiny/app-admin";
import { PreviewUrlModifier } from "./abstractions.js";

export const usePreviewUrlParams = (): PreviewUrlModifier.Interface | null => {
    const container = useContainer();
    const [modifier = null] = container.resolveAll(PreviewUrlModifier);
    return modifier;
};
