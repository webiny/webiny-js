import * as React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "@webiny/storybook-utils/Story";
import readme from "./../Tabs/README.md";

import { ReactComponent as DeleteIcon } from "./svg/baseline-delete-24px.svg";
import { ReactComponent as DoneIcon } from "./svg/baseline-done-24px.svg";
import { withKnobs } from "@storybook/addon-knobs";
import { Tabs, Tab } from "./index";

const story = storiesOf("Components/Tabs", module);

story.addDecorator(withKnobs);
story.add(
    "usage",
    () => {
        const Div = props => {
            return <div style={{ padding: 50 }}>{props.children}</div>;
        };

        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox title={"Tabs example"}>
                    <StorySandboxExample>
                        <div style={{ overflow: "hidden" }}>
                            <Tabs>
                                <Tab label="Tab 1" icon={<DeleteIcon />}>
                                    <Div>Tab 1 content.</Div>
                                </Tab>
                                <Tab label="Tab 2" icon={<DoneIcon />}>
                                    <Div>Tab 2 content.</Div>
                                </Tab>
                                <Tab label="Tab 3">
                                    <Div>Tab 3 content - header without icon.</Div>
                                </Tab>
                                <Tab icon={<DoneIcon />}>
                                    <Div>Tab 4 content - header without label.</Div>
                                </Tab>
                            </Tabs>
                        </div>
                    </StorySandboxExample>
                    <StorySandboxCode>
                        {`
                            <Tabs>
                                <Tab label="Tab 1" icon={<DeleteIcon />}>
                                    <Div>Tab 1 content.</Div>
                                </Tab>
                                <Tab label="Tab 2" icon={<DoneIcon />}>
                                    <Div>Tab 2 content.</Div>
                                </Tab>
                                <Tab label="Tab 3">
                                    <Div>Tab 3 content - header without icon.</Div>
                                </Tab>
                                <Tab icon={<DoneIcon />}>
                                    <Div>Tab 4 content - header without label.</Div>
                                </Tab>
                            </Tabs>
                        `}
                    </StorySandboxCode>
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [Tabs, Tab] } }
);
