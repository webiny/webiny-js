import React from "react";
import { UIElement, UiElementRenderProps } from "~/ui/UIElement";
import styled from "@emotion/styled";

const DynamicFieldsetRow = styled("div")({
    paddingBottom: 10
});

// !GOOD FIRST ISSUE!
// Extract rendering and styling into a DynamicFieldsetRowElementRenderer class.

export class DynamicFieldsetRowElement extends UIElement<any> {
    public constructor(id: string) {
        super(id);

        this.applyPlugins(DynamicFieldsetRowElement);
    }

    public render(props?: UiElementRenderProps): React.ReactNode {
        return super.render(props);
        return <DynamicFieldsetRow>{}</DynamicFieldsetRow>;
    }
}
