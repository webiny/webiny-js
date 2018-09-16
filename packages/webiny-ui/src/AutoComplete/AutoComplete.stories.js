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
import { AutoComplete, PropsType } from "./AutoComplete";

const story = storiesOf("Components/AutoComplete", module);
story.addDecorator(withKnobs);

const options = [
    { name: "France", id: "france" },
    { name: "Germany", id: "germany" },
    { name: "Italy", id: "italy" },
    { name: "Spain", id: "spain" },
    { name: "UK", id: "uk" },
    { name: "US", id: "us" },
    { name: "Norway", id: "norway" },
    { name: "Finland", id: "finland" },
    { name: "Czech Republic", id: "czech-republic" }
];

story.add("usage", () => {
    const disabled = boolean("Disabled", false);

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample title={"Auto complete - single value"}>
                    <Form data={{ country: { id: "italy", name: "Italy" } }}>
                        {({ Bind }) => (
                            <Bind name="country">
                                <AutoComplete
                                    options={options}
                                    label="Country"
                                    disabled={disabled}
                                    description="Choose your country"
                                />
                            </Bind>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                    <Form>
                        {({ Bind }) => (
                             <Bind name="country">
                                <AutoComplete
                                    options={${JSON.stringify(options)}}
                                    label="Country"
                                    disabled={${disabled}}
                                    description="Choose your country."
                                />
                            </Bind>
                        )}
                    </Form>
                    `}
                </StorySandboxCode>
            </StorySandbox>

            <StorySandbox>
                <StorySandboxExample title={"Auto complete - multiple values"}>
                    <Form
                        data={{
                            country: [{ id: "uk", name: "UK" }, { id: "italy", name: "Italy" }]
                        }}
                    >
                        {({ Bind }) => (
                            <Bind name="country">
                                <AutoComplete
                                    options={options}
                                    label="Country"
                                    multiple
                                    disabled={disabled}
                                    description="Choose one or more countries."
                                />
                            </Bind>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                        <Form>
                            {({ Bind }) => (
                                 <Bind name="country">
                                    <AutoComplete
                                        options={${JSON.stringify(options)}}
                                        label="Country"
                                        multiple
                                        disabled={${disabled}}
                                        description="Choose one or more countries."
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
