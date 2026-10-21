import React from "react";
import { Text } from "@webiny/admin-ui";
import type { WbStatus } from "~/constants.js";
import { toTitleCaseLabel } from "~/shared/toTitleCaseLabel.js";

interface LayoutStatusProps {
    status: WbStatus;
    liveVersion: number | null;
}

export const LayoutStatus = ({ status, liveVersion }: LayoutStatusProps) => {
    // The latest revision is a draft, but an earlier one is published.
    const live = status !== "published" && liveVersion ? ` (v${liveVersion} is live)` : "";

    return (
        <Text size={"sm"} className={"text-neutral-primary"}>
            {`${toTitleCaseLabel(status)}${live}`}
        </Text>
    );
};
