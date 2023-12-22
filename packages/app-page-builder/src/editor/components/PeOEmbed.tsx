/**
 * This file has some parts of code as the one
 * packages/app-page-builder/src/render/components/OEmbed.tsx
 * TODO @ts-refactor
 */
import React, { useCallback, useEffect, ReactElement, useState } from "react";
import gql from "graphql-tag";
import { css } from "emotion";
import { useQuery } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Typography } from "@webiny/ui/Typography";
import { useEventActionHandler } from "../hooks/useEventActionHandler";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";
import { UpdateElementActionEvent } from "../recoil/actions";
import { PbEditorElement } from "~/types";
import useRenderEmptyEmbed from "../plugins/elements/utils/oembed/useRenderEmptyEmbed";

function appendSDK(props: OEmbedProps) {
    const { sdk, global, url } = props;

    if (!sdk || !url || window[global as unknown as keyof Window]) {
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

function initEmbed(props: OEmbedProps) {
    const { sdk, init, element, url } = props;
    if (sdk && url) {
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

const errorElementStyle = css({
    color: "var(--mdc-theme-text-primary-on-background)",
    "& .component-name": {
        fontWeight: "bold"
    }
});

interface OEmbedPropsInitParams {
    props: OEmbedProps;
    node: HTMLElement;
}
export interface OEmbedProps {
    element: PbEditorElement;
    onData?: (data: { [key: string]: any }) => { [key: string]: any };
    renderEmbed?: (props: OEmbedProps) => ReactElement;
    data?: any;
    sdk?: string;
    global?: keyof Window;
    init?: (params: OEmbedPropsInitParams) => void;
    url?: string;
}
const PeOEmbedComponent = (props: OEmbedProps) => {
    const [errorMessage, setErrorMessage] = useState(null);
    const eventActionHandler = useEventActionHandler();
    const { showSnackbar } = useSnackbar();
    const { element, onData = d => d } = props;
    const variableValue = useElementVariableValue(element);

    const propsWithVariable = {
        ...props,
        url: variableValue || element?.data?.source?.url
    };

    useEffect(() => {
        appendSDK(propsWithVariable).then(() => initEmbed(propsWithVariable));
    });

    const source = variableValue ? { url: variableValue } : element.data.source || {};
    const oembed = element.data.oembed || {};
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
            const { data: oembed, error } = data.pageBuilder.oembedData || {};
            if (oembed) {
                const newElement: PbEditorElement = {
                    ...element,
                    data: {
                        ...element.data,
                        oembed: onData(oembed)
                    }
                };
                eventActionHandler.trigger(
                    new UpdateElementActionEvent({
                        element: newElement,
                        history: true
                    })
                );
            }
            if (error) {
                setErrorMessage(error.message);
                showSnackbar(error.message);
            }
        }
    });

    const renderEmpty = useRenderEmptyEmbed(element);

    const renderEmbed = useCallback(
        (targetElement: PbEditorElement, isLoading: boolean) => {
            if (typeof props.renderEmbed === "function") {
                return props.renderEmbed(props);
            }

            if (isLoading) {
                return <div>Loading embed data...</div>;
            }
            if (errorMessage) {
                return (
                    <details className={errorElementStyle}>
                        <summary>
                            <Typography use={"overline"}>
                                We couldn&apos;t embed your{" "}
                                <span className={"component-name"}>{element.type}</span> URL! See
                                the detailed error below.
                            </Typography>
                        </summary>
                        <Typography use={"body2"}>{errorMessage}</Typography>
                    </details>
                );
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
        [element, loading, errorMessage]
    );

    return sourceUrl ? renderEmbed(element, loading) : renderEmpty();
};

export default React.memo(PeOEmbedComponent);
