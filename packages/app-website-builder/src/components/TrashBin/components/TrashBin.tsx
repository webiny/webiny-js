import React, { useCallback, useMemo } from "react";
import { TrashBin as BaseTrashBin } from "@webiny/app-trash-bin";
import {
    TrashBinBulkActionsGraphQLGateway,
    TrashBinDeletePageGraphQLGateway,
    TrashBinItemMapper,
    TrashBinListPagesGraphQLGateway,
    TrashBinRestorePageGraphQLGateway,
    usePageFields
} from "../adapters/index.js";
import { TrashBinButton } from "./TrashBinButton.js";
import { useNavigateFolder } from "@webiny/app-aco";
import { useApolloClient } from "@apollo/react-hooks";
import { usePermissions } from "~/presentation/security/usePermissions.js";

export const TrashBin = () => {
    const client = useApolloClient();
    const { canDelete } = usePermissions();
    const { navigateToFolder } = useNavigateFolder();

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
            client
        });
    }, [client, pageFields]);

    const restoreGateway = useMemo(() => {
        return new TrashBinRestorePageGraphQLGateway({
            client,
            fields: pageFields
        });
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
