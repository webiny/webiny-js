// @flow
import React from "react";
import { storiesOf } from "@storybook/react";
import { withKnobs, text, boolean } from "@storybook/addon-knobs";
import { Story, StoryReadme, StoryProps, StorySandbox } from "@webiny/storybook-utils/Story";
import readme from "./../Button/README.md";
import { ReactComponent as CloudIcon } from "./assets/baseline-cloud_done-24px.svg";

import {
    ButtonPrimary,
    ButtonSecondary,
    ButtonDefault,
    ButtonFloating,
    ButtonIcon,
    // $FlowFixMe
    PropsType
} from "./Button";

const story = storiesOf("Components/Button", module);
story.addDecorator(withKnobs);

story.add("standard buttons", () => {
    const label = text("Label", "Click to proceed");
    const small = boolean("Small", false);
    const flat = boolean("Flat", false);
    const icon = <ButtonIcon icon={<CloudIcon />} />;

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox title={"Primary button"}>
                <ButtonPrimary small={small} flat={flat}>
                    {label}
                </ButtonPrimary>
            </StorySandbox>
            <StorySandbox title={"Primary button with icon"}>
                <ButtonPrimary small={small} flat={flat}>
                    {icon}
                    {label}
                </ButtonPrimary>
            </StorySandbox>
            <StorySandbox title={"Secondary button"}>
                <ButtonSecondary small={small}>{label}</ButtonSecondary>
            </StorySandbox>
            <StorySandbox title={"Secondary button with icon"}>
                <ButtonSecondary small={small}>
                    {icon}
                    {label}
                </ButtonSecondary>
            </StorySandbox>
            <StorySandbox title={"Default button"}>
                <ButtonDefault small={small}>{label}</ButtonDefault>
            </StorySandbox>
            <StorySandbox title={"Default button with icon"}>
                <ButtonDefault small={small}>
                    {icon}
                    {label}
                </ButtonDefault>
            </StorySandbox>
            <StorySandbox title={"Floating button"}>
                <ButtonFloating small={small} icon={icon} />
            </StorySandbox>
        </Story>
    );
});
