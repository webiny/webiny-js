// @flow
import * as React from "react";
import { connect } from "react-redux";
import { css } from "emotion";
import { compose, withHandlers, lifecycle } from "recompose";
import { get } from "lodash";
import { set } from "dot-prop-immutable";

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

export default compose(
    withHandlers({
        renderEmbed: ({ element }) => () => {
            const data = get(element, "data.source");
            return (
                <div id={ element.id} className={centerAlign}>
                    <a
                        data-pin-do="embedPin"
                        data-pin-width={data.size || "small"}
                        href={data.url}
                    />
                </div>
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
