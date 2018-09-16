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
} from "webiny-storybook-utils/Story";
import readme from "./../List/README.md";

import { Icon } from "./../Icon";
import { ButtonPrimary } from "./../Button";

import { ReactComponent as AutoRenewIcon } from "./icons/baseline-autorenew-24px.svg";
import { ReactComponent as CloudDoneIcon } from "./icons/baseline-cloud_done-24px.svg";
import { ReactComponent as BaselineDeleteIcon } from "./icons/baseline-delete-24px.svg";
import { ReactComponent as BaselineDoneIcon } from "./icons/baseline-done-24px.svg";

import {
    // $FlowFixMe
    PropsType,
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListItemGraphic,
    ListItemTextPrimary
} from "./List";

const story = storiesOf("Components/List", module);

story.add("simple list", () => {
    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>

            <StorySandbox>
                <StorySandboxExample title={"Basic list"}>
                    <List>
                        <ListItem>Item 1</ListItem>
                        <ListItem>
                            <ListItemGraphic>
                                <Icon icon={<BaselineDeleteIcon />} />
                            </ListItemGraphic>
                            Item 2 - with icon on left side
                        </ListItem>
                        <ListItem>
                            Item 3 - with icon on right side
                            <ListItemMeta>
                                <Icon icon={<BaselineDoneIcon />} />
                            </ListItemMeta>
                        </ListItem>
                        <ListItem>
                            <ListItemGraphic>
                                <Icon icon={<BaselineDeleteIcon />} />
                            </ListItemGraphic>
                            Item 4 - icons on both sides
                            <ListItemMeta>
                                <Icon icon={<BaselineDoneIcon />} />
                            </ListItemMeta>
                        </ListItem>
                    </List>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                        <List>
                        <ListItem>
                            Item 1
                        </ListItem>

                        <ListItem>
                            <ListItemGraphic>
                                <Icon icon={<BaselineDeleteIcon />} />
                            </ListItemGraphic>
                            Item 2 - with icon on left side
                        </ListItem>
                        <ListItem>
                            Item 3 - with icon on right side
                            <ListItemMeta>
                                <Icon icon={<BaselineDoneIcon />} />
                            </ListItemMeta>
                        </ListItem>
                        <ListItem>
                            <ListItemGraphic>
                                <Icon icon={<BaselineDeleteIcon />} />
                            </ListItemGraphic>
                            Item 4 - icons on both sides
                            <ListItemMeta>
                                <Icon icon={<BaselineDoneIcon />} />
                            </ListItemMeta>
                        </ListItem>
                    </List>
                    `}
                </StorySandboxCode>
            </StorySandbox>

            <StorySandbox>
                <StorySandboxExample title={"List with 2 lines"}>
                    <List twoLine>
                        <ListItem>
                            <ListItemText>
                                <ListItemTextPrimary>Primary text</ListItemTextPrimary>
                                <ListItemTextSecondary>Secondary text</ListItemTextSecondary>
                            </ListItemText>
                        </ListItem>
                        <ListItem>
                            <ListItemText>
                                <ListItemTextPrimary>Primary text</ListItemTextPrimary>
                                <ListItemTextSecondary>Secondary text</ListItemTextSecondary>
                            </ListItemText>
                        </ListItem>
                        <ListItem>
                            <ListItemText>
                                <ListItemTextPrimary>Primary text</ListItemTextPrimary>
                                <ListItemTextSecondary>Secondary text</ListItemTextSecondary>
                            </ListItemText>
                        </ListItem>
                    </List>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                        <List twoLine>
                        <ListItem>
                            <ListItemText>
                                <ListItemTextPrimary>
                                    Primary text
                                </ListItemTextPrimary>
                                <ListItemTextSecondary>
                                    Secondary text
                                </ListItemTextSecondary>
                            </ListItemText>
                        </ListItem>
                        <ListItem>
                            <ListItemText>
                                <ListItemTextPrimary>
                                    Primary text
                                </ListItemTextPrimary>
                                <ListItemTextSecondary>
                                    Secondary text
                                </ListItemTextSecondary>
                            </ListItemText>
                        </ListItem>
                        <ListItem>
                            <ListItemText>
                                <ListItemTextPrimary>
                                    Primary text
                                </ListItemTextPrimary>
                                <ListItemTextSecondary>
                                    Secondary text
                                </ListItemTextSecondary>
                            </ListItemText>
                        </ListItem>
                    </List>
                    `}
                </StorySandboxCode>
            </StorySandbox>

            <StorySandbox>
                <StorySandboxExample title={"A list with all possible options"}>
                    <List twoLine>
                        <ListItem>
                            <ListItemGraphic>
                                <Icon icon={<AutoRenewIcon />} />
                            </ListItemGraphic>
                            <ListItemText>
                                <ListItemTextPrimary>Rocket</ListItemTextPrimary>
                                <ListItemTextSecondary>
                                    This could be a really cool rocket.
                                </ListItemTextSecondary>
                            </ListItemText>
                            <ListItemMeta>
                                <Icon icon={<CloudDoneIcon />} />
                            </ListItemMeta>
                        </ListItem>

                        <ListItem>
                            <ListItemGraphic>
                                <Icon icon={<BaselineDeleteIcon />} />
                            </ListItemGraphic>
                            <ListItemText>
                                <ListItemTextPrimary>Coffee</ListItemTextPrimary>
                                <ListItemTextSecondary>A nice cup of coffee.</ListItemTextSecondary>
                            </ListItemText>
                            <ListItemMeta>
                                <Icon icon={<BaselineDoneIcon />} />
                            </ListItemMeta>
                        </ListItem>
                        <ListItem>
                            <ListItemGraphic>
                                <Icon icon={<AutoRenewIcon />} />
                            </ListItemGraphic>
                            <ListItemText>
                                <ListItemTextPrimary>E-mail</ListItemTextPrimary>
                                <ListItemTextSecondary>
                                    Send an e-mail to your best friend.
                                </ListItemTextSecondary>
                            </ListItemText>
                            <ListItemMeta>
                                <ButtonPrimary>Send</ButtonPrimary>
                            </ListItemMeta>
                        </ListItem>
                    </List>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                        <List twoLine>
                        <ListItem>
                            <ListItemGraphic>
                                <Icon icon={<AutoRenewIcon />} />
                            </ListItemGraphic>
                            <ListItemText>
                                <ListItemTextPrimary>Rocket</ListItemTextPrimary>
                                <ListItemTextSecondary>
                                    This could be a really cool rocket.
                                </ListItemTextSecondary>
                            </ListItemText>
                            <ListItemMeta>
                                <Icon icon={<CloudDoneIcon />} />
                            </ListItemMeta>
                        </ListItem>

                        <ListItem>
                            <ListItemGraphic>
                                <Icon icon={<BaselineDeleteIcon />} />
                            </ListItemGraphic>
                            <ListItemText>
                                <ListItemTextPrimary>Coffee</ListItemTextPrimary>
                                <ListItemTextSecondary>A nice cup of coffee.</ListItemTextSecondary>
                            </ListItemText>
                            <ListItemMeta>
                                <Icon icon={<BaselineDoneIcon />} />
                            </ListItemMeta>
                        </ListItem>
                        <ListItem>
                            <ListItemGraphic>
                                <Icon icon={<AutoRenewIcon />} />
                            </ListItemGraphic>
                            <ListItemText>
                                <ListItemTextPrimary>E-mail</ListItemTextPrimary>
                                <ListItemTextSecondary>
                                    Send an e-mail to your best friend.
                                </ListItemTextSecondary>
                            </ListItemText>
                            <ListItemMeta>
                                <ButtonPrimary>Send</ButtonPrimary>
                            </ListItemMeta>
                        </ListItem>
                    </List>
                    `}
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
