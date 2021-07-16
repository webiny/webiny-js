import React from "react";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { Element } from "./Element";

interface ButtonConfig {
    type: "default" | "primary";
    label: string;
    onClick: Function;
}

export class ButtonElement extends Element<ButtonConfig> {
    render({ formProps, viewProps }: any): React.ReactElement<any> {
        const Component = this._config.type === "default" ? ButtonDefault : ButtonPrimary;
        
        return (
            <Component onClick={() => this._config.onClick({ formProps, viewProps })}>
                {this._config.label}
            </Component>
        );
    }
}
