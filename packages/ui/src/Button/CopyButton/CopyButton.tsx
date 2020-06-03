import * as React from "react";
import { ReactComponent as CopyToClipboardIcon } from "../assets/file_copy-24px.svg";
import { IconButton } from "../index";
import { FormComponentProps } from "../../types";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

export type CopyButtonProps = FormComponentProps & {
    value: string;
};

/**
 * Shows the icon button.
 * @param props
 * @returns {*}
 * @constructor
 */
const CopyButton = (props: CopyButtonProps) => {
    const { showSnackbar } = useSnackbar();
    const { value, ...otherProps } = props;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(value);
        showSnackbar("Succesfully copied!");
    };

    return <IconButton {...otherProps} onClick={copyToClipboard} icon={<CopyToClipboardIcon />} />;
};

export { CopyButton };
