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
import { withKnobs, boolean } from "@storybook/addon-knobs";
import readme from "./README_Checkbox.md";

import { Form } from "@webiny/form";

// $FlowFixMe
import Checkbox, { PropsType } from "./Checkbox";

const story = storiesOf("Components/Checkbox", module);
story.addDecorator(withKnobs);

story.add("usage - single", () => {
    const disabled = boolean("Disabled", false);

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample title={"Simple checkbox with a label and description"}>
                    <Form>
                        {({ Bind }) => (
                            <Bind name="rememberMe">
                                <Checkbox
                                    label={"Remember me"}
                                    disabled={disabled}
                                    description={"You won't be logged out after you leave the app."}
                                />
                            </Bind>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                    <Form>
                        {({ Bind }) => (
                            <Bind name="rememberMe">
                                  <Checkbox
                                    label={"Remember me"}
                                    disabled={disabled}
                                    description={"You won't be logged out after you leave the app."}
                                />
                            </Bind>
                        )}
                    </Form>
                    `}
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
