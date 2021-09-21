import orderBy from "lodash/orderBy";

type ApplyStyle = ({
    fallbackMode,
    displayMode
}: {
    fallbackMode: string;
    displayMode: string;
}) => void;

interface Params {
    displayModes;
    applyStyle: ApplyStyle;
}

const applyPerDeviceStyleWithFallback = ({ applyStyle, displayModes }: Params) => {
    // Set per-device property value
    orderBy(displayModes, "minWidth", "desc").forEach(({ displayMode }, index, arr) => {
        const fallbackMode = index > 0 ? arr[index - 1].displayMode : "desktop";
        // Apply style
        applyStyle({ fallbackMode, displayMode });
    });
};

export default applyPerDeviceStyleWithFallback;
