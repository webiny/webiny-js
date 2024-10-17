import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { EmptyElement } from "~/renderers/components";

export interface IFrameElementData {
    iframe: {
        url: string;
    };
}

export const createIFrame = () =>
    createRenderer(() => {
        const { getElement } = useRenderer();

        const element = getElement<IFrameElementData>();
        const url = element.data.iframe.url;

        if (!url) {
            return <EmptyElement message="Please provide a link for this iframe element." />;
        }

        return <iframe src={url} width="100%" height="100%" />;
    });
