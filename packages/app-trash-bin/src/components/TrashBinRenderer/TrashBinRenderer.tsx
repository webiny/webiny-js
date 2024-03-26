import React, { useCallback } from "react";
import {
    CompositionScope,
    createDecorator,
    TrashBinRenderer as BaseTrashBinRenderer
} from "@webiny/app-admin";
import { AcoWithConfig } from "@webiny/app-aco";
import { TrashBinListWithConfig } from "~/configs";
import { TrashBinOuter } from "~/components/TrashBinOuter";

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
                        <TrashBinOuter {...props} onClose={onClose} />
                    </TrashBinListWithConfig>
                </AcoWithConfig>
            </CompositionScope>
        );
    };
});
