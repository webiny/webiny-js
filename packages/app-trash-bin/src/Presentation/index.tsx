import React, { useCallback, useMemo, useState } from "react";
import { AcoWithConfig } from "@webiny/app-aco";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinListGateway,
    ITrashBinRestoreItemGateway,
    ITrashBinBulkActionsGateway
} from "~/Gateways";
import { ITrashBinItemMapper, TrashBinItemDTO } from "~/Domain";
import { TrashBinRenderer } from "~/Presentation/TrashBinRenderer";
import { CompositionScope } from "@webiny/react-composition";
import { TrashBinListWithConfig } from "~/Presentation/configs";

export * from "~/Presentation/TrashBinConfigs";

export type TrashBinRenderPropParams = {
    showTrashBin: () => void;
};

interface TrashBinRenderProps {
    (params: TrashBinRenderPropParams): React.ReactNode;
}

export type TrashBinProps = {
    render: TrashBinRenderProps;
    bulkActionsGateway: ITrashBinBulkActionsGateway;
    listGateway: ITrashBinListGateway<any>;
    deleteGateway: ITrashBinDeleteItemGateway;
    restoreGateway: ITrashBinRestoreItemGateway<any>;
    itemMapper: ITrashBinItemMapper<any>;
    deleteBulkActionName: string;
    restoreBulkActionName: string;
    onClose?: () => void;
    onItemAfterRestore?: (item: TrashBinItemDTO) => Promise<void>;
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

    const onItemAfterRestore = useCallback(
        async (item: any) => {
            if (typeof rest.onItemAfterRestore === "function") {
                rest.onItemAfterRestore(item);
            }

            onClose();
        },
        [rest.onItemAfterRestore, onClose]
    );

    const retentionPeriod = useMemo(() => {
        // Default retention period if no valid environment variable is found
        const defaultRetentionPeriod = 90;

        // Retrieve the retention period from the environment variable
        const retentionPeriodFromEnv = process.env["WEBINY_ADMIN_TRASH_BIN_RETENTION_PERIOD_DAYS"];

        // Parse the environment variable value to an integer (or use default if not valid or not set)
        const parsedRetentionPeriod = retentionPeriodFromEnv
            ? parseInt(retentionPeriodFromEnv, 10)
            : defaultRetentionPeriod;

        // Return the parsed retention period if valid and not zero, otherwise return the default
        return isNaN(parsedRetentionPeriod) || parsedRetentionPeriod === 0
            ? defaultRetentionPeriod
            : parsedRetentionPeriod;
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
                                onItemAfterRestore={onItemAfterRestore}
                                retentionPeriod={retentionPeriod}
                            />
                        </TrashBinListWithConfig>
                    </AcoWithConfig>
                </CompositionScope>
            )}
            {render ? render({ showTrashBin }) : null}
        </>
    );
};
