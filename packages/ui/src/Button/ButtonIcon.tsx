import React from "react";
import { Icon } from "~/Icon";

export interface ButtonIconProps {
    icon: React.ReactElement;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Icon` component from the `@webiny/admin-ui` package instead.
 */
export const ButtonIcon = (props: ButtonIconProps) => {
    return <Icon {...props}/>;
};
