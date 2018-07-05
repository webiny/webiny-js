// @flow
import React from "react";
import { storiesOf } from "@storybook/react";
import Story from "webiny-storybook-utils/Story";
import { withKnobs, boolean } from "@storybook/addon-knobs";
import readme from "./README.md";

import { Form } from "webiny-form";

// $FlowFixMe
import Switch, { PropsType } from "./Switch";

const story = storiesOf("Components/Switch", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    const disabled = boolean("Disabled", false);

    return (
        <Story>
            <Story.Readme>{readme}</Story.Readme>
            <Story.Props>{PropsType}</Story.Props>
            <Story.Sandbox>
                <Story.Sandbox.Example title={"Simple switch with a label and description"}>
                    <Form model={{ rememberMe: true }}>
                        {({ Bind }) => (
                            <Bind name="rememberMe">
                                <Switch
                                    label={"Remember me"}
                                    disabled={disabled}
                                    description={"You won't be logged out after you leave the app."}
                                />
                            </Bind>
                        )}
                    </Form>
                </Story.Sandbox.Example>
                <Story.Sandbox.Code>
                    {`
                    <Form>
                        {({ Bind }) => (
                            <Bind name="rememberMe">
                                  <Switch
                                    label={"Remember me"}
                                    disabled={disabled}
                                    description={"You won't be logged out after you leave the app."}
                                />
                            </Bind>
                        )}
                    </Form>
                    `}
                </Story.Sandbox.Code>
            </Story.Sandbox>
        </Story>
    );
});
