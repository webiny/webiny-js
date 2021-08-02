import React from "react";
import styled from "@emotion/styled";
import { UIElement } from "@webiny/ui-composer/UIElement";

const ContentWrapper = styled("div")({
    width: "100%",
    paddingTop: 65
});

export class ContentElement extends UIElement {
    constructor(id: string) {
        super(id);
        this.useGrid(false);
    }

    render(props): React.ReactNode {
        return <ContentWrapper>{super.render(props)}</ContentWrapper>;
    }
}
