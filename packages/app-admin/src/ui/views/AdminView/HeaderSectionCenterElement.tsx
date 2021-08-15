import React from "react";
import { css } from "emotion";
import { UIElement } from "~/ui/UIElement";
import { TopAppBarSection } from "@webiny/ui/TopAppBar";

const middleBar = css({
    width: "50%"
});

export class HeaderSectionCenterElement extends UIElement {
    constructor(id: string) {
        super(id);

        this.useGrid(false);
    }

    render(props): React.ReactNode {
        return (
            <TopAppBarSection className={middleBar} alignEnd>
                {super.render(props)}
            </TopAppBarSection>
        );
    }
}
