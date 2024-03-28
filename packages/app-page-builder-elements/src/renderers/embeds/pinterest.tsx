import React, { useEffect } from "react";
import { Element, Renderer } from "~/types";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { EmptyElement } from "~/renderers/components";

declare global {
    interface Window {
        PinUtils: any;
    }
}

function appendSDK(element: Element): Promise<void> {
    const { url } = element?.data?.source || {};

    if (!url || window["PinUtils"]) {
        return Promise.resolve();
    }

    return new Promise(resolve => {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = encodeURI("https://assets.pinterest.com/js/pinit.js");
        script.setAttribute("async", "");
        script.setAttribute("charset", "utf-8");
        script.onload = () => {
            return resolve();
        };
        document.body.appendChild(script);
    });
}

function initEmbed(element: Element): void {
    const node = document.getElementById(element.id);
    if (node && window.PinUtils) {
        window.PinUtils.build();
    }
}

export type PinterestComponent = Renderer;

const Pinterest: PinterestComponent = ({ element }) => {
    const { url } = element?.data?.source || {};

    useEffect(() => {
        appendSDK(element).then(() => initEmbed(element));
    }, []);

    if (url) {
        const data = element?.data?.source || {};
        return <a data-pin-do="embedPin" data-pin-width={data.size || "small"} href={data.url} />;
    }

    return <EmptyElement message="Please provide a link for this embed element." />;
};

export const createPinterest = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();

        return <Pinterest element={getElement()} />;
    });
};
