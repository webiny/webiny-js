import React from "react";
import { i18n } from "@webiny/app/i18n";
import { CircularProgress } from "@webiny/ui/Progress";

import { CircularProgressHolder, StatusWrapper, UploadingLabel } from "./styled";

const t = i18n.ns("app-admin/file-manager/components/bottom-info-bar/list-status");

export interface ListStatusProps {
    uploading: boolean;
    listing: boolean;
}

const ListStatus: React.FC<ListStatusProps> = ({ uploading, listing }) => {
    if (!uploading && !listing) {
        return null;
    }

    const label = listing ? t`Loading more files...` : t`Uploading...`;

    return (
        <StatusWrapper>
            <UploadingLabel>{label}</UploadingLabel>
            <CircularProgressHolder>
                <CircularProgress size={10} spinnerWidth={1} />
            </CircularProgressHolder>
        </StatusWrapper>
    );
};

export default ListStatus;
