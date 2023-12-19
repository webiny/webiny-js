import React from "react";
import { ReactComponent as CopyToClipboardIcon } from "../assets/file_copy-24px.svg";
import { IconButton } from "../index";
import { FormComponentProps } from "../../types";
import { useCallback } from "react";

export interface CopyButtonProps extends FormComponentProps {
    value: string;
    onCopy?: () => void;
}

/**
 * Shows the icon button.
 */
const CopyButton = (props: CopyButtonProps) => {
    const { value, onCopy, ...otherProps } = props;

    const copyToClipboard = useCallback(() => {
        navigator.clipboard.writeText(value);
        if (typeof onCopy === "function") {
            onCopy();
        }
    }, [value]);

    return <IconButton {...otherProps} onClick={copyToClipboard} icon={<CopyToClipboardIcon />} />;
};

export { CopyButton };
