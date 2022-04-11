import React from "react";
import styled from "@emotion/styled";
import { ReactComponent as IFrameIcon } from "./iframe-icon.svg";
import { PbEditorElement } from "~/types";
import { PageBuilderContext } from "../../../../../contexts/PageBuilder";

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

const Iframe: React.FC<IFrameProps> = ({ element }) => {
    const { data } = element;

    const {
        responsiveDisplayMode: { displayMode }
    } = React.useContext(PageBuilderContext);

    const elementHeight = data?.settings?.height?.[displayMode]?.value || "initial";

    if (!element?.data?.iframe?.url) {
        return (
            <PreviewBox>
                <IFrameIcon />
            </PreviewBox>
        );
    }

    return <iframe src={element.data.iframe.url} style={{ height: elementHeight }} width="100%" />;
};

export default Iframe;
