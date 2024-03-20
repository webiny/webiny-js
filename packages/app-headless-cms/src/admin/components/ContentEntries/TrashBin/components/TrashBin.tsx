import React, { useMemo } from "react";
import { ButtonDefault } from "@webiny/ui/Button";
import { useApolloClient, useModel } from "~/admin/hooks";
import {
    TrashBinDeleteItemGraphQLGateway,
    TrashBinListGraphQLGateway,
    TrashBinItemMapper
} from "../adapters";

import { TrashBin as BaseTrashBin } from "@webiny/app-admin";

export const TrashBin = () => {
    const client = useApolloClient();
    const { model } = useModel();

    const listGateway = useMemo(() => {
        return new TrashBinListGraphQLGateway(client, model);
    }, [client, model]);

    const deleteGateway = useMemo(() => {
        return new TrashBinDeleteItemGraphQLGateway(client, model);
    }, [client, model]);

    const itemMapper = useMemo(() => {
        return new TrashBinItemMapper();
    }, []);

    return (
        <BaseTrashBin
            render={({ showTrashBin }) => {
                return <ButtonDefault onClick={showTrashBin}>{"Open trash bin"}</ButtonDefault>;
            }}
            listGateway={listGateway}
            deleteGateway={deleteGateway}
            itemMapper={itemMapper}
        />
    );
};
