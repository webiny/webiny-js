// @flow
import * as React from "react";
import { storiesOf } from "@storybook/react";
import Story from "webiny-storybook-utils/Story";
import { withKnobs, boolean } from "@storybook/addon-knobs";
import readme from "./README.md";

import { Form } from "webiny-form";
import Radio from "./Radio";

// $FlowFixMe
import { PropsType } from "./RadioGroup";

const story = storiesOf("Components/Radio", module);
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
                <Story.Sandbox.Example title={"Simple radio with label and description"}>
                    <Form model={{ fruits: "pear" }}>
                        {({ Bind }) => (
                            <Bind name="fruits">
                                <Radio.Group
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
                                </Radio.Group>
                            </Bind>
                        )}
                    </Form>
                </Story.Sandbox.Example>
                <Story.Sandbox.Code>
                    {`
                     <Form model={{fruits: ['pear']}}>
                        {({ Bind }) => (
                            <Bind name="fruits">
                                <Radio.Group
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
                                </Radio.Group>
                            </Bind>
                        )}
                    </Form>
                    `}
                </Story.Sandbox.Code>
            </Story.Sandbox>
        </Story>
    );
});
