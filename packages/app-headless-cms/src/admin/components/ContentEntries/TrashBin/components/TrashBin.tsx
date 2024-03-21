import React, { useMemo } from "react";
import { useApolloClient, useModel } from "~/admin/hooks";
import { TrashBin as BaseTrashBin } from "@webiny/app-admin";
import {
    TrashBinDeleteItemGraphQLGateway,
    TrashBinListGraphQLGateway,
    TrashBinItemMapper
} from "../adapters";

import { TrashBinButton } from "./TrashBinButton";

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
                return <TrashBinButton onClick={showTrashBin} />;
            }}
            listGateway={listGateway}
            deleteGateway={deleteGateway}
            itemMapper={itemMapper}
        />
    );
};
