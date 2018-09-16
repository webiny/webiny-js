// @flow
import * as React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StoryProps,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "webiny-storybook-utils/Story";
import readme from "./README.md";

// $FlowFixMe
import { PropsType, Accordion } from "./Accordion";

// $FlowFixMe
import { PropsType as ItemProps, AccordionItem } from "./AccordionItem";

import { ReactComponent as SettingsIcon } from "./icons/round-settings-24px.svg";

const story = storiesOf("Components/Accordion", module);

story.add("usage", () => {
    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps title="`Accordion` props">{PropsType}</StoryProps>
            <StoryProps title="`AccordionItem` props">{ItemProps}</StoryProps>

            <StorySandbox title={"Accordion"}>
                <StorySandboxExample>
                    <Accordion>
                        <AccordionItem
                            icon={<SettingsIcon />}
                            title="Settings 1"
                            description="Settings description"
                        >
                            <div>Inner child 1</div>
                        </AccordionItem>
                        <AccordionItem
                            icon={<SettingsIcon />}
                            title="Settings 2"
                            description="Settings description"
                        >
                            <div>Inner child 2</div>
                        </AccordionItem>
                        <AccordionItem
                            icon={<SettingsIcon />}
                            title="Settings 3"
                            description="Settings description"
                        >
                            <div>Inner child 3</div>
                        </AccordionItem>
                    </Accordion>
                </StorySandboxExample>
                <StorySandboxCode>
                    <div>
                        <Accordion>
                            <AccordionItem
                                icon={<SettingsIcon />}
                                title="Settings 1"
                                description="Settings description"
                            >
                                <div>Inner child 1</div>
                            </AccordionItem>
                            <AccordionItem
                                icon={<SettingsIcon />}
                                title="Settings 2"
                                description="Settings description"
                            >
                                <div>Inner child 2</div>
                            </AccordionItem>
                            <AccordionItem
                                icon={<SettingsIcon />}
                                title="Settings 3"
                                description="Settings description"
                            >
                                <div>Inner child 3</div>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
