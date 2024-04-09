import React, { useCallback, useState } from "react";
import { AcoWithConfig } from "@webiny/app-aco";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinListGateway,
    ITrashBinRestoreItemGateway
} from "~/Gateways";
import { ITrashBinItemMapper, TrashBinItemDTO } from "~/Domain";
import { TrashBinRenderer } from "~/Presentation/TrashBinRenderer";
import { TrashBinConfigs } from "~/Presentation/TrashBinConfigs";
import { CompositionScope } from "@webiny/react-composition";
import { TrashBinListWithConfig } from "~/Presentation/configs";

export type TrashBinRenderPropParams = {
    showTrashBin: () => void;
};

interface TrashBinRenderProps {
    (params: TrashBinRenderPropParams): React.ReactNode;
}

export type TrashBinProps = {
    render: TrashBinRenderProps;
    listGateway: ITrashBinListGateway<any>;
    deleteGateway: ITrashBinDeleteItemGateway;
    restoreGateway: ITrashBinRestoreItemGateway<any>;
    itemMapper: ITrashBinItemMapper<any>;
    onClose?: () => void;
    onItemRestore?: (item: TrashBinItemDTO) => Promise<void>;
    show?: boolean;
    nameColumnId?: string;
    title?: string;
};

export const TrashBin = ({ render, ...rest }: TrashBinProps) => {
    const [show, setShow] = useState(rest.show ?? false);

    const showTrashBin = useCallback(() => {
        setShow(true);
    }, []);

    const onClose = useCallback(() => {
        if (typeof rest.onClose === "function") {
            rest.onClose();
        }

        setShow(false);
    }, [rest.onClose]);

    const onItemRestore = useCallback(
        async (item: any) => {
            if (typeof rest.onItemRestore === "function") {
                rest.onItemRestore(item);
            }

            onClose();
        },
        [rest.onItemRestore, onClose]
    );

    return (
        <>
            {show && (
                <CompositionScope name={"trash"}>
                    <AcoWithConfig>
                        <TrashBinListWithConfig>
                            <TrashBinRenderer
                                {...rest}
                                onClose={onClose}
                                onItemRestore={onItemRestore}
                            />
                        </TrashBinListWithConfig>
                    </AcoWithConfig>
                    <TrashBinConfigs />
                </CompositionScope>
            )}
            {render ? render({ showTrashBin }) : null}
        </>
    );
};
