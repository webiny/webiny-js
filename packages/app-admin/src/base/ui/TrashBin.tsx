import React, { useCallback, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { createVoidComponent, makeDecoratable } from "@webiny/react-composition";
import {
    ITrashBinDeleteItemGateway,
    ITrashBinItemMapper,
    ITrashBinListGateway,
    ITrashBinRestoreItemGateway,
    TrashBinItemDTO
} from "@webiny/app-trash-bin-common";

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

function getPortalTarget() {
    let target = window.document.getElementById("trash-bin-container");
    if (!target) {
        target = document.createElement("div");
        target.setAttribute("id", "trash-bin-container");
        document.body && document.body.appendChild(target);
    }
    return target;
}

// This jewel was taken from https://davidgomes.com/pick-omit-over-union-types-in-typescript/. Massive thanks, David!
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

export type TrashBinRendererProps = DistributiveOmit<TrashBinProps, "render">;

export const TrashBinRenderer = makeDecoratable(
    "TrashBinRenderer",
    createVoidComponent<TrashBinRendererProps>()
);

export const TrashBin = ({ render, ...rest }: TrashBinProps) => {
    const containerRef = useRef<HTMLElement>(getPortalTarget());
    const [show, setShow] = useState(rest.show ?? false);

    const showTrashBin = useCallback(() => {
        setShow(true);
    }, []);

    return (
        <>
            {show &&
                ReactDOM.createPortal(
                    <TrashBinRenderer onClose={() => setShow(false)} {...rest} />,
                    containerRef.current
                )}
            {render ? render({ showTrashBin }) : null}
        </>
    );
};
