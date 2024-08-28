import React from "react";
import { IconButton, IconButtonProps } from "./IconButton";

/**
 * @deprecated Will be removed in the future release.
 */
export const ButtonFloating = (props: IconButtonProps) => {
    return <IconButton {...props} variant={"primary"} />;
};
