import React from "react";
import { AuditLogsListConfig } from "~/config/list/index.js";
import {
    FilterByAction,
    FilterByApp,
    FilterByCreatedBy,
    FilterByCreatedOn,
    FilterByEntity,
    FilterByEntityId
} from "~/views/Logs/Filters/index.js";

const { Browser } = AuditLogsListConfig;

export const LogsModule = () => {
    return (
        <>
            <AuditLogsListConfig>
                <Browser.Filter name={"app"} element={<FilterByApp />} />
                <Browser.Filter name={"entity"} element={<FilterByEntity />} />
                <Browser.Filter name={"action"} element={<FilterByAction />} />
                <Browser.Filter name={"createdBy"} element={<FilterByCreatedBy />} />
                <Browser.Filter name={"entityId"} element={<FilterByEntityId />} />
                <Browser.Filter name={"createdOn"} element={<FilterByCreatedOn />} />
            </AuditLogsListConfig>
        </>
    );
};
