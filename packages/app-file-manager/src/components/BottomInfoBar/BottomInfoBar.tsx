import React from "react";
import mime from "mime/lite";

import SupportedFileTypes, { SupportedFileTypesProps } from "./SupportedFileTypes";
import ListStatus, { ListStatusProps } from "./ListStatus";

import { BottomInfoBarInner, BottomInfoBarWrapper } from "./styled";

mime.define({ "image/x-icon": ["ico"] }, true);
mime.define({ "image/jpg": ["jpg"] }, true);
mime.define({ "image/vnd.microsoft.icon": ["ico"] }, true);

type BottomInfoBarProps = SupportedFileTypesProps & ListStatusProps;

export const BottomInfoBar = (props: BottomInfoBarProps) => {
    return (
        <BottomInfoBarWrapper>
            <BottomInfoBarInner>
                <SupportedFileTypes {...props} />
                <ListStatus {...props} />
            </BottomInfoBarInner>
        </BottomInfoBarWrapper>
    );
};
