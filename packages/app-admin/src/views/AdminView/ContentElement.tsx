import React from "react";
import styled from "@emotion/styled";
import { Element } from "@webiny/ui-composer/Element";

const ContentWrapper = styled("div")({
    width: "100%",
    paddingTop: 67
});

export class ContentElement extends Element {
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
