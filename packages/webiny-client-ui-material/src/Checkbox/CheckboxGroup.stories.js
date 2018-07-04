// @flow
import * as React from "react";
import { storiesOf } from "@storybook/react";
import Story from "webiny-storybook-utils/Story";
import { withKnobs, boolean } from "@storybook/addon-knobs";
import readme from "./README_CheckboxGroup.md";

import { Form } from "webiny-form";
import Checkbox from "./Checkbox";

// $FlowFixMe
import { PropsType } from "./CheckboxGroup";

const story = storiesOf("Components/Checkbox", module);
story.addDecorator(withKnobs);

story.add("group", () => {
    const disabled = boolean("Disabled", false);

    const options = [
        { id: "apple", name: "Apple" },
        { id: "pear", name: "Pear" },
        { id: "orange", name: "Orange" }
    ];

    return (
        <Story>
            <Story.Readme>{readme}</Story.Readme>
            <Story.Props>{PropsType}</Story.Props>
            <Story.Sandbox>
                <Story.Sandbox.Example title={"Simple checkbox with label and description"}>
                    <Form model={{ fruits: ["pear"] }}>
                        {({ Bind }) => (
                            <Bind name="fruits">
                                <Checkbox.Group
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
                                </Checkbox.Group>
                            </Bind>
                        )}
                    </Form>
                </Story.Sandbox.Example>
                <Story.Sandbox.Code>
                    {`
                     <Form model={{fruits: ['pear']}}>
                        {({ Bind }) => (
                            <Bind name="fruits">
                                <Checkbox.Group
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
                                </Checkbox.Group>
                            </Bind>
                        )}
                    </Form>
                    `}
                </Story.Sandbox.Code>
            </Story.Sandbox>
        </Story>
    );
});
