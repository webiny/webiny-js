import React from "react";
import { Select } from "@webiny/ui/Select";
import {
    FormFieldElement,
    FormFieldElementConfig,
    FormFieldElementRenderProps
} from "~/ui/elements/form/FormFieldElement";

export interface SelectElementOption {
    value: string;
    label: string;
}

export interface SelectElementConfig extends FormFieldElementConfig {
    options?: SelectElementOption[];
}

export class SelectElement extends FormFieldElement<SelectElementConfig> {
    constructor(id: string, config: SelectElementConfig) {
        super(id, config);

        this.applyPlugins(SelectElement);
    }

    setOptions(options: SelectElementOption[]) {
        this.config.options = options;
    }

    getOptions() {
        return this.config.options;
    }

    render(props: FormFieldElementRenderProps): React.ReactNode {
        if (!props.formProps) {
            throw Error(`SelectElement must be placed inside of a FormElement.`);
        }

        const { Bind } = props.formProps;

        return (
            <Bind
                name={this.getName()}
                validators={this.getValidators(props)}
                defaultValue={this.getDefaultValue(props)}
                beforeChange={(value, cb) => this.onBeforeChange(value, cb)}
                afterChange={(value, form) => this.onAfterChange(value, form)}
            >
                <Select
                    label={this.getLabel(props)}
                    disabled={this.getIsDisabled(props)}
                    description={this.getDefaultValue(props)}
                >
                    {this.getOptions().map(({ value, label }) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </Select>
            </Bind>
        );
    }
}
