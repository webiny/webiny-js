import React from "react";
import { ButtonDefault, ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";
import { UIElement, UIElementConfig } from "../UIElement";
import { kebabCase } from "lodash";

export type ButtonElementType = "default" | "primary" | "secondary";

export interface ButtonOnClick<TRenderProps = any> {
    (props: TRenderProps): void;
}

interface GetterWithProps<TProps, TReturn> {
    (props: TProps): TReturn;
}

export interface ButtonElementConfig<TRenderProps> extends UIElementConfig {
    type: ButtonElementType | GetterWithProps<TRenderProps, ButtonElementType>;
    label: string | GetterWithProps<TRenderProps, string>;
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
    public setLabel<TProps extends TRenderProps = TRenderProps>(
        label: string | GetterWithProps<TProps, string>
    ): void {
        /**
         * TODO @ts-refactor
         * 'TProps' could be instantiated with an arbitrary type which could be unrelated to 'TRenderProps'
         */
        // @ts-ignore
        this.config.label = label;
    }

    public getLabel(props?: TRenderProps): string {
        if (typeof this.config.label === "function") {
            // TODO @ts-refactor find out correct types to pass
            return this.config.label(props as TRenderProps);
        }
        return this.config.label;
    }

    public setType(type: ButtonElementType): void {
        this.config.type = type;
    }

    public getType(props?: TRenderProps): ButtonElementType {
        if (typeof this.config.type === "function") {
            // TODO @ts-refactor find out correct types to pass
            return this.config.type(props as TRenderProps);
        }
        return this.config.type;
    }

    public setOnClick(onClick: ButtonOnClick<TRenderProps>): void {
        this.config.onClick = onClick;
    }

    public getOnClick() {
        return this.config.onClick;
    }

    public override render(props: TRenderProps): React.ReactElement {
        const Component = BUTTONS[this.getType(props)];
        const onClick = this.getOnClick();

        return (
            <Component
                onClick={() => onClick(props)}
                data-testid={`button-element-${kebabCase(this.getLabel(props))}`}
            >
                {this.getLabel(props)}
            </Component>
        );
    }
}
