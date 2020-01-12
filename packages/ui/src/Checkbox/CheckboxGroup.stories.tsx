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
import readme from "./README_CheckboxGroup.md";

import { Form } from "@webiny/form";
import { Checkbox, CheckboxGroup } from ".";

const story = storiesOf("Components/Checkbox", module);
story.addDecorator(withKnobs);

story.add(
    "usage - group",
    () => {
        const disabled = boolean("Disabled", false);

        const options = [
            { id: "apple", name: "Apple" },
            { id: "pear", name: "Pear" },
            { id: "orange", name: "Orange" }
        ];

        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox>
                    <StorySandboxExample title={"Simple checkbox with label and description"}>
                        <Form data={{ fruits: ["pear"] }}>
                            {({ Bind }) => (
                                <Bind name="fruits">
                                    <CheckboxGroup
                                        label="Fruits selection"
                                        description={"Choose only fruits you like."}
                                    >
                                        {({ onChange, getValue }) => (
                                            <React.Fragment>
                                                {options.map(({ id, name }) => (
                                                    <Checkbox
                                                        disabled={disabled}
                                                        key={id}
                                                        label={name}
                                                        value={getValue(id)}
                                                        onChange={onChange(id)}
                                                    />
                                                ))}
                                            </React.Fragment>
                                        )}
                                    </CheckboxGroup>
                                </Bind>
                            )}
                        </Form>
                    </StorySandboxExample>
                    <StorySandboxCode>
                        {`
                     <Form data={{fruits: ['pear']}}>
                        {({ Bind }) => (
                            <Bind name="fruits">
                                <CheckboxGroup
                                    label="Fruits selection"
                                    description={"Choose only fruits you like."}
                                >
                                    {({ onChange, getValue }) => (
                                        <React.Fragment>
                                            {options.map(({id, name}) => (
                                                <Checkbox
                                                    disabled={disabled}
                                                    key={id}
                                                    label={name}
                                                    value={getValue(id)}
                                                    onChange={onChange(id)}
                                                />
                                            ))}
                                        </React.Fragment>
                                    )}
                                </CheckboxGroup>
                            </Bind>
                        )}
                    </Form>
                    `}
                    </StorySandboxCode>
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [CheckboxGroup] } }
);
