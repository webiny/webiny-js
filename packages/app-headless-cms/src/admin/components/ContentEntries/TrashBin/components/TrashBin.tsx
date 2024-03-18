import React, { useMemo } from "react";
import { ButtonDefault } from "@webiny/ui/Button";
import { useTrashBinRepository } from "@webiny/app-trash-bin-common";
import { useApolloClient, useModel } from "~/admin/hooks";
import {
    TrashBinDeleteEntryGraphQLGateway,
    TrashBinListGraphQLGateway,
    TrashBinEntryMapper
} from "../adapters";

import { TrashBin as BaseTrashBin } from "@webiny/app-admin";

export const TrashBin = () => {
    const client = useApolloClient();
    const { model } = useModel();

    const repository = useMemo(() => {
        const listGateway = new TrashBinListGraphQLGateway(client, model);
        const deleteEntryGateway = new TrashBinDeleteEntryGraphQLGateway(client, model);
        const entryMapper = new TrashBinEntryMapper();
        return useTrashBinRepository(
            listGateway,
            deleteEntryGateway,
            entryMapper,
            `trash-bin:${model.modelId}`
        );
    }, [client, model]);

    return (
        <BaseTrashBin
            repository={repository}
            render={({ showTrashBin }) => {
                return <ButtonDefault onClick={showTrashBin}>{"Open trash bin"}</ButtonDefault>;
            }}
        />
    );
};
