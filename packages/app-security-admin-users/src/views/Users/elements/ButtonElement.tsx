import React from "react";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { Element, ElementConfig } from "./Element";

interface ButtonConfig extends ElementConfig {
    type: "default" | "primary";
    label: string;
    onClick: Function;
}

export class ButtonElement extends Element<ButtonConfig> {
    render({ formProps, viewProps }: any): React.ReactElement<any> {
        const Component = this.config.type === "default" ? ButtonDefault : ButtonPrimary;

        return (
            <Component onClick={() => this.config.onClick({ formProps, viewProps })}>
                {this.config.label}
            </Component>
        );
    }
}
