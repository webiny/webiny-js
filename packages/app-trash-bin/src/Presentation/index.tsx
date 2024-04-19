import React, { useCallback, useMemo, useState } from "react";
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
    onNavigateAfterRestoreItem?: (item: TrashBinItemDTO) => Promise<void>;
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

    const onNavigateAfterRestoreItem = useCallback(
        async (item: any) => {
            if (typeof rest.onNavigateAfterRestoreItem === "function") {
                rest.onNavigateAfterRestoreItem(item);
            }

            onClose();
        },
        [rest.onNavigateAfterRestoreItem, onClose]
    );

    const retentionPeriod = useMemo(() => {
        // Retrieve the retention period from the environment variable WEBINY_ADMIN_TRASH_BIN_RETENTION_PERIOD_DAYS,
        // or default to 90 days if not set or set to 0.
        const retentionPeriodFromEnv = process.env["WEBINY_ADMIN_TRASH_BIN_RETENTION_PERIOD_DAYS"];
        return retentionPeriodFromEnv && Number(retentionPeriodFromEnv) !== 0
            ? Number(retentionPeriodFromEnv)
            : 90;
    }, []);

    return (
        <>
            {show && (
                <CompositionScope name={"trash"}>
                    <AcoWithConfig>
                        <TrashBinListWithConfig>
                            <TrashBinRenderer
                                {...rest}
                                onClose={onClose}
                                onNavigateAfterRestoreItem={onNavigateAfterRestoreItem}
                                retentionPeriod={retentionPeriod}
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
