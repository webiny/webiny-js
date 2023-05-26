import React from "react";
import { ReactComponent as DraftIcon } from "./assets/status-draft.svg";
import { ReactComponent as PublishedIcon } from "./assets/status-published.svg";
import { ReactComponent as UnpublishedIcon } from "./assets/status-unpublished.svg";
import { Box } from "./Box";
import { CmsContentEntryStatusType } from "@webiny/app-headless-cms-common/types";

const getIcon = (status: CmsContentEntryStatusType) => {
    switch (status) {
        case "published":
            return <PublishedIcon />;
        case "unpublished":
            return <UnpublishedIcon />;
        case "draft":
            return <DraftIcon />;
        default:
            return null;
    }
};

interface Props {
    status: CmsContentEntryStatusType;
}
export const Status: React.VFC<Props> = ({ status }) => {
    return (
        <Box icon={getIcon(status)} name={"Status"}>
            {status.toUpperCase()}
        </Box>
    );
};
