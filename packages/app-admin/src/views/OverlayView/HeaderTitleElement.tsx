import React from "react";
import { Element, ElementConfig } from "@webiny/ui-composer/Element";
import { Typography } from "@webiny/ui/Typography";
import { ElementRenderer, ElementRenderParams } from "@webiny/ui-composer/ElementRenderer";

interface HeaderTitleElementConfig extends ElementConfig {
    title: () => string;
}

export class HeaderTitleElementRenderer extends ElementRenderer<HeaderTitleElement> {
    render({ element }: ElementRenderParams<HeaderTitleElement>): React.ReactNode {
        return (
            <Typography
                style={{ margin: "0 auto", color: "var(--mdc-theme-on-surface)" }}
                use={"headline6"}
            >
                {element.config.title()}
            </Typography>
        );
    }
}

export class HeaderTitleElement extends Element<HeaderTitleElementConfig> {
    constructor(id: string, config: HeaderTitleElementConfig) {
        super(id, config);

        this.addRenderer(new HeaderTitleElementRenderer());
    }
}
