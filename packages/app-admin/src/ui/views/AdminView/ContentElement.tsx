import React from "react";
import styled from "@emotion/styled";
import { UIElement } from "~/ui/UIElement";

const ContentWrapper = styled("div")({
    width: "100%",
    paddingTop: 67
});

export class ContentElement extends UIElement {
    constructor(id: string) {
        super(id);
        this.useGrid(false);
    }

    render(props): React.ReactNode {
        return (
            <ContentWrapper>{props.children ? props.children : super.render(props)}</ContentWrapper>
        );
    }
}
