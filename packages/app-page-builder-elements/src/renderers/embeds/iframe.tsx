import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export interface IFrameElementData {
    iframe: {
        url: string;
    };
}

export const createIFrame = () =>
    createRenderer(() => {
        const { getElement } = useRenderer();

        const element = getElement<IFrameElementData>();

        return <iframe src={element.data.iframe.url} width="100%" height="100%" />;
    });
