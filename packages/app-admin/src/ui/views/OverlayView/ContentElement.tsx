import React from "react";
import styled from "@emotion/styled";
import { UIElement, UiElementRenderProps } from "~/ui/UIElement";

const ContentWrapper = styled("div")({
    width: "100%",
    paddingTop: 65
});

export class ContentElement extends UIElement {
    constructor(id: string) {
        super(id);
        this.useGrid(false);
    }

    public override render(props: UiElementRenderProps): React.ReactNode {
        return <ContentWrapper>{super.render(props)}</ContentWrapper>;
    }
}
