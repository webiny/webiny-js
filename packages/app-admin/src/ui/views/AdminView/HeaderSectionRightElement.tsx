import React from "react";
import { css } from "emotion";
import { UIElement, UiElementRenderProps } from "~/ui/UIElement";
import { TopAppBarSection } from "@webiny/ui/TopAppBar";

const edgeBars = css({
    width: "25%"
});

export class HeaderSectionRightElement extends UIElement {
    public constructor(id: string) {
        super(id);

        this.useGrid(false);
    }

    public override render(props: UiElementRenderProps): React.ReactNode {
        return (
            <TopAppBarSection className={edgeBars} alignEnd>
                {super.render(props)}
            </TopAppBarSection>
        );
    }
}
