// @flow
import * as React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StoryProps,
    StorySandbox,
    StorySandboxCode,
    StorySandboxExample
} from "webiny-storybook-utils/Story";
import readme from "./../ColorPicker/README.md";
import { Form } from "webiny-form";
import { withKnobs, boolean } from "@storybook/addon-knobs";

// $FlowFixMe
import { ColorPicker, PropsType } from "./ColorPicker";

const story = storiesOf("Components/ColorPicker", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    const disable = boolean("disable", false);

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample>
                    <Form data={{ color: "#80ff00" }}>
                        {({ Bind }) => (
                            <Bind name="color">
                                <ColorPicker
                                    label={"Header background color"}
                                    disable={disable}
                                    description={"A simple background color in the header section."}
                                />
                            </Bind>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                       <Form>
                        {({ Bind }) => (
                            <Bind name="color">
                                <ColorPicker disable={${disable}} />
                            </Bind>
                        )}
                    </Form>
                    `}
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
