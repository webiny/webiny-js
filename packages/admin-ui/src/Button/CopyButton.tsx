import React from "react";
import { ReactComponent as CopyToClipboardIcon } from "@material-design-icons/svg/filled/content_copy.svg";
import { ButtonProps } from "./Button";
import { IconButton } from "./IconButton";
import { useCallback } from "react";
import { makeDecoratable } from "@webiny/react-composition";

interface CopyButtonProps extends ButtonProps {
    /**
     * Value to copy to clipboard.
     */
    value: string;

    /**
     * Callback function that is executed after the value is copied to the clipboard.
     */
    onCopy?: () => void;
}

const CopyButtonBase = (props: CopyButtonProps) => {
    const { value, onCopy, ...rest } = props;

    const copyToClipboard = useCallback(() => {
        navigator.clipboard.writeText(value);
        if (typeof onCopy === "function") {
            onCopy();
        }
    }, [value]);

    return <IconButton {...rest} onClick={copyToClipboard} icon={<CopyToClipboardIcon />} />;
};

const CopyButton = makeDecoratable("CopyButton", CopyButtonBase);

export { CopyButton, CopyButtonProps };
