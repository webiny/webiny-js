import React from "react";

import { UIElement } from "~/ui/UIElement";
import styled from "@emotion/styled";

const ButtonGroup = styled("div")({
    display: "flex",
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    "> button": {
        marginRight: 15
    }
});

export class ButtonGroupElement extends UIElement<any> {
    constructor(id: string) {
        super(id);

        this.useGrid(false);
    }

    render(props?: any): React.ReactNode {
        return <ButtonGroup>{super.render(props)}</ButtonGroup>;
    }
}
