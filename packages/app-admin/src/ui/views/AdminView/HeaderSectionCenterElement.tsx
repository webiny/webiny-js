import React from "react";
import { css } from "emotion";
import { UIElement, UiElementRenderProps } from "~/ui/UIElement";
import { TopAppBarSection } from "@webiny/ui/TopAppBar";

const middleBar = css({
    width: "50%"
});

export class HeaderSectionCenterElement extends UIElement {
    public constructor(id: string) {
        super(id);

        this.useGrid(false);
    }

    public override render(props: UiElementRenderProps): React.ReactNode {
        return (
            <TopAppBarSection className={middleBar} alignEnd>
                {super.render(props)}
            </TopAppBarSection>
        );
    }
}
