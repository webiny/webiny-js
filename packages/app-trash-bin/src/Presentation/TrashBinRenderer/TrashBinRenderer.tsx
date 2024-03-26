import React, { useCallback } from "react";
import {
    CompositionScope,
    createDecorator,
    TrashBinRenderer as BaseTrashBinRenderer
} from "@webiny/app-admin";
import { AcoWithConfig, useAcoConfig } from "@webiny/app-aco";
import { TrashBinListWithConfig } from "~/Presentation/configs";
import { TrashBin } from "../TrashBin";
import { Sorting } from "@webiny/app-utils";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinItemMapper,
    ITrashBinListGateway
} from "@webiny/app-trash-bin-common";

interface TrashBinWrapperProps {
    listGateway: ITrashBinListGateway<any>;
    deleteGateway: ITrashBinDeleteItemGateway;
    itemMapper: ITrashBinItemMapper<any>;
    onClose: () => void;
    nameColumnId?: string;
}

const TrashBinWrapper = (props: TrashBinWrapperProps) => {
    const { table } = useAcoConfig();

    if (!table.sorting.length) {
        return null;
    }

    return <TrashBin {...props} sorting={table.sorting.map(sort => Sorting.create(sort))} />;
};

export const TrashBinRenderer = createDecorator(BaseTrashBinRenderer, () => {
    return function TrashBinRenderer(props) {
        const onClose = useCallback(() => {
            if (typeof props.onClose === "function") {
                props.onClose();
            }
        }, [props.onClose]);

        return (
            <CompositionScope name={"trash"}>
                <AcoWithConfig>
                    <TrashBinListWithConfig>
                        <TrashBinWrapper {...props} onClose={onClose} />
                    </TrashBinListWithConfig>
                </AcoWithConfig>
            </CompositionScope>
        );
    };
});
