import * as React from "react";
import {
    CircularProgress as CircularProgressBase,
    CircularProgressProps as CircularProgressPropsBase
} from "@webiny/ui-new/Progress";

interface CircularProgressProps extends CircularProgressPropsBase {
    /**
     * @deprecated Use `text` instead.
     */
    label?: React.ReactNode;

    /**
     * @deprecated Will be removed in the future release.
     */
    size?: number;

    /**
     * @deprecated Will be removed in the future release.
     */
    spinnerColor?: string;

    /**
     * @deprecated Will be removed in the future release.
     */
    visible?: boolean;
}

// We needed this default export for backwards compatibility.
const CircularProgress = (props: CircularProgressProps) => {
    return <CircularProgressBase {...props} />;
};

CircularProgress.displayName = "CircularProgress";

export { CircularProgress };

// Needed for backward compatibility.
export default CircularProgress;
