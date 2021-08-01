import React from "react";
import styled from "@emotion/styled";
import { Element } from "@webiny/ui-composer/Element";

const ButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid var(--mdc-theme-on-background)",
    color: "var(--mdc-theme-text-primary-on-background)",
    textAlign: "right",
    padding: 25,
    ">:last-child": {
        marginLeft: "auto"
    }
});

export class SimpleFormFooterElement extends Element {
    constructor(id) {
        super(id);

        this.useGrid(false);
    }

    render(props) {
        return <ButtonWrapper>{super.render(props)}</ButtonWrapper>;
    }
}
