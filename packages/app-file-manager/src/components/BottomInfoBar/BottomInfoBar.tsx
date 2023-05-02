import React from "react";
import mime from "mime/lite";

import SupportedFileTypes, { SupportedFileTypesProps } from "./SupportedFileTypes";
import ListStatus, { ListStatusProps } from "./ListStatus";

import { BottomInfoBarWrapper } from "./styled";

mime.define({ "image/x-icon": ["ico"] }, true);
mime.define({ "image/jpg": ["jpg"] }, true);
mime.define({ "image/vnd.microsoft.icon": ["ico"] }, true);

export const BottomInfoBar: React.FC<SupportedFileTypesProps & ListStatusProps> = props => {
    return (
        <BottomInfoBarWrapper>
            <div>
                <SupportedFileTypes {...props} />
                <ListStatus {...props} />
            </div>
        </BottomInfoBarWrapper>
    );
};
