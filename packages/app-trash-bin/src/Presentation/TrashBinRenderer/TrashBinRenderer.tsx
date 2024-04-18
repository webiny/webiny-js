import React from "react";
import { useAcoConfig } from "@webiny/app-aco";
import { Sorting } from "@webiny/app-utils";
import { TrashBinItemDTO } from "~/Domain";
import { TrashBinProps } from "~/Presentation";
import { TrashBin } from "../TrashBin";

export type TrashBinRendererProps = Omit<TrashBinProps, "render"> & {
    onClose: () => void;
    onNavigateAfterRestoreItem: (item: TrashBinItemDTO) => void;
};

export const TrashBinRenderer = ({ title = "Trash Bin", ...props }: TrashBinRendererProps) => {
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
