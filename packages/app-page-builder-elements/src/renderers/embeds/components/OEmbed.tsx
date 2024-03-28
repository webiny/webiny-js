import React, { useEffect, useCallback } from "react";
import styled from "@emotion/styled";

import { EmptyElement } from "~/renderers/components";
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
    // @ts-expect-error Figure out better type for global.
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

const CenterAlign = styled.div({
    "*:first-of-type": {
        marginLeft: "auto !important",
        marginRight: "auto !important"
    }
});

export const OEmbed = (props: OEmbedProps) => {
    const { element, renderEmbed } = props;
    const { url } = element?.data?.source || {};

    const renderer = useCallback((): React.ReactElement => {
        if (typeof renderEmbed === "function") {
            return renderEmbed(props);
        }

        return (
            <CenterAlign
                id={element.id}
                dangerouslySetInnerHTML={{ __html: element?.data?.oembed?.html || "" }}
            />
        );
    }, [element, renderEmbed]);

    useEffect(() => {
        appendSDK(props).then(() => initEmbed(props));
    });

    if (!url) {
        return <EmptyElement message="Please provide a link for this embed element." />;
    }

    return renderer();
};
