import React from "react";
import { Slider as AdminUiSlider } from "@webiny/admin-ui/form-components";
import { FormComponentProps } from "~/types";
import { FormElementMessage } from "~/FormElementMessage";

type Props = FormComponentProps & {
    // Component label.
    label?: string;

    // Is checkbox disabled?
    disabled?: boolean;

    // Description beneath the slider.
    description?: string;

    // The minimum value of the Slider.
    min: number | string;

    // The maximum value of the Slider.
    max: number | string;

    // A step to quantize values by.
    step?: number | string;

    // Displays the exact value of the Slider on the knob.
    discrete?: boolean;

    // Displays the individual step markers on the Slider track.
    displayMarkers?: boolean;

    // Function that gets triggered on each input.
    onInput?: (value: any) => void;

    readOnly?: boolean;
};

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Slider` component from the `@webiny/admin-ui` package instead.
 */
class Slider extends React.Component<Props> {
    onValueCommit = (values: number[]) => {
        this.props.onChange && this.props.onChange(values[0]);
    };

    onValueChange = (values: number[]) => {
        this.props.onInput && this.props.onInput(values[0]);
    };

    toFloat = (value: number | string | undefined, defaultValue = 0): number => {
        if (!value) {
            return defaultValue;
        }

        // Convert the value to a string before passing it to parseFloat
        const result = parseFloat(value.toString());

        // Check if the result is a valid number
        return isNaN(result) ? defaultValue : result;
    };

    public override render() {
        const { value, label, description, validation } = this.props;

        let sliderValue = value;
        if (value === null || typeof value === "undefined") {
            sliderValue = this.props.min || 0;
        }

        const { isValid: validationIsValid, message: validationMessage } = validation || {};

        return (
            <React.Fragment>
                <AdminUiSlider
                    {...this.props}
                    min={this.toFloat(this.props.min)}
                    max={this.toFloat(this.props.max, 100)}
                    step={this.toFloat(this.props.step, 1)}
                    value={sliderValue}
                    label={label}
                    onValueCommit={this.onValueCommit}
                    onValueChange={this.onValueChange}
                />

                {validationIsValid === false && (
                    <FormElementMessage error>{validationMessage}</FormElementMessage>
                )}

                {validationIsValid !== false && description && (
                    <FormElementMessage>{description}</FormElementMessage>
                )}
            </React.Fragment>
        );
    }
}

export default Slider;
