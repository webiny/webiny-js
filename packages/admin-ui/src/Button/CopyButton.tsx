import React from "react";
import { ReactComponent as CopyToClipboardIcon } from "@material-design-icons/svg/filled/content_copy.svg";
import { IconButton, IconButtonProps } from "./IconButton";
import { useCallback } from "react";

export interface CopyButtonProps extends IconButtonProps {
    value: string;
    onCopy?: () => void;
}

const CopyButton = (props: CopyButtonProps) => {
    const { value, onCopy, ...rest } = props;

    const copyToClipboard = useCallback(() => {
        navigator.clipboard.writeText(value);
        if (typeof onCopy === "function") {
            onCopy();
        }
    }, [value]);

    return <IconButton {...rest} onClick={copyToClipboard} icon={<CopyToClipboardIcon />} />;
};

export { CopyButton };
