import { updateElementRecoil } from "@webiny/app-page-builder/editor/recoil/actions/updateElement";
import React, { useCallback, useEffect } from "react";
import { css } from "emotion";
import gql from "graphql-tag";
import { useQuery } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { PbElement } from "@webiny/app-page-builder/types";
import { ReactElement } from "react";

function appendSDK(props) {
    const { sdk, global, element } = props;
    const { url } = element?.data?.source || {};

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
        document.body.appendChild(script);
    });
}

function initEmbed(props) {
    const { sdk, init, element } = props;
    if (sdk && element?.data?.source?.url) {
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
    "*:first-of-type": {
        marginLeft: "auto !important",
        marginRight: "auto !important"
    }
});

export type OEmbedProps = {
    element: PbElement;
    // updateElement: PbUpdateElement;
    onData?: (data: { [key: string]: any }) => { [key: string]: any };
    renderEmbed?: (props: OEmbedProps) => ReactElement;
    data?: any;
};
const OEmbedComponent = (props: OEmbedProps) => {
    const { showSnackbar } = useSnackbar();
    const { element, onData = d => d } = props;

    useEffect(() => {
        appendSDK(props).then(() => initEmbed(props));
    });

    const source = element.data?.source || {};
    const oembed = element.data?.oembed || {};
    const sourceUrl = source.url;
    const oembedSourceUrl = oembed.source?.url;

    const skip = !sourceUrl || sourceUrl === oembedSourceUrl;

    const { loading } = useQuery(oembedQuery, {
        skip,
        variables: source,
        onCompleted: data => {
            if (skip) {
                return;
            }
            const { data: oembed, error } = data?.pageBuilder?.oembedData || {};
            if (oembed) {
                const newElement: PbElement = {
                    ...element,
                    data: {
                        ...(element?.data || {}),
                        oembed: onData(oembed)
                    }
                };
                updateElementRecoil({ element: newElement });
            }
            if (error) {
                showSnackbar(error.message);
            }
        }
    });

    const renderEmpty = useCallback(
        () => <div>You must configure your embed in the settings!</div>,
        []
    );

    const renderEmbed = useCallback(
        (targetElement: PbElement, isLoading: boolean) => {
            if (typeof props.renderEmbed === "function") {
                return props.renderEmbed(props);
            }

            if (isLoading) {
                return <div>Loading embed data...</div>;
            }
            return (
                <div
                    id={targetElement.id}
                    className={
                        centerAlign + " pb-editor-dragging--disabled pb-editor-resizing--disabled"
                    }
                    dangerouslySetInnerHTML={{ __html: targetElement.data?.oembed?.html || "" }}
                />
            );
        },
        [element, loading]
    );

    return sourceUrl ? renderEmbed(element, loading) : renderEmpty();
};
export default React.memo(OEmbedComponent);
