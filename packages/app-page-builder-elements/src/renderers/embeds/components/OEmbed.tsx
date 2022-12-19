import React, { useEffect, useCallback } from "react";
import { css } from "emotion";
import { Element } from "~/types";

export interface OEmbedPropsInitCallableParams {
    props: OEmbedProps;
    node: HTMLElement;
}

export interface OEmbedProps {
    element: Element;
    renderEmbed?: (props: OEmbedProps) => React.ReactElement;
    global?: string;
    sdk?: string;
    init?: (params: OEmbedPropsInitCallableParams) => void;
}

function appendSDK(props: OEmbedProps): Promise<void> {
    const { sdk, global, element } = props;
    const { url } = element?.data?.source || {};
    // @ts-ignore Figure out better type for global.
    if (!sdk || !url || window[global]) {
        return Promise.resolve();
    }

    return new Promise((resolve: () => void) => {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = encodeURI(sdk);
        script.setAttribute("async", "");
        script.setAttribute("charset", "utf-8");
        script.onload = () => {
            resolve();
        };
        document.body.appendChild(script);
    });
}

function initEmbed(props: OEmbedProps): void {
    const { sdk, init, element } = props;
    if (sdk && element?.data?.source?.url) {
        const node = document.getElementById(element.id);
        if (typeof init === "function" && node) {
            init({ props, node });
        }
    }
}

const centerAlign = css({
    "*:first-of-type": {
        marginLeft: "auto !important",
        marginRight: "auto !important"
    }
});

export const OEmbed: React.FC<OEmbedProps> = props => {
    const { element, renderEmbed } = props;
    const { url } = element?.data?.source || {};

    const renderer = useCallback((): React.ReactElement => {
        if (typeof renderEmbed === "function") {
            return renderEmbed(props);
        }

        return (
            <div
                id={element.id}
                className={centerAlign}
                dangerouslySetInnerHTML={{ __html: element?.data?.oembed?.html || "" }}
            />
        );
    }, [element, renderEmbed]);

    useEffect(() => {
        appendSDK(props).then(() => initEmbed(props));
    });

    return url ? renderer() : null;
};
