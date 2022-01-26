import orderBy from "lodash/orderBy";
import { plugins } from "@webiny/plugins";
import { PbRenderResponsiveModePlugin } from "~/types";

type ApplyStyle = ({
    fallbackMode,
    displayMode
}: {
    fallbackMode: string;
    displayMode: string;
}) => void;

export const applyPerDeviceStyleWithFallback = (applyStyle: ApplyStyle): void => {
    // Get display modes
    const displayModeConfigs = plugins
        .byType<PbRenderResponsiveModePlugin>("pb-render-responsive-mode")
        .map(pl => pl.config);

    // Set per-device property value
    orderBy(displayModeConfigs, "minWidth", "desc").forEach(({ displayMode }, index, arr) => {
        const fallbackMode = index > 0 ? arr[index - 1].displayMode : "desktop";
        // Apply style
        applyStyle({ fallbackMode, displayMode });
    });
};
