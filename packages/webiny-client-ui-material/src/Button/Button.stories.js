// @flow
import React from "react";
import { storiesOf } from "@storybook/react";
import { withKnobs, text, boolean } from "@storybook/addon-knobs";
import Story from "webiny-storybook-utils/Story";
import readme from "./../Button/README.md";

// $FlowFixMe
import Button, { PropsType } from "./Button";

const story = storiesOf("Components/Button", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    const label = text("Label", "Click to proceed");
    const small = boolean("Small", false);
    const flat = boolean("Flat", false);
    const icon = <Button.Icon icon={text("Icon", "save")} />;

    return (
        <Story>
            <Story.Readme>{readme}</Story.Readme>
            <Story.Props>{PropsType}</Story.Props>
            <Story.Sandbox title={"Primary button"}>
                <Button.Primary small={small} flat={flat}>
                    {label}
                </Button.Primary>
            </Story.Sandbox>
            <Story.Sandbox title={"Primary button with icon"}>
                <Button.Primary small={small} flat={flat}>
                    {icon}
                    {label}
                </Button.Primary>
            </Story.Sandbox>
            <Story.Sandbox title={"Secondary button"}>
                <Button.Secondary small={small}>{label}</Button.Secondary>
            </Story.Sandbox>
            <Story.Sandbox title={"Secondary button with icon"}>
                <Button.Secondary small={small}>
                    {icon}
                    {label}
                </Button.Secondary>
            </Story.Sandbox>
            <Story.Sandbox title={"Default button"}>
                <Button.Default small={small}>{label}</Button.Default>
            </Story.Sandbox>
            <Story.Sandbox title={"Default button with icon"}>
                <Button.Default small={small}>
                    {icon}
                    {label}
                </Button.Default>
            </Story.Sandbox>
            <Story.Sandbox title={"Floating button"}>
                <Button.Floating small={small}>{icon}</Button.Floating>
            </Story.Sandbox>
        </Story>
    );
});
