import React from "react";
import styled from "@emotion/styled";
import { ReactComponent as IFrameIcon } from "./iframe-icon.svg";
import { PbEditorElement } from "~/types";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50,
        color: "var(--mdc-theme-text-secondary-on-background)"
    }
});

interface IFrameProps {
    element: PbEditorElement;
}

const Iframe: React.FC<IFrameProps> = props => {
    const { element } = props;

    if (!element?.data?.iframe?.url) {
        return (
            <PreviewBox>
                <IFrameIcon />
            </PreviewBox>
        );
    }

    return <iframe src={element.data.iframe.url} width="100%" height="100%" />;
};

export default Iframe;
