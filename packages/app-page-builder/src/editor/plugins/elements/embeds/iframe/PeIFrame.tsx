import React from "react";
import { createRenderer, useRenderer } from "@webiny/app-page-builder-elements";
import { ReactComponent as IFrameIcon } from "~/editor/plugins/elements/embeds/iframe/iframe-icon.svg";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";
import styled from "@emotion/styled";

export interface IFrameElementData {
    iframe: {
        url: string;
    };
}

const PreviewBox = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;

    svg {
        height: 50px;
        width: 50px;
        color: var(--mdc-theme-text-secondary-on-background);
    }
`;

const IFrame = createRenderer(() => {
    const { getElement } = useRenderer();

    const element = getElement<IFrameElementData>();
    const variableValue = useElementVariableValue(element);

    const url = variableValue || element?.data?.iframe?.url;

    if (!url) {
        return (
            <PreviewBox>
                <IFrameIcon />
            </PreviewBox>
        );
    }
    return <iframe src={url} width="100%" height="100%" />;
});

export default IFrame;
