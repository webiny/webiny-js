import { useFeatureFlags } from "@webiny/app-admin";
import React from "react";
import { FileManagerViewConfig } from "~/index.js";
import { THREAT_SCAN } from "~/modules/Enterprise/constants.js";
import { ThreatScanInProgressFileBody } from "./components/ThreatScanInProgressFileBody.js";
import { ThreatScanInProgressTableCell } from "./components/ThreatScanInProgressTableCell.js";
import { HandleWebsocketMessages } from "./HandleWebsocketMessages.js";

const { Grid, Table } = FileManagerViewConfig.Browser;

const DisableFileWhileThreatScanInProgress = Grid.Item.createDecorator(Original => {
    return function Item(props) {
        if (props.file.tags.includes(THREAT_SCAN.IN_PROGRESS)) {
            return <Original {...props} fileBody={<ThreatScanInProgressFileBody />} />;
        }
        return <Original {...props} />;
    };
});

const DisableTableCellWhileThreatScanInProgress = Table.Column.createDecorator(Original => {
    return function TableCellActionsWhileThreatScanInProgress(props) {
        if (props.cell) {
            return (
                <Original
                    {...props}
                    cell={
                        <ThreatScanInProgressTableCell>{props.cell}</ThreatScanInProgressTableCell>
                    }
                />
            );
        }

        return <Original {...props} />;
    };
});

export const EnterpriseModule = () => {
    const featureFlags = useFeatureFlags();

    if (!featureFlags.isEnabled("fileManager.threatDetection")) {
        return null;
    }

    return (
        <>
            <DisableFileWhileThreatScanInProgress />
            <DisableTableCellWhileThreatScanInProgress />
            <FileManagerViewConfig>
                <HandleWebsocketMessages />
            </FileManagerViewConfig>
        </>
    );
};
