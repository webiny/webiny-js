// @flow
import React from "react";
import { storiesOf } from "@storybook/react";
import Story from "webiny-storybook-utils/Story";
import List from "./../List";
import readme from "./../Drawer/README.md";
import { withKnobs, boolean, selectV2 } from "@storybook/addon-knobs";

// $FlowFixMe
import Drawer, { PropsType } from "./Drawer";

const story = storiesOf("Components/Drawer", module);
story.addDecorator(withKnobs);

story.add("basic usage", () => {
    const mode = selectV2("Mode", ["temporary", "persistent", "permanent"], "permanent");
    const open = boolean("Open", true);

    return (
        <Story>
            <Story.Readme>{readme}</Story.Readme>
            <Story.Props>{PropsType}</Story.Props>
            <Story.Sandbox title={"drawer"}>
                <Story.Sandbox.Example title={"A list with all possible options"}>
                    <Drawer mode={mode} open={open}>
                        <Drawer.Header>Main Menu</Drawer.Header>
                        <Drawer.Content>
                            <List>
                                <List.Item>
                                    <List.Item.Text>Users</List.Item.Text>
                                </List.Item>

                                <List.Item>
                                    <List.Item.Text>Companies</List.Item.Text>
                                </List.Item>

                                <List.Item>
                                    <List.Item.Text>
                                        Brands
                                        <List.Item.Text.Secondary>
                                            2 new brands
                                        </List.Item.Text.Secondary>
                                    </List.Item.Text>
                                </List.Item>

                                <List.Item>
                                    <List.Item.Text>ACL</List.Item.Text>
                                </List.Item>
                                <List.Item>
                                    <List.Item.Text>Settings</List.Item.Text>
                                </List.Item>
                            </List>
                        </Drawer.Content>
                    </Drawer>
                </Story.Sandbox.Example>
                <Story.Sandbox.Code>
                    {`
                    <Drawer permanent={permanent} peristent={persistent} open={open} temporary={temporary}>
                        <Drawer.Header>Main Menu</Drawer.Header>
                        <Drawer.Content>
                            <List>
                                <List.Item>
                                    <List.Item.Text>Users</List.Item.Text>
                                </List.Item>

                                <List.Item>
                                    <List.Item.Text>Companies</List.Item.Text>
                                </List.Item>

                                <List.Item>
                                    <List.Item.Text>
                                        Brands
                                        <List.Item.Text.Secondary>
                                            2 new brands
                                        </List.Item.Text.Secondary>
                                    </List.Item.Text>
                                </List.Item>

                                <List.Item>
                                    <List.Item.Text>ACL</List.Item.Text>
                                </List.Item>
                                <List.Item>
                                    <List.Item.Text>Settings</List.Item.Text>
                                </List.Item>
                            </List>
                        </Drawer.Content>
                    </Drawer>
                    `}
                </Story.Sandbox.Code>
            </Story.Sandbox>
        </Story>
    );
});
