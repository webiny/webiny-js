import React from "react";
import { Input } from "@webiny/ui/Input";
import { FormRenderPropParams } from "@webiny/form";
import { FormFieldElement, FormFieldElementConfig } from "~/ui/elements/form/FormFieldElement";

export interface TextareaElementRenderProps {
    formProps: FormRenderPropParams;
}

export interface TextareaElementConfig extends FormFieldElementConfig {
    rows: number;
}

export class TextareaElement extends FormFieldElement<TextareaElementConfig> {
    constructor(id: string, config: TextareaElementConfig) {
        super(id, config);

        this.applyPlugins(TextareaElement);
    }

    public setRows(rows: number): void {
        this.config.rows = rows;
    }

    public getRows(): number {
        return this.config.rows;
    }

    public override render(props: TextareaElementRenderProps): React.ReactNode {
        if (!props.formProps) {
            throw Error(`TextareaElement must be placed inside of a FormElement.`);
        }

        const { Bind } = props.formProps;

        return (
            <Bind name={this.getName()} validators={this.getValidators(props)}>
                <Input
                    label={this.getLabel(props)}
                    disabled={this.getIsDisabled(props)}
                    rows={this.getRows()}
                    description={this.getDescription(props)}
                />
            </Bind>
        );
    }
}
