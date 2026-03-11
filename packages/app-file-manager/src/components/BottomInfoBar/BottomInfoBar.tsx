import React from "react";
import mime from "mime/lite";
import { Separator } from "@webiny/admin-ui";

import type { SupportedFileTypesProps } from "./SupportedFileTypes.js";
import { SupportedFileTypes } from "./SupportedFileTypes.js";
import type { ListStatusProps } from "./ListStatus.js";
import ListStatus from "./ListStatus.js";

mime.define({ "image/x-icon": ["ico"] }, true);
mime.define({ "image/jpg": ["jpg"] }, true);
mime.define({ "image/vnd.microsoft.icon": ["ico"] }, true);

type BottomInfoBarProps = SupportedFileTypesProps & ListStatusProps;

export const BottomInfoBar = (props: BottomInfoBarProps) => {
    return (
        <div className="bg-neutral-base w-full overflow-hidden z-5">
            <Separator />
            <div className={"h-xl px-md py-sm flex items-center justify-between"}>
                <SupportedFileTypes {...props} />
                <ListStatus {...props} />
            </div>
        </div>
    );
};
