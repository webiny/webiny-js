// @flow
import * as React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { css } from "emotion";
import { isEqual } from "lodash";
import { get } from "lodash";
import { set } from "dot-prop-immutable";
import gql from "graphql-tag";
import { useQuery } from "react-apollo";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { useSnackbar } from "@webiny/app-admin/components";

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

const oembedQuery = gql`
    query GetOEmbedData($url: String!, $width: String, $height: String) {
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
`;

const centerAlign = css({
    "*:first-child": {
        marginLeft: "auto !important",
        marginRight: "auto !important"
    }
});

const OEmbed = React.memo((props: Object) => {
    const { showSnackbar } = useSnackbar();
    const { element, updateElement, onData = d => d } = props;

    React.useEffect(() => {
        appendSDK(props).then(() => initEmbed(props));
    });

    const source = get(element, "data.source") || {};
    const oembed = get(element, "data.oembed") || {};
    const skip = !source.url || isEqual(oembed.source, source);

    const { loading } = useQuery(oembedQuery, {
        skip,
        variables: source,
        onCompleted: data => {
            const { data: oembed, error } = get(data, "pageBuilder.oembedData");
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
    });

    const renderEmpty = React.useCallback(
        () => <div>You must configure your embed in the settings!</div>,
        []
    );

    const renderEmbed = React.useCallback(() => {
        if (typeof props.renderEmbed === "function") {
            return props.renderEmbed(props);
        }

        if (loading) {
            return "Loading embed data...";
        }

        return (
            <div
                id={element.id}
                className={
                    centerAlign + " pb-editor-dragging--disabled pb-editor-resizing--disabled"
                }
                dangerouslySetInnerHTML={{ __html: get(element, "data.oembed.html") || "" }}
            />
        );
    }, [element, loading]);

    const { url } = get(element, "data.source") || {};

    return url ? renderEmbed() : renderEmpty();
});

export default connect(
    null,
    { updateElement }
)(OEmbed);
