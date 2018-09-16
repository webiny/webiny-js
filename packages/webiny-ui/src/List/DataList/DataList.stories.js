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
import readme from "./../DataList/README.md";
import { withKnobs, boolean, text, object, array } from "@storybook/addon-knobs";

// $FlowFixMe
import { DataList, PropsType } from "./DataList";

import { DeleteIcon, EditIcon } from "./icons";
import {
    List,
    ListItem,
    ListItemText,
    ListItemTextSecondary,
    ListItemMeta,
    ListItemGraphic
} from "./../List";

const story = storiesOf("Components/List", module);
story.addDecorator(withKnobs);

story.add("data list", () => {
    const generalOptionsAndCallbacks = {
        refresh: () => {
            console.log(`Implement "refresh" method.`);
        },
        loading: boolean("Loading", false, "Basic"),
        title: text("Title", "A list of all users", "Basic"),
        multiActions: boolean("Multi actions", false, "Basic"),

        setPage: page => {
            console.log(`Implement setPage method (selected ${page}).`);
        },
        perPageOptions: array("perPageOptions", [10, 25, 50], ",", "Basic"),
        setPerPage: perPage => {
            console.log(`Implement setPerPage method (selected ${perPage}).`);
        },
        setSorters: sorter => {
            console.log(`Implement setSorters method (selected ${JSON.stringify(sorter)}).`);
        }
    };

    const dataProp = object(
        "Data",
        [
            {
                id: "A",
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@webiny.com"
            },
            {
                id: "B",
                firstName: "Jane",
                lastName: "Doe",
                email: "jane.doe@webiny.com"
            },
            {
                id: "C",
                firstName: "Foo",
                lastName: "Bar",
                email: "foo.bar@webiny.com"
            }
        ],
        "Data"
    );

    const metaProp = object(
        "Meta",
        {
            totalPages: 1,
            totalCount: 3,
            from: 1,
            to: 3,
            previousPage: null,
            nextPage: null
        },
        "Meta"
    );

    const sortersProp = {
        list: object(
            "Sorters",
            [
                {
                    label: "Newest to oldest",
                    sorters: { createdOn: -1 }
                },
                {
                    label: "Oldest to newest",
                    sorters: { createdOn: 1 }
                },
                {
                    label: "Name A-Z",
                    sorters: { name: 1 }
                },
                {
                    label: "Name Z-A",
                    sorters: { name: -1 }
                }
            ],
            "Sorters"
        )
    };

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>

            <StorySandbox>
                <StorySandboxExample>
                    <DataList
                        {...generalOptionsAndCallbacks}
                        data={dataProp}
                        meta={metaProp}
                        sorters={sortersProp.list}
                    >
                        {({ data }) => (
                            <List>
                                {data.map(item => (
                                    <ListItem key={item.id}>
                                        <ListItemGraphic>
                                            <img src={"http://i.pravatar.cc/100?id=" + item.id} />
                                        </ListItemGraphic>
                                        <ListItemText>
                                            {item.firstName} {item.lastName}
                                            <ListItemTextSecondary>
                                                {item.email}
                                            </ListItemTextSecondary>
                                        </ListItemText>
                                        <ListItemMeta>
                                            <DeleteIcon
                                                onClick={() => {
                                                    console.log("Redirect user to form.");
                                                }}
                                            />
                                            <EditIcon
                                                onClick={() => {
                                                    console.log("Show confirmation dialog.");
                                                }}
                                            />
                                        </ListItemMeta>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </DataList>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                        <DataList
                        {...generalOptionsAndCallbacks}
                        data={${JSON.stringify(dataProp, null, 2)}}
                        meta={${JSON.stringify(metaProp, null, 2)}}
                        sorters={${JSON.stringify(sortersProp.list, null, 2)}}
                    >
                      {({ data }) => (
                            <List>
                                {data.map(item => (
                                    <ListItem key={item.id}>
                                        <ListItemGraphic>
                                            <img
                                                src={
                                                    "//www.gravatar.com/avatar/" +
                                                    item.gravatar +
                                                    "?s=48"
                                                }
                                            />
                                        </ListItemGraphic>
                                        <ListItemText>
                                            {item.firstName} {item.lastName}
                                            <ListItemTextSecondary>
                                                {item.email}
                                            </ListItemTextSecondary>
                                        </ListItemText>
                                        <ListItemMeta>
                                                <DeleteIcon
                                                    onClick={() => {
                                                        console.log("Redirect user to form.");
                                                    }}
                                                />
                                                <EditIcon
                                                    onClick={() => {
                                                        console.log("Show confirmation dialog.");
                                                    }}
                                                />
                                        </ListItemMeta>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </DataList>
                    `}
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
