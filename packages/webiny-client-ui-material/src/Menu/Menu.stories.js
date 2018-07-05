// @flow
import React from "react";
import { storiesOf } from "@storybook/react";
import Story from "webiny-storybook-utils/Story";
import Button from "./../Button";
import readme from "./../Menu/README.md";

// $FlowFixMe
import Menu, { PropsType } from "./Menu";

const story = storiesOf("Components/Menu", module);

story.add("usage", () => {
    return (
        <Story>
            <Story.Readme>{readme}</Story.Readme>
            <Story.Props>{PropsType}</Story.Props>
            <Story.Sandbox title={"A simple menu, triggered with a button"}>
                <Menu handle={<Button.Primary>Open menu</Button.Primary>}>
                    <Menu.Item
                        onClick={() => {
                            console.log("Apple selected!");
                        }}
                    >
                        Apple
                    </Menu.Item>
                    <Menu.Item>Banana</Menu.Item>
                    <Menu.Item>Watermelon</Menu.Item>
                </Menu>
            </Story.Sandbox>
        </Story>
    );
});
