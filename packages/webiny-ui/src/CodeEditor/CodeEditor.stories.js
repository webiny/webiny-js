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
import { withKnobs, text } from "@storybook/addon-knobs";
import readme from "./README.md";
import { Form } from "webiny-form";

// $FlowFixMe
import { CodeEditor, PropsType } from "./CodeEditor";
import "brace/mode/json";
import "brace/theme/github";

const story = storiesOf("Components/CodeEditor", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    const description = text("description", "Type your code here and see it in action.");

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample>
                    <Form data={{ data: `{"foo": "bar"}` }}>
                        {({ Bind }) => (
                            <Bind name="data">
                                <CodeEditor mode="json" theme="github" description={description} />
                            </Bind>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                        <Form data={{ data: \`{"foo": "bar"}\` }}>
                        {({ Bind }) => (
                            <Bind name="data">
                                 <CodeEditor
                                    mode="json"
                                    theme="github"
                                    description={"${description}"}
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
