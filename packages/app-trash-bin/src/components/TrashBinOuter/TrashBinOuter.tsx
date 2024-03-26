import React from "react";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinItemMapper,
    ITrashBinListGateway
} from "@webiny/app-trash-bin-common";
import { useAcoConfig } from "@webiny/app-aco";
import { Sorting } from "@webiny/app-utils";
import { TrashBin } from "~/components/TrashBin";

export interface TrashBinOuterProps {
    listGateway: ITrashBinListGateway<any>;
    deleteGateway: ITrashBinDeleteItemGateway;
    itemMapper: ITrashBinItemMapper<any>;
    onClose: () => void;
}

export const TrashBinOuter = (props: TrashBinOuterProps) => {
    const { table } = useAcoConfig();

    if (!table.sorting.length) {
        return null;
    }

    return <TrashBin {...props} sorting={table.sorting.map(sort => Sorting.create(sort))} />;
};
