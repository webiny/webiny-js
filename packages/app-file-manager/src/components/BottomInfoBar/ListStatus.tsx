import React from "react";
import { i18n } from "@webiny/app/i18n";
import { CircularProgress } from "@webiny/ui/Progress";

import { CircularProgressHolder, StatusWrapper, UploadingLabel } from "./styled";

const t = i18n.ns("app-admin/file-manager/components/bottom-info-bar/list-status");

export interface ListStatusProps {
    listing: boolean;
}

const ListStatus = ({ listing }: ListStatusProps) => {
    if (!listing) {
        return null;
    }

    return (
        <StatusWrapper>
            <UploadingLabel>{t`Loading more files...`}</UploadingLabel>
            <CircularProgressHolder>
                <CircularProgress size={10} spinnerWidth={1} />
            </CircularProgressHolder>
        </StatusWrapper>
    );
};

export default ListStatus;
