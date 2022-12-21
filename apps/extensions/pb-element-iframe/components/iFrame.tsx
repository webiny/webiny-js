import React from "react";
import { createRenderer, useRenderer } from "@webiny/app-page-builder-elements";

export const IFrame = createRenderer(() => {
    const { getElement, getAttributes } = useRenderer();

    const element = getElement();
    const attributes = getAttributes();

    // If the user didn't enter a URL, let's show a simple message.
    if (!element.data.iframe.url) {
        return <div {...attributes}>IFrame URL is missing.</div>;
    }

    return (
        <div {...attributes}>
            <iframe src={element.data.iframe.url} width="100%" height="100%" />
        </div>
    );
});
