import * as React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "@webiny/storybook-utils/Story";
import { withKnobs, boolean } from "@storybook/addon-knobs";
import readme from "./README.md";

import { Form } from "@webiny/form";
import Slider from "./Slider";

const story = storiesOf("Components/Slider", module);
story.addDecorator(withKnobs);

story.add(
    "usage",
    () => {
        const disabled = boolean("Disabled", false);

        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox>
                    <StorySandboxExample title={"Simple slider with a label and description"}>
                        <Form data={{ width: 200 }}>
                            {({ Bind }) => (
                                <Bind name="width">
                                    {({ value, onChange }) => (
                                        <Slider
                                            label={"Number of rooms:"}
                                            disabled={disabled}
                                            description={
                                                "Choose the number of rooms in your apartment."
                                            }
                                            discrete
                                            displayMarkers
                                            min={1}
                                            max={10}
                                            step={1}
                                            onInput={onChange}
                                            onChange={onChange}
                                            value={value}
                                        />
                                    )}
                                </Bind>
                            )}
                        </Form>
                    </StorySandboxExample>
                    <StorySandboxCode>
                        {`
                     <Form data={{ width: 200 }}>
                        {({ Bind }) => (
                            <Bind name="width">
                                {({ value, onChange }) => (
                                    <Slider
                                        label={"Number of rooms:"}
                                        disabled={disabled}
                                        description={
                                            "Choose the number of rooms in your apartment."
                                        }
                                        discrete
                                        displayMarkers
                                        min={1}
                                        max={10}
                                        step={1}
                                        onInput={onChange}
                                        onChange={onChange}
                                        value={value}
                                    />
                                )}
                            </Bind>
                        )}
                    </Form>
                    `}
                    </StorySandboxCode>
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [Slider] } }
);
