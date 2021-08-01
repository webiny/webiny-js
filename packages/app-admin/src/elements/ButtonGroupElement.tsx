import React from "react";

import { Element } from "@webiny/ui-composer/Element";
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

export class ButtonGroupElement extends Element<any> {
    constructor(id: string) {
        super(id);

        this.toggleGrid(false);
    }

    render(props?: any): React.ReactNode {
        return <ButtonGroup>{super.render(props)}</ButtonGroup>;
    }
}
