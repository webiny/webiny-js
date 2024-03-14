import React, { useMemo } from "react";
import { BinButton, useBinRepository } from "@webiny/app-bin";
import { useApolloClient, useModel } from "~/admin/hooks";
import {
    BinDeleteEntryGraphQLGateway,
    BinListGraphQLGateway,
    BinEntryMapper
} from "~/admin/components/ContentEntries/Bin/adapters";

export const Bin = () => {
    const client = useApolloClient();
    const { model } = useModel();

    const repository = useMemo(() => {
        const listGateway = new BinListGraphQLGateway(client, model);
        const deleteEntryGateway = new BinDeleteEntryGraphQLGateway(client, model);
        const entryMapper = new BinEntryMapper();
        return useBinRepository(
            listGateway,
            deleteEntryGateway,
            entryMapper,
            `bin:${model.modelId}`
        );
    }, [client, model]);

    return <BinButton repository={repository} />;
};
