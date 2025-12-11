import React from "react";
import { Sorting } from "@webiny/app-utils";
import type { TrashBinItemDTO } from "~/Domain/index.js";
import type { TrashBinProps } from "~/Presentation/index.js";
import { TrashBin } from "../TrashBin/index.js";
import { useTrashBinListConfig } from "~/Presentation/configs/index.js";

export type TrashBinRendererProps = Omit<TrashBinProps, "render"> & {
    onClose: () => void;
    onItemAfterRestore: (item: TrashBinItemDTO) => void;
    retentionPeriod: number;
};

export const TrashBinRenderer = ({ title = "Trash Bin", ...props }: TrashBinRendererProps) => {
    const { browser } = useTrashBinListConfig();

    if (!browser.table.sorting.length) {
        return null;
    }

    return (
        <TrashBin
            {...props}
            title={title}
            sorting={browser.table.sorting.map(sort => Sorting.create(sort))}
        />
    );
};
