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
} from "@webiny/storybook-utils/Story";
import { withKnobs, boolean } from "@storybook/addon-knobs";
import readme from "./README.md";

import { Form } from "@webiny/form";
import { Radio, RadioGroup } from ".";

// $FlowFixMe
import { PropsType } from "./RadioGroup";

const story = storiesOf("Components/Radio", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    const disabled = boolean("Disabled", false);

    const options = [
        { id: "apple", name: "Apple" },
        { id: "pear", name: "Pear" },
        { id: "orange", name: "Orange" }
    ];

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample title={"Simple radio with label and description"}>
                    <Form model={{ fruits: "pear" }}>
                        {({ Bind }) => (
                            <Bind name="fruits">
                                <RadioGroup
                                    label="Fruit selection"
                                    description={"Choose fruit you like the most."}
                                >
                                    {({ onChange, getValue }) => (
                                        <React.Fragment>
                                            {options.map(({ id, name }) => (
                                                <Radio
                                                    disabled={disabled}
                                                    key={id}
                                                    label={name}
                                                    value={getValue(id)}
                                                    onChange={onChange(id)}
                                                />
                                            ))}
                                        </React.Fragment>
                                    )}
                                </RadioGroup>
                            </Bind>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                     <Form model={{fruits: ['pear']}}>
                        {({ Bind }) => (
                            <Bind name="fruits">
                                <RadioGroup
                                    label="Fruits selection"
                                    description={"Choose only fruits you like."}
                                >
                                    {({ onChange, getValue }) => (
                                        <React.Fragment>
                                            {options.map(({id, name}) => (
                                                <Radio
                                                    disabled={disabled}
                                                    key={id}
                                                    label={name}
                                                    value={getValue(id)}
                                                    onChange={onChange(id)}
                                                />
                                            ))}
                                        </React.Fragment>
                                    )}
                                </RadioGroup>
                            </Bind>
                        )}
                    </Form>
                    `}
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
