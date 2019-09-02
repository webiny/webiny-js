// @flow
import React, { useEffect, useCallback } from "react";
import { css } from "emotion";
import { get } from "lodash";

function appendSDK(props) {
    const { sdk, global, element } = props;
    const { url } = get(element, "data.source") || {};

    if (!sdk || !url || window[global]) {
        return Promise.resolve();
    }

    return new Promise(resolve => {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = encodeURI(sdk);
        script.setAttribute("async", "");
        script.setAttribute("charset", "utf-8");
        script.onload = resolve;
        // $FlowFixMe
        document.body.appendChild(script);
    });
}

function initEmbed(props) {
    const { sdk, init, element } = props;
    if (sdk && get(element, "data.source.url")) {
        const node = document.getElementById(element.id);
        if (typeof init === "function" && node) {
            init({ props, node });
        }
    }
}

const centerAlign = css({
    "*:first-child": {
        marginLeft: "auto !important",
        marginRight: "auto !important"
    }
});

export default (props: Object) => {
    const { element, renderEmbed } = props;
    const { url } = get(element, "data.source") || {};

    const renderer = useCallback(() => {
        if (typeof renderEmbed === "function") {
            return renderEmbed(props);
        }

        return (
            <div
                id={element.id}
                className={centerAlign}
                dangerouslySetInnerHTML={{ __html: get(element, "data.oembed.html") || "" }}
            />
        );
    }, [element, renderEmbed]);

    useEffect(() => {
        appendSDK(props).then(() => initEmbed(props));
    });

    return url ? renderer() : null;
};
