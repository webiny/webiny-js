import React, { useCallback } from "react";
import { createDecorator, TrashBinRenderer as BaseTrashBinRenderer } from "@webiny/app-admin";
import { TrashBin } from "~/components/TrashBin";

export const TrashBinRenderer = createDecorator(BaseTrashBinRenderer, () => {
    return function TrashBinRenderer(props) {
        const onClose = useCallback(() => {
            if (typeof props.onClose === "function") {
                props.onClose();
            }
        }, [props.onClose]);

        return <TrashBin repository={props.repository} onClose={onClose} />;
    };
});
