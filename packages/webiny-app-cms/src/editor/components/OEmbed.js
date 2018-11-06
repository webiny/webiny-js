// @flow
import * as React from "react";
import { connect } from "react-redux";
import { css } from "emotion";
import { isEqual } from "lodash";
import { compose, withHandlers, shouldUpdate, lifecycle } from "recompose";
import { get } from "lodash";
import { set } from "dot-prop-immutable";
import gql from "graphql-tag";
import { graphql } from "react-apollo";
import { updateElement } from "webiny-app-cms/editor/actions";

function appendSDK(props) {
    const { sdk, global, element } = props;
    const { url } = element.data || {};

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
        document.body.appendChild(script);
    });
}

function initEmbed(props) {
    const { sdk, init, element } = props;
    if (sdk && element.data.url) {
        if (typeof init === "function") {
            init({
                props,
                node: document.getElementById("cms-embed-" + element.id)
            });
        }
    }
}

const oembedQuery = gql`
    query GetOEmbedData($url: String!, $width: Int, $height: Int) {
        cms {
            oembedData(url: $url, width: $width, height: $height) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

const centerAlign = css({ width: "100%", textAlign: "center" });

export default compose(
    shouldUpdate((props, nextProps) => {
        return !isEqual(props, nextProps);
    }),
    connect(
        null,
        { updateElement }
    ),
    graphql(oembedQuery, {
        skip: ({ element }) => {
            const source = get(element, "data.source") || {};
            const oembed = get(element, "data.oembed") || {};

            return !source.url || isEqual(oembed.source, source);
        },
        options: ({ element, updateElement }) => {
            const source = get(element, "data.source") || {};
            return {
                variables: source,
                onCompleted: data => {
                    // Store loaded oembed data
                    updateElement({
                        element: set(element, "data.oembed", get(data, "cms.oembedData.data"))
                    });
                }
            };
        }
    }),
    withHandlers({
        renderEmpty: () => () => {
            return <div>You must configure your embed in the settings!</div>;
        },
        renderEmbed: ({ renderEmbed, ...props }) => () => {
            if (typeof renderEmbed === "function") {
                return renderEmbed(props);
            }

            const { element, data } = props;

            if (data && data.loading) {
                return "Loading embed data...";
            }

            return (
                <div
                    id={"cms-embed-" + element.id}
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
        },
        componentDidUpdate() {
            initEmbed(this.props);
        }
    })
)(({ element, renderEmbed, renderEmpty }: Object) => {
    const { url } = get(element, "data.source") || {};

    return url ? renderEmbed() : renderEmpty();
});
