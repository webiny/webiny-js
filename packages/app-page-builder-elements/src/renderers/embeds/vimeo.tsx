import React from "react";
import { Element } from "~/types";
import { OEmbed, OEmbedProps } from "./components/OEmbed";
import styled from "@emotion/styled";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

const OuterWrapper = styled.div({
    boxSizing: "border-box",
    width: "100%"
});

const InnerWrapper = styled.div({
    left: 0,
    width: "100%",
    height: "auto",
    position: "relative",
    paddingBottom: 0
});

const ScalableVideo = styled.div({
    position: "relative",
    height: 0,
    paddingTop: "56.25%",
    width: "100%",
    backgroundColor: "#000",
    marginBottom: "1.2rem",
    ["iframe"]: {
        maxWidth: "100%",
        border: "none",
        display: "block",
        height: "100%",
        margin: 0,
        padding: 0,
        position: "absolute",
        top: 0,
        width: "100%"
    }
});

interface VimeoEmbedProps {
    element: Element;
}

const VimeoEmbed = (props: VimeoEmbedProps) => {
    const { element } = props;

    return (
        <OuterWrapper>
            <InnerWrapper>
                <ScalableVideo
                    id={element.id}
                    dangerouslySetInnerHTML={{ __html: element?.data?.oembed?.html || "" }}
                />
            </InnerWrapper>
        </OuterWrapper>
    );
};

const renderEmbed: OEmbedProps["renderEmbed"] = props => {
    return <VimeoEmbed {...props} />;
};

export const createVimeo = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();
        return <OEmbed element={getElement()} renderEmbed={renderEmbed} />;
    });
};
