import React from "react";
import { CopyButton as AdminUiCopyButton } from "@webiny/admin-ui";

interface CopyButtonProps {
    /**
     * Value to copy to clipboard.
     */
    value: string;

    /**
     * Callback function that is executed after the value is copied to the clipboard.
     */
    onCopy?: () => void;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `CopyButton` component from the `@webiny/admin-ui` package instead.
 */
const CopyButton = (props: CopyButtonProps) => {
    return <AdminUiCopyButton {...props} />;
};

export { CopyButton, CopyButtonProps };
