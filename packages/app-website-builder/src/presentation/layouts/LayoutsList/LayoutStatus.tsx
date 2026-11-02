import React from "react";
import { Tag } from "@webiny/admin-ui";
import type { WbStatus } from "~/constants.js";
import { toTitleCaseLabel } from "~/shared/toTitleCaseLabel.js";

const getStatusVariant = (status: WbStatus) => {
    switch (status) {
        case "published":
            return "success";
        case "unpublished":
            return "warning";
        default:
            return "neutral-light";
    }
};

interface LayoutStatusProps {
    status: WbStatus;
    version: number;
}

/**
 * The latest revision's status, as the Pages list shows it.
 */
export const LayoutStatus = ({ status, version }: LayoutStatusProps) => {
    return (
        <Tag
            variant={getStatusVariant(status)}
            content={`${toTitleCaseLabel(status)} (v${version})`}
        />
    );
};

interface LayoutLiveProps {
    liveVersion: number | null;
}

/**
 * The published revision pages render, as the Pages list shows it.
 */
export const LayoutLive = ({ liveVersion }: LayoutLiveProps) => {
    if (!liveVersion) {
        return <>{"No"}</>;
    }

    return (
        <Tag swatchColor={"#5AC84C"} variant={"success-light"} content={`Live (v${liveVersion})`} />
    );
};
