import React from "react";
import { createRenderer, useRenderer } from "@webiny/app-page-builder-elements";

export interface IFrameElementData {
    iframe: {
        url: string;
    };
}

export const IFrame = createRenderer(() => {
    const { getElement } = useRenderer();

    const element = getElement<IFrameElementData>();

    return <iframe src={element.data.iframe.url} width="100%" height="100%" />;
});
