// @flow
import React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StoryProps,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "@webiny/storybook-utils/Story";
import { List, ListItem } from "./../List";

import readme from "./../Drawer/README.md";
import { withKnobs, boolean } from "@storybook/addon-knobs";

// $FlowFixMe
import { Drawer, DrawerHeader, DrawerContent, PropsType } from "./Drawer";

const story = storiesOf("Components/Drawer", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    const open = boolean("Open", true);

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox title={"drawer"}>
                <StorySandboxExample title={"A list with all possible options"}>
                    <Drawer open={open}>
                        <DrawerHeader>Main Menu</DrawerHeader>
                        <DrawerContent>
                            <List>
                                <ListItem>Users</ListItem>

                                <ListItem>Companies</ListItem>

                                <ListItem>Brands</ListItem>

                                <ListItem>ACL</ListItem>
                                <ListItem>Settings</ListItem>
                            </List>
                        </DrawerContent>
                    </Drawer>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                    <Drawer>
                        <DrawerHeader>Main Menu</DrawerHeader>
                        <DrawerContent>
                            <List>
                                <ListItem>
                                    Users
                                </ListItem>

                                <ListItem>
                                    Companies
                                </ListItem>

                                <ListItem>
                                        Brands
                                </ListItem>

                                <ListItem>
                                    ACL
                                </ListItem>
                                <ListItem>
                                    Settings
                                </ListItem>
                            </List>
                        </DrawerContent>
                    </Drawer>
                    `}
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
