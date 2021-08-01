import React from "react";
import { Input } from "@webiny/ui/Input";
import { BindComponentProps, FormRenderPropParams } from "@webiny/form";
import { UIElement, UIElementConfig } from "@webiny/ui-composer/UIElement";

export interface TextareaElementRenderProps {
    formProps: FormRenderPropParams;
}

interface IsDisabled {
    (props: TextareaElementRenderProps): boolean;
}

export interface TextareaElementConfig extends UIElementConfig {
    name: string;
    label: string;
    description: string | React.ReactElement;
    validators?: Function;
    beforeChange?: BindComponentProps["beforeChange"];
    defaultValue?: any;
    isDisabled?: boolean | IsDisabled;
    rows: number;
}

export class TextareaElement extends UIElement<TextareaElementConfig> {
    constructor(id: string, config: TextareaElementConfig) {
        super(id, config);

        this.applyPlugins(TextareaElement);
    }

    setLabel(label: string) {
        this.config.label = label;
    }

    setDescription(description: string | React.ReactElement) {
        this.config.description = description;
    }

    setIsDisabled(isDisabled: boolean | IsDisabled) {
        this.config.isDisabled = isDisabled;
    }

    setRows(rows: number) {
        this.config.rows = rows;
    }

    protected isDisabled(props: TextareaElementRenderProps): boolean {
        if (typeof this.config.isDisabled === "function") {
            return this.config.isDisabled(props);
        }

        return this.config.isDisabled;
    }

    render(props: TextareaElementRenderProps): React.ReactNode {
        if (!props.formProps) {
            throw Error(`TextareaElement must be placed inside of a FormElement.`);
        }

        const { Bind } = props.formProps;

        return (
            <Bind name={this.config.name} validators={this.config.validators}>
                <Input
                    label={this.config.label}
                    disabled={this.isDisabled(props)}
                    rows={this.config.rows}
                    description={this.config.description}
                />
            </Bind>
        );
    }
}
