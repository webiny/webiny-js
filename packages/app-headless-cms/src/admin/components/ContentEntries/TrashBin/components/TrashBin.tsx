import React, { useMemo, useCallback } from "react";
import { useApolloClient, useModel, usePermission } from "~/admin/hooks";
import { TrashBin as BaseTrashBin } from "@webiny/app-trash-bin";
import {
    TrashBinBulkActionsGraphQLGateway,
    TrashBinDeleteItemGraphQLGateway,
    TrashBinItemMapper,
    TrashBinListGraphQLGateway,
    TrashBinRestoreItemGraphQLGateway,
    TrashBinRestoreItemGraphQLGatewayWithCallback
} from "../adapters";

import { TrashBinButton } from "./TrashBinButton";
import { useNavigateFolder, useRecords } from "@webiny/app-aco";

export const TrashBin = () => {
    const client = useApolloClient();
    const { canDeleteEntries } = usePermission();
    const { navigateToFolder } = useNavigateFolder();
    const { getRecord } = useRecords();
    const { model } = useModel();

    const listGateway = useMemo(() => {
        return new TrashBinListGraphQLGateway(client, model);
    }, [client, model]);

    const deleteGateway = useMemo(() => {
        return new TrashBinDeleteItemGraphQLGateway(client, model);
    }, [client, model]);

    const restoreGateway = useMemo(() => {
        const restoreGateway = new TrashBinRestoreItemGraphQLGateway(client, model);
        return new TrashBinRestoreItemGraphQLGatewayWithCallback(getRecord, restoreGateway);
    }, [client, model]);

    const bulkActionsGateway = useMemo(() => {
        return new TrashBinBulkActionsGraphQLGateway(client, model);
    }, [client, model]);

    const itemMapper = useMemo(() => {
        return new TrashBinItemMapper();
    }, []);

    const handleItemAfterRestore = useCallback(
        async (item: { location: { folderId: string | undefined } }) => {
            navigateToFolder(item.location.folderId);
        },
        [navigateToFolder]
    );

    if (!canDeleteEntries("cms.contentEntry")) {
        return null;
    }

    return (
        <BaseTrashBin
            render={({ showTrashBin }) => {
                return <TrashBinButton onClick={showTrashBin} />;
            }}
            bulkActionsGateway={bulkActionsGateway}
            deleteBulkActionName={"delete"}
            restoreBulkActionName={"restore"}
            listGateway={listGateway}
            deleteGateway={deleteGateway}
            restoreGateway={restoreGateway}
            itemMapper={itemMapper}
            onItemAfterRestore={handleItemAfterRestore}
            nameColumnId={model.titleFieldId || "id"}
            title={`Trash - ${model.name}`}
        />
    );
};
