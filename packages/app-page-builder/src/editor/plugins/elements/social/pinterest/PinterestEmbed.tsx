import React, { useCallback, useEffect } from "react";
import { css } from "emotion";
import { isEqual } from "lodash";
import { get } from "lodash";
import { PbEditorElement, PbElementDataTypeSource } from "~/types";
import useRenderEmptyEmbed from "~/editor/plugins/elements/utils/oembed/useRenderEmptyEmbed";

declare global {
    interface Window {
        PinUtils: any;
    }
}

interface PinterestEmbedProps {
    element: PbEditorElement;
}

async function appendSDK(props: PinterestEmbedProps): Promise<void> {
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
        script.onload = () => {
            return resolve();
        };
        document.body.appendChild(script);
    });
}

async function initEmbed(props: PinterestEmbedProps): Promise<void> {
    const { element } = props;
    const node = document.getElementById(element.id);
    if (node && window.PinUtils) {
        window.PinUtils.build();
    }
}

const centerAlign = css({
    textAlign: "center"
});

const getHTML = (data: PbElementDataTypeSource): string => {
    return `<a
        data-pin-do="embedPin"
        data-pin-width="${data.size || "small"}"
        href="${data.url}"
    />`;
};

const PinterestEmbed: React.FC<PinterestEmbedProps> = props => {
    const { element } = props;

    useEffect(() => {
        appendSDK(props).then(() => initEmbed(props));
    }, [element]);

    const renderEmpty = useRenderEmptyEmbed(element);

    const renderEmbed = useCallback((): React.ReactElement => {
        const data: PbElementDataTypeSource = get(element, "data.source");
        return (
            <div
                id={element.id}
                className={centerAlign}
                dangerouslySetInnerHTML={{ __html: getHTML(data) }}
            />
        );
    }, [element]);

    const { url } = get(element, "data.source") || {};

    return url ? renderEmbed() : renderEmpty();
};

const MemoizedPinterestEmbed = React.memo(PinterestEmbed, (props, nextProps) =>
    isEqual(props, nextProps)
);

MemoizedPinterestEmbed.displayName = "MemoizedPinterestEmbed";
export default MemoizedPinterestEmbed;
