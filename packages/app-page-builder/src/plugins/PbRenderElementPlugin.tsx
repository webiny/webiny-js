import type { PbRenderElementPlugin as BasePbRenderElementPlugin } from "~/types";
import { legacyPluginToReactComponent } from "@webiny/app/utils";

export const PbRenderElementPlugin = legacyPluginToReactComponent<
    Pick<BasePbRenderElementPlugin, "elementType" | "render">
>({
    pluginType: "pb-render-page-element",
    componentDisplayName: "PbRenderElementPlugin"
});
