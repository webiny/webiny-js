import React from "react";
import { UIElement } from "~/ui/UIElement";
import styled from "@emotion/styled";

const DynamicFieldsetRow = styled("div")({
    paddingBottom: 10
});

// !GOOD FIRST ISSUE!
// Extract rendering and styling into a DynamicFieldsetRowElementRenderer class.

export class DynamicFieldsetRowElement extends UIElement<any> {
    constructor(id: string) {
        super(id);

        this.applyPlugins(DynamicFieldsetRowElement);
    }

    render(props?: any): React.ReactNode {
        return super.render(props);
        return <DynamicFieldsetRow>{}</DynamicFieldsetRow>;
    }
}
