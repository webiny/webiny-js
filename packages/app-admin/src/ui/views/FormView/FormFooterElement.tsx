import React from "react";
import styled from "@emotion/styled";
import { UIElement, UiElementRenderProps } from "~/ui/UIElement";

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

export class FormFooterElement extends UIElement {
    public constructor(id: string) {
        super(id);

        this.useGrid(false);
    }

    public override render(props: UiElementRenderProps) {
        return <ButtonWrapper>{super.render(props)}</ButtonWrapper>;
    }
}
