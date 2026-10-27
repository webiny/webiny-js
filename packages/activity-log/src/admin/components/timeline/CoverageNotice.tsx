import React from "react";
import { Alert, Text } from "@webiny/admin-ui";
import { ReactComponent as HistoryToggleOffIcon } from "@webiny/icons/history_toggle_off.svg";
import type { TimelineCoverage } from "~/admin/timeline/deriveTimelineState.js";
import { formatTimestamp } from "./formatTime.js";

export const CoverageNotice = ({ coverage }: { coverage: TimelineCoverage }) => {
    if (coverage.kind === "complete") {
        return null;
    }

    return (
        <Alert
            type={"info"}
            variant={"subtle"}
            icon={<HistoryToggleOffIcon />}
            className={"m-sm-extra"}
        >
            <Text size={"sm"}>
                {`History before ${formatTimestamp(
                    coverage.recordedFrom
                )} was not recorded. Activity began being captured at that point.`}
            </Text>
        </Alert>
    );
};
