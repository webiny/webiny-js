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
    ITrashBinListGateway,
    ITrashBinRestoreItemGateway,
    TrashBinItemDTO
} from "@webiny/app-trash-bin-common";

interface TrashBinWrapperProps {
    listGateway: ITrashBinListGateway<any>;
    deleteGateway: ITrashBinDeleteItemGateway;
    restoreGateway: ITrashBinRestoreItemGateway<any>;
    itemMapper: ITrashBinItemMapper<any>;
    onClose: () => void;
    onItemRestore: (item: TrashBinItemDTO) => Promise<void>;
    title?: string;
    nameColumnId?: string;
}

const TrashBinWrapper = ({ title = "Trash Bin", ...props }: TrashBinWrapperProps) => {
    const { table } = useAcoConfig();

    if (!table.sorting.length) {
        return null;
    }

    return (
        <TrashBin
            {...props}
            title={title}
            sorting={table.sorting.map(sort => Sorting.create(sort))}
        />
    );
};

export const TrashBinRenderer = createDecorator(BaseTrashBinRenderer, () => {
    return function TrashBinRenderer(props) {
        const onClose = useCallback(() => {
            if (typeof props.onClose === "function") {
                props.onClose();
            }
        }, [props.onClose]);

        const onItemRestore = useCallback(
            async (item: any) => {
                if (typeof props.onItemRestore === "function") {
                    props.onItemRestore(item);
                }

                onClose();
            },
            [props.onItemRestore, onClose]
        );

        return (
            <CompositionScope name={"trash"}>
                <AcoWithConfig>
                    <TrashBinListWithConfig>
                        <TrashBinWrapper
                            {...props}
                            onClose={onClose}
                            onItemRestore={onItemRestore}
                        />
                    </TrashBinListWithConfig>
                </AcoWithConfig>
            </CompositionScope>
        );
    };
});
