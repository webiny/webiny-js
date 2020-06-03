import * as React from "react";
import { ReactComponent as CopyToClipboardIcon } from "../assets/file_copy-24px.svg";
import { IconButton } from "../index";
import { FormComponentProps } from "../../types";

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
    const { value, ...otherProps } = props;

    return (
        <IconButton
            {...otherProps}
            onClick={() => navigator.clipboard.writeText(value)}
            icon={<CopyToClipboardIcon />}
        />
    );
};

export { CopyButton };
