import React from "react";

import { AuditLogsListConfig } from "~/config/list";
import {
    FilterByTimestamp,
    FilterByInitiator,
    FilterByApp,
    FilterByEntity,
    FilterByAction
} from "~/views/Logs/Filters";

const { Browser } = AuditLogsListConfig;

export const LogsModule: React.FC = () => {
    return (
        <>
            <AuditLogsListConfig>
                <Browser.Filter name={"timestamp"} element={<FilterByTimestamp />} />
                <Browser.Filter name={"initiator"} element={<FilterByInitiator />} />
                <Browser.Filter name={"app"} element={<FilterByApp />} />
                <Browser.Filter name={"entity"} element={<FilterByEntity />} />
                <Browser.Filter name={"action"} element={<FilterByAction />} />
            </AuditLogsListConfig>
        </>
    );
};
