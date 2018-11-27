// @flow
import * as React from "react";
import { css } from "emotion";
import { isEqual } from "lodash";
import { compose, withHandlers, shouldUpdate, lifecycle } from "recompose";
import { get } from "lodash";

function appendSDK(props) {
    const { element } = props;
    const { url } = get(element, "data.source") || {};

    if (!url || window["PinUtils"]) {
        return;
    }

    return new Promise(resolve => {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = encodeURI("https://assets.pinterest.com/js/pinit.js");
        script.setAttribute("async", "");
        script.setAttribute("charset", "utf-8");
        script.onload = resolve;
        document.body.appendChild(script);
    });
}

function initEmbed(props) {
    const { element } = props;
    const node = document.getElementById( element.id);
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

export default compose(
    shouldUpdate((props, nextProps) => {
        return !isEqual(props, nextProps);
    }),
    withHandlers({
        renderEmpty: () =>
            function renderEmpty() {
                return <div>You must configure your embed in the settings!</div>;
            },
        renderEmbed: ({ element }) =>
            function renderEmbed() {
                const data = get(element, "data.source");
                return (
                    <div
                        id={ element.id}
                        className={centerAlign}
                        dangerouslySetInnerHTML={{ __html: getHTML(data) }}
                    />
                );
            }
    }),
    lifecycle({
        async componentDidMount() {
            await appendSDK(this.props);
            initEmbed(this.props);
        },
        componentDidUpdate() {
            initEmbed(this.props);
        }
    })
)(({ element, renderEmbed, renderEmpty }: Object) => {
    const { url } = get(element, "data.source") || {};

    return url ? renderEmbed() : renderEmpty();
});
