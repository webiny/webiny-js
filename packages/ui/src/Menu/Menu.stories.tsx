import React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StorySandbox,
    StorySandboxExample,
    StorySandboxCode
} from "@webiny/storybook-utils/Story";
import { ButtonPrimary } from "./../Button";
import readme from "./../Menu/README.md";
import { Menu, MenuItem, MenuDivider } from "./Menu";

const story = storiesOf("Components/Menu", module);

const style: React.CSSProperties = {
    position: "relative",
    width: 200,
    margin: "0 auto"
};

story.add(
    "usage",
    () => {
        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox>
                    <StorySandboxExample title={"A simple menu, triggered with a button"}>
                        <div style={style}>
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
                        </div>
                    </StorySandboxExample>
                    <StorySandboxCode>
                        {`
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
                    `}
                    </StorySandboxCode>
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [Menu, MenuItem, MenuDivider] } }
);
