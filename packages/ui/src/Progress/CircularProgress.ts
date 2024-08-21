import { CircularProgress } from "@webiny/ui-new/Progress";
import * as React from "react";

interface CircularProgressProps {
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
    spinnerWidth?: number;

    /**
     * @deprecated Will be removed in the future release.
     */
    visible?: boolean;
}

// We needed this default export for backwards compatibility.
export default CircularProgress;
