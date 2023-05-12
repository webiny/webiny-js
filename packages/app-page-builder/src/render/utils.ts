import orderBy from "lodash/orderBy";
import get from "lodash/get";
import { plugins } from "@webiny/plugins";
import { PbElement, PbRenderResponsiveModePlugin } from "~/types";

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

export const getElementsPropertiesValues = (
    element: PbElement,
    property: string,
    values: Array<any> = []
) => {
    const value = get(element, property);

    if (value) {
        values.push(value);
    }

    for (const childElement of element.elements) {
        getElementsPropertiesValues(childElement, property, values);
    }

    return values;
};
