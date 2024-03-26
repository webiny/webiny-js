import React from "react";
import { TrashBinConfigs } from "./TrashBinConfigs";
import { TrashBinRenderer } from "./TrashBinRenderer";

export const TrashBin = () => {
    return (
        <>
            <TrashBinRenderer />
            <TrashBinConfigs />
        </>
    );
};
