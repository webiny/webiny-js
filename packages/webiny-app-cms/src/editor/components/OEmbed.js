// @flow
import * as React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { css } from "emotion";
import { isEqual } from "lodash";
import { compose, withHandlers, shouldUpdate, lifecycle } from "recompose";
import { get } from "lodash";
import { set } from "dot-prop-immutable";
import gql from "graphql-tag";
import { graphql } from "react-apollo";
import { updateElement } from "webiny-app-cms/editor/actions";
import { withSnackbar } from "webiny-admin/components";

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

const oembedQuery = gql`
    query GetOEmbedData($url: String!, $width: String, $height: String) {
        cms {
            pageBuilder {
                oembedData(url: $url, width: $width, height: $height) {
                    data
                    error {
                        code
                        message
                    }
                }
            }
        }
    }
`;

const centerAlign = css({
    "*:first-child": {
        marginLeft: "auto !important",
        marginRight: "auto !important"
    }
});

export default compose(
    shouldUpdate((props, nextProps) => {
        return !isEqual(props, nextProps);
    }),
    connect(
        null,
        { updateElement }
    ),
    withSnackbar(),
    graphql(oembedQuery, {
        skip: ({ element }) => {
            const source = get(element, "data.source") || {};
            const oembed = get(element, "data.oembed") || {};

            return !source.url || isEqual(oembed.source, source);
        },
        options: ({ element, updateElement, showSnackbar, onData = d => d }) => {
            const source = get(element, "data.source") || {};
            return {
                variables: source,
                onCompleted: data => {
                    const { data: oembed, error } = get(data, "cms.pageBuilder.oembedData");
                    if (oembed) {
                        // Store loaded oembed data
                        updateElement({
                            element: set(element, "data.oembed", onData(oembed))
                        });
                    }
                    if (error) {
                        showSnackbar(error.message);
                    }
                }
            };
        }
    }),
    withHandlers({
        renderEmpty: () =>
            function renderEmpty() {
                return <div>You must configure your embed in the settings!</div>;
            },
        renderEmbed: ({ renderEmbed, ...props }) =>
            function embedRenderer() {
                if (typeof renderEmbed === "function") {
                    return renderEmbed(props);
                }

                const { element, data } = props;

                if (data && data.loading) {
                    return "Loading embed data...";
                }

                return (
                    <div
                        id={element.id}
                        className={
                            centerAlign +
                            " cms-editor-dragging--disabled cms-editor-resizing--disabled"
                        }
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
        async componentDidUpdate() {
            await appendSDK(this.props);
            initEmbed(this.props);
        }
    })
)(({ element, renderEmbed, renderEmpty }: Object) => {
    const { url } = get(element, "data.source") || {};

    return url ? renderEmbed() : renderEmpty();
});
