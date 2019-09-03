// @flow
import React, { useCallback, useEffect } from "react";
import { css } from "emotion";
import { isEqual } from "lodash";
import { get } from "lodash";

function appendSDK(props) {
    const { element } = props;
    const { url } = get(element, "data.source") || {};

    if (!url || window["PinUtils"]) {
        return Promise.resolve();
    }

    return new Promise(resolve => {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = encodeURI("https://assets.pinterest.com/js/pinit.js");
        script.setAttribute("async", "");
        script.setAttribute("charset", "utf-8");
        script.onload = resolve;
        // $FlowFixMe
        document.body.appendChild(script);
    });
}

function initEmbed(props) {
    const { element } = props;
    const node = document.getElementById(element.id);
    if (node && window.PinUtils) {
        window.PinUtils.build();
    }
}

const centerAlign = css({
    textAlign: "center"
});

const getHTML = data => {
    return `<a
        data-pin-do="embedPin"
        data-pin-width="${data.size || "small"}"
        href="${data.url}"
    />`;
};

export default React.memo(
    props => {
        const { element } = props;

        useEffect(() => {
            appendSDK(props).then(() => initEmbed(props));
        }, [element]);

        const empty = <div>You must configure your embed in the settings!</div>;

        const renderEmbed = useCallback(() => {
            const data = get(element, "data.source");
            return (
                <div
                    id={element.id}
                    className={centerAlign}
                    dangerouslySetInnerHTML={{ __html: getHTML(data) }}
                />
            );
        }, [element]);

        const { url } = get(element, "data.source") || {};

        return url ? renderEmbed() : empty;
    },
    (props, nextProps) => isEqual(props, nextProps)
);
