import React, { useMemo } from "react";
import { useApolloClient, useModel, usePermission } from "~/admin/hooks";
import { TrashBin as BaseTrashBin } from "@webiny/app-trash-bin";
import {
    TrashBinDeleteItemGraphQLGateway,
    TrashBinListGraphQLGateway,
    TrashBinRestoreItemGraphQLGateway,
    TrashBinItemMapper
} from "../adapters";

import { TrashBinButton } from "./TrashBinButton";
import { useNavigateFolder } from "@webiny/app-aco";

export const TrashBin = () => {
    const client = useApolloClient();
    const { canDeleteEntries } = usePermission();
    const { navigateToFolder } = useNavigateFolder();
    const { model } = useModel();

    const listGateway = useMemo(() => {
        return new TrashBinListGraphQLGateway(client, model);
    }, [client, model]);

    const deleteGateway = useMemo(() => {
        return new TrashBinDeleteItemGraphQLGateway(client, model);
    }, [client, model]);

    const restoreGateway = useMemo(() => {
        return new TrashBinRestoreItemGraphQLGateway(client, model);
    }, [client, model]);

    const itemMapper = useMemo(() => {
        return new TrashBinItemMapper();
    }, []);

    if (!canDeleteEntries("cms.contentEntry")) {
        return null;
    }

    return (
        <BaseTrashBin
            render={({ showTrashBin }) => {
                return <TrashBinButton onClick={showTrashBin} />;
            }}
            listGateway={listGateway}
            deleteGateway={deleteGateway}
            restoreGateway={restoreGateway}
            itemMapper={itemMapper}
            onItemRestore={async item => navigateToFolder(item.location.folderId)}
            nameColumnId={model.titleFieldId || "id"}
            title={`Trash - ${model.name}`}
        />
    );
};
