import React, { useCallback, useMemo } from "react";
import { TrashBin as BaseTrashBin } from "@webiny/app-trash-bin";
import {
    TrashBinBulkActionsGraphQLGateway,
    TrashBinDeletePageGraphQLGateway,
    TrashBinItemMapper,
    TrashBinListPagesGraphQLGateway,
    TrashBinRestorePageGraphQLGateway,
    TrashBinRestorePageGraphQLGatewayWithCallback,
    usePageFields
} from "../adapters/index.js";
import { TrashBinButton } from "./TrashBinButton.js";
import { useNavigateFolder, useRecords } from "@webiny/app-aco";
import { useApolloClient } from "@apollo/react-hooks";
import { usePermissions } from "~/presentation/security/usePermissions.js";

export const TrashBin = () => {
    const client = useApolloClient();
    const { canDelete } = usePermissions();
    const { navigateToFolder } = useNavigateFolder();
    const { getRecord } = useRecords();

    const pageFields = usePageFields();

    const bulkActionsGateway = useMemo(() => {
        return new TrashBinBulkActionsGraphQLGateway({
            client,
            fields: pageFields
        });
    }, [client, pageFields]);

    const listGateway = useMemo(() => {
        return new TrashBinListPagesGraphQLGateway({
            client,
            fields: pageFields
        });
    }, [client, pageFields]);

    const deleteGateway = useMemo(() => {
        return new TrashBinDeletePageGraphQLGateway({
            client,
            fields: pageFields
        });
    }, [client, pageFields]);

    const restoreGateway = useMemo(() => {
        const restoreGateway = new TrashBinRestorePageGraphQLGateway({
            client,
            fields: pageFields
        });
        return new TrashBinRestorePageGraphQLGatewayWithCallback(getRecord, restoreGateway);
    }, [client, pageFields]);

    const itemMapper = useMemo(() => {
        return new TrashBinItemMapper();
    }, []);

    const handleItemAfterRestore = useCallback(
        async (item: { location: { folderId: string | undefined } }) => {
            navigateToFolder(item.location.folderId);
        },
        [navigateToFolder]
    );

    if (!canDelete("page")) {
        return null;
    }

    return (
        <BaseTrashBin
            render={({ showTrashBin }) => {
                return <TrashBinButton onClick={showTrashBin} />;
            }}
            bulkActionsGateway={bulkActionsGateway}
            deleteBulkActionName={"Delete"}
            restoreBulkActionName={"Restore"}
            listGateway={listGateway}
            deleteGateway={deleteGateway}
            restoreGateway={restoreGateway}
            itemMapper={itemMapper}
            onItemAfterRestore={handleItemAfterRestore}
            nameColumnId={"properties.title"}
            title={`Trash - Pages`}
        />
    );
};
