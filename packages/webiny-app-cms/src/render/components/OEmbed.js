// @flow
import * as React from "react";
import { css } from "emotion";
import { compose, withHandlers, lifecycle } from "recompose";
import { get } from "lodash";

function appendSDK(props) {
    const { sdk, global, element } = props;
    const { url } = get(element, "data.source") || {};

    if (!sdk || !url || window[global]) {
        return;
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

export default compose(
    withHandlers({
        renderEmbed: ({ renderEmbed, ...props }: Object) => () => {
            if (typeof renderEmbed === "function") {
                return renderEmbed(props);
            }

            const { element } = props;

            return (
                <div
                    id={element.id}
                    className={centerAlign}
                    dangerouslySetInnerHTML={{ __html: get(element, "data.oembed.html") || "" }}
                />
            );
        }
    }),
    lifecycle({
        async componentDidMount() {
            await appendSDK(this.props);
            initEmbed(this.props);
        }
    })
)(({ element, renderEmbed }: Object) => {
    const { url } = get(element, "data.source") || {};

    return url ? renderEmbed() : null;
});
