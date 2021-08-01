import React from "react";
import { Element } from "@webiny/ui-composer/Element";
import styled from "@emotion/styled";

const DynamicFieldsetRow = styled("div")({
    paddingBottom: 10
});

// !GOOD FIRST ISSUE!
// Extract rendering and styling into a DynamicFieldsetRowElementRenderer class.

export class DynamicFieldsetRowElement extends Element<any> {
    constructor(id: string) {
        super(id);

        this.applyPlugins(DynamicFieldsetRowElement);
    }

    render(props?: any): React.ReactNode {
        return super.render(props);
        return <DynamicFieldsetRow>{}</DynamicFieldsetRow>;
    }
}
