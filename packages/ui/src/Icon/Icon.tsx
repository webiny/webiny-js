import React from "react";
import { Icon as AdminUiIcon } from "@webiny/admin-ui/Icon";

export type IconProps = {
    /**
     * SvgComponent containing the svg icon
     */
    icon: React.ReactElement;

    /**
     * Optional onclick handler
     */
    onClick?: (value: any) => void;

    /**
     * CSS class to be added to the icon
     */
    className?: string;

    // For testing purposes.
    "data-testid"?: string;

    /**
     * Aria label
     */
    label?: string;
};

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Icon` component from the `@webiny/admin-ui` package instead.
 */
const Icon = (props: IconProps) => {
    return <AdminUiIcon {...props} label={props.label || ""} />;
};

export { Icon };
