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

import { Alert } from "./Alert";

const story = storiesOf("Components/Alert", module);

story.add(
    "usage",
    () => {
        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox>
                    <StorySandboxExample title={"Info"}>
                        <Alert title={"Something went wrong!"} type={"info"}>
                            We failed to fetch your data.
                        </Alert>
                    </StorySandboxExample>
                    <StorySandboxCode>
                        <Alert title={"Something went wrong!"} type={"info"}>
                            We failed to fetch your data.
                        </Alert>
                    </StorySandboxCode>
                </StorySandbox>
                <StorySandbox>
                    <StorySandboxExample title={"Danger"}>
                        <Alert title={"Something went wrong!"} type={"danger"}>
                            Please contact support!
                        </Alert>
                    </StorySandboxExample>
                    <StorySandboxCode>
                        <Alert title={"Something went wrong!"} type={"danger"}>
                            Please contact support!
                        </Alert>
                    </StorySandboxCode>
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [Alert] } }
);
