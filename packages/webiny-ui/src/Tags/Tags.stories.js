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
import { withKnobs, boolean } from "@storybook/addon-knobs";
import readme from "./README.md";

import { Form } from "webiny-form";

// $FlowFixMe
import { Tags, PropsType } from "./Tags";

const story = storiesOf("Components/Tags", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    const disabled = boolean("Disabled", false);

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample title={"Single value"}>
                    <Form data={{ tags: ["animals", "dogs", "food"] }}>
                        {({ Bind }) => (
                            <Bind name="tags">
                                <Tags
                                    label="Tags"
                                    disabled={disabled}
                                    description="Choose your tags"
                                />
                            </Bind>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                     <Form data={{ tags: ['animals', 'dogs', 'food'] }}>
                        {({ Bind }) => (
                            <Bind name="tags">
                                <Tags
                                    label="Tags"
                                    disabled={disabled}
                                    description="Choose your tags"
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
