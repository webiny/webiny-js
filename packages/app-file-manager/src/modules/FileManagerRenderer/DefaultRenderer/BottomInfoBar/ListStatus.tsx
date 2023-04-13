import React from "react";
import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { CircularProgress } from "@webiny/ui/Progress";

const t = i18n.ns("app-admin/file-manager/file-manager-view/bottom-info-bar/status");

const StatusWrapper = styled("div")({
    color: "var(--mdc-theme-primary)",
    position: "absolute",
    right: 0,
    bottom: 10,
    marginRight: 10,
    display: "flex",
    alignItems: "center",
    "> div": {
        display: "inline-block"
    }
});

const CircularProgressHolder = styled("div")({
    position: "relative",
    height: 12,
    width: 12
});

const UploadingLabel = styled("div")({
    marginRight: 5
});

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
