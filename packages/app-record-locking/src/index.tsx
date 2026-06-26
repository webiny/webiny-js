import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { useWcp } from "@webiny/app-admin";
import { RecordLockingFeature } from "~/features/feature.js";
import { RecordLockingPermissionsFeature } from "~/features/permissions/feature.js";
import { RecordLockingPresenterFeature } from "~/presentation/entryLocking/feature.js";
import { ListLockRecordsPresenterFeature } from "~/presentation/listLocking/feature.js";
import { SecurityPermissions } from "~/SecurityPermissions.js";
import { RecordLockingModule } from "~/RecordLockingModule.js";

export const RecordLocking = () => {
    const wcp = useWcp();

    if (!wcp.canUseRecordLocking()) {
        return null;
    }

    return (
        <>
            <RegisterFeature feature={RecordLockingPermissionsFeature} />
            <RegisterFeature feature={RecordLockingFeature} />
            <RegisterFeature feature={RecordLockingPresenterFeature} />
            <RegisterFeature feature={ListLockRecordsPresenterFeature} />
            <SecurityPermissions />
            <RecordLockingModule />
        </>
    );
};
