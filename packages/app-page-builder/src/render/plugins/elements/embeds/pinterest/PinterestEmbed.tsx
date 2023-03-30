import React, { useEffect } from "react";
import { css } from "emotion";
import { get } from "lodash";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { PbElement } from "~/types";

declare global {
    interface Window {
        PinUtils: any;
    }
}

interface PinterestEmbedProps {
    element: Pick<PbElement, "id" | "data">;
}

function appendSDK(props: PinterestEmbedProps): Promise<void> {
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

function initEmbed(props: PinterestEmbedProps): void {
    const { element } = props;
    const node = document.getElementById(element.id);
    // @ts-ignore
    if (node && window.PinUtils) {
        // @ts-ignore
        window.PinUtils.build();
    }
}

const centerAlign = css({
    textAlign: "center"
});

const PinterestEmbed: React.VFC<PinterestEmbedProps> = props => {
    const { url } = get(props.element, "data.source") || {};

    useEffect(() => {
        appendSDK(props).then(() => initEmbed(props));
    }, []);

    const renderEmbed = useHandler(props, ({ element }) => {
        return function renderEmbed() {
            const data = get(element, "data.source");
            return (
                <div id={element.id} className={centerAlign}>
                    <a
                        data-pin-do="embedPin"
                        data-pin-width={data.size || "small"}
                        href={data.url}
                    />
                </div>
            );
        };
    });

    return url ? renderEmbed() : null;
};
export default PinterestEmbed;
