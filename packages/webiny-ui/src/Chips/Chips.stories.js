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
import readme from "./README.md";

import { ReactComponent as BaselineDoneIcon } from "./icons/baseline-done-24px.svg";
import { ReactComponent as BaselineEmailIcon } from "./icons/baseline-email-24px.svg";

// $FlowFixMe
import { Chip, ChipText, ChipIcon, Chips, PropsType } from "./Chips";

const story = storiesOf("Components/Chips", module);

story.add("usage", () => {
    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample title={"Simple chips with a label and description"}>
                    <div>
                        <Chips>
                            <Chip selected>
                                <ChipText>Cookies</ChipText>
                            </Chip>
                            <Chip>
                                <ChipText>Pizza</ChipText>
                            </Chip>
                            <Chip>
                                <ChipText>Icecream</ChipText>
                            </Chip>
                        </Chips>

                        <Chips>
                            <Chip>
                                <ChipIcon leading icon={<BaselineEmailIcon />} />
                                <ChipText>Cookies</ChipText>
                                <ChipIcon trailing icon={<BaselineDoneIcon />} />
                            </Chip>
                        </Chips>
                    </div>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                         <div>
                            <Chips>
                                <Chip selected>
                                    <ChipText>Cookies</ChipText>
                                </Chip>
                                <Chip>
                                    <ChipText>Pizza</ChipText>
                                </Chip>
                                <Chip>
                                    <ChipText>Icecream</ChipText>
                                </Chip>
                            </Chips>
                            <Chips>
                                <Chip>
                                    <ChipIcon leading icon={<BaselineEmailIcon />} />
                                    <ChipText>Cookies</ChipText>
                                    <ChipIcon trailing icon={<BaselineDoneIcon />} />
                                </Chip>
                            </Chips>
                        </div>
                    `}
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
