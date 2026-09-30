import React from "react";
import { ReactComponent as PlaceholderIcon } from "@webiny/icons/image.svg";
import type { FileItemFormatted } from "~/FilePicker/index.js";
import { Icon } from "~/Icon/index.js";

type PlaceholderProps = Pick<FileItemFormatted, "name">;

/**
 * Shown when the caller asks for a placeholder rather than the file's own preview.
 */
const Placeholder = ({ name }: PlaceholderProps) => {
    return (
        <div className={"size-full flex justify-center items-center bg-transparent"}>
            <Icon icon={<PlaceholderIcon />} label={name} size={"lg"} color={"neutral-light"} />
        </div>
    );
};

export { Placeholder, type PlaceholderProps };
