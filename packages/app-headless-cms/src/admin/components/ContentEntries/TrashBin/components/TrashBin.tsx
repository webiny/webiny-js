import React, { useMemo } from "react";
import { ButtonDefault } from "@webiny/ui/Button";
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

    const listGateway = useMemo(() => {
        return new TrashBinListGraphQLGateway(client, model);
    }, [client, model]);

    const deleteGateway = useMemo(() => {
        return new TrashBinDeleteEntryGraphQLGateway(client, model);
    }, [client, model]);

    const entryMapper = useMemo(() => {
        return new TrashBinEntryMapper();
    }, []);

    return (
        <BaseTrashBin
            render={({ showTrashBin }) => {
                return <ButtonDefault onClick={showTrashBin}>{"Open trash bin"}</ButtonDefault>;
            }}
            listGateway={listGateway}
            deleteGateway={deleteGateway}
            entryMapper={entryMapper}
        />
    );
};
