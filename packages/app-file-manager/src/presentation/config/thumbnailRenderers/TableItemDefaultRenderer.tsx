import * as React from "react";
import { ReactComponent as HideImageIcon } from "@webiny/icons/hide_image.svg";
import { useFile } from "~/presentation/hooks/useFile.js";
import { Icon } from "@webiny/admin-ui";

export const TableItemDefaultRenderer = () => {
    const { file } = useFile();

    return (
        <div className={"w-full h-full flex items-center justify-center"}>
            <Icon color={"neutral-light"} size={"md"} icon={<HideImageIcon />} label={file.name} />
        </div>
    );
};
