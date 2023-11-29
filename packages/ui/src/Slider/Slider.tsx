import React from "react";
import { Slider as RmwcSlider } from "@rmwc/slider";
import { FormComponentProps } from "~/types";
import styled from "@emotion/styled";
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
};

// wrapper fixes a bug in slider where the slider handle is rendered outside the bounds of the slider box
const Wrapper = styled("div")({
    width: "100%",
    ".mdc-slider .mdc-slider__thumb-container": {
        left: 5
    }
});

/**
 * Slider component lets users choose a value from given range.
 */
class Slider extends React.Component<Props> {
    onChange = (e: { detail: { value: number } }) => {
        this.props.onChange && this.props.onChange(e.detail.value);
    };

    onInput = (e: { detail: { value: number } }) => {
        this.props.onInput && this.props.onInput(e.detail.value);
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
                {label && (
                    <div className="mdc-text-field-helper-text mdc-text-field-helper-text--persistent">
                        {label}
                    </div>
                )}

                <Wrapper>
                    <RmwcSlider
                        {...this.props}
                        value={sliderValue}
                        onChange={this.onChange}
                        onInput={this.onInput}
                    />
                </Wrapper>

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
