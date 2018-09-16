// @flow
import React from "react";
import { storiesOf } from "@storybook/react";
import { Story, StoryReadme, StoryProps, StorySandbox } from "webiny-storybook-utils/Story";
import { ButtonPrimary } from "./../Button";
import readme from "./../Menu/README.md";

// $FlowFixMe
import { Menu, MenuItem, PropsType } from "./Menu";

const story = storiesOf("Components/Menu", module);

story.add("usage", () => {
    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox title={"A simple menu, triggered with a button"}>
                <Menu handle={<ButtonPrimary>Open menu</ButtonPrimary>}>
                    <MenuItem
                        onClick={() => {
                            console.log("Apple selected!");
                        }}
                    >
                        Apple
                    </MenuItem>
                    <MenuItem>Banana</MenuItem>
                    <MenuItem>Watermelon</MenuItem>
                </Menu>
            </StorySandbox>
        </Story>
    );
});
