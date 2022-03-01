import React from "react";
import classNames from "classnames";
import styled from "@emotion/styled";
import { Elevation } from "@webiny/ui/Elevation";
import { UIElement, UIElementConfig, UiElementRenderProps } from "~/ui/UIElement";

const FormContainerWrapper = styled("div")({
    position: "relative",
    margin: "17px 50px"
});

interface FormContainerConfig extends UIElementConfig {
    testId?: string;
    noElevation?: boolean;
    className?: string;
}

export class FormContainerElement extends UIElement<FormContainerConfig> {
    public constructor(id: string, config: FormContainerConfig) {
        super(id, config);
        this.useGrid(false);
    }

    public override render(props: UiElementRenderProps) {
        const children = super.render(props);

        return (
            <FormContainerWrapper
                className={classNames("webiny-data-list", this.config.className)}
                data-testid={this.config.testId}
            >
                {this.config.noElevation ? children : <Elevation z={1}>{children}</Elevation>}
            </FormContainerWrapper>
        );
    }
}
