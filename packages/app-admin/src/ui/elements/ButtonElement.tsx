import React from "react";
import { ButtonDefault, ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";
import { UIElement, UIElementConfig } from "../UIElement";

export type ButtonElementType = "default" | "primary" | "secondary";

export interface ButtonOnClick<TRenderProps = any> {
    (props: TRenderProps): void;
}

export interface ButtonElementConfig<TRenderProps> extends UIElementConfig {
    type: ButtonElementType;
    label: string;
    onClick: ButtonOnClick<TRenderProps>;
}

const BUTTONS = {
    default: ButtonDefault,
    primary: ButtonPrimary,
    secondary: ButtonSecondary
};

export class ButtonElement<TRenderProps = any> extends UIElement<
    ButtonElementConfig<TRenderProps>
> {
    setLabel(label: string) {
        this.config.label = label;
    }

    getLabel() {
        return this.config.label;
    }

    setType(type: ButtonElementType) {
        this.config.type = type;
    }

    getType() {
        return this.config.type;
    }

    setOnClick(onClick: ButtonOnClick<TRenderProps>) {
        this.config.onClick = onClick;
    }

    getOnClick() {
        return this.config.onClick;
    }

    render(props): React.ReactElement {
        const Component = BUTTONS[this.getType()];
        const onClick = this.getOnClick();

        return <Component onClick={() => onClick(props)}>{this.getLabel()}</Component>;
    }
}
