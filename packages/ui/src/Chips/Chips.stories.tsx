import React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "@webiny/storybook-utils/Story";
import readme from "./README.md";

import { ReactComponent as BaselineDoneIcon } from "./icons/baseline-done-24px.svg";
import { ReactComponent as BaselineEmailIcon } from "./icons/baseline-email-24px.svg";
import { Chip, Chips } from "./index";

const story = storiesOf("Components/Chips", module);

story.add(
    "usage",
    () => {
        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox>
                    <StorySandboxExample title={"Simple chips with a label and description"}>
                        <div>
                            <Chips>
                                <Chip selected>Cookies</Chip>
                                <Chip>Pizza</Chip>
                                <Chip>Icecream</Chip>
                            </Chips>

                            <Chips>
<<<<<<< HEAD
                                <Chip icon={<BaselineEmailIcon />}>Cookies</Chip>
                                <Chip trailingIcon icon={<BaselineDoneIcon />}>
                                    Cookies
                                </Chip>
=======
                                <Chip icon={<BaselineEmailIcon />} >Cookies</Chip>
                                <Chip trailingIcon icon={<BaselineDoneIcon />} >Cookies</Chip>
>>>>>>> b12767fcda (fix(ui): rm ChipIcon, responding to review comments)
                            </Chips>
                        </div>
                    </StorySandboxExample>
                    <StorySandboxCode>
                        {`
                         <div>
                            <Chips>
                                <Chip selected>
                                    Cookies
                                </Chip>
                                <Chip>
                                    Pizza
                                </Chip>
                                <Chip>
                                    Icecream
                                </Chip>
                            </Chips>
                            <Chips>
                                <Chip>
                                    <ChipIcon leading icon={<BaselineEmailIcon />} />
                                    Cookies
                                    <ChipIcon trailing icon={<BaselineDoneIcon />} />
                                </Chip>
                            </Chips>
                        </div>
                    `}
                    </StorySandboxCode>
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [Chip, Chips] } }
);
