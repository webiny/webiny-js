import React from "react";
import { TrashBinConfigs } from "~/components/TrashBinConfigs";
import { TrashBinRenderer } from "~/components/TrashBinRenderer";

export const TrashBin = () => {
    return (
        <>
            <TrashBinRenderer />
            <TrashBinConfigs />
        </>
    );
};
