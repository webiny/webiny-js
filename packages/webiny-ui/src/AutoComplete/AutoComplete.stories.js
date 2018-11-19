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
import readme from "./AutoCompleteReadme.md";

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

story.add("AutoComplete", () => {
    const disabled = boolean("Disabled", false);

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample title={"Single value"}>
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
                <StorySandboxExample title={"Single value - use simple strings"}>
                    <Form data={{ country: "Germany" }}>
                        {({ Bind }) => (
                            <Bind name="country">
                                <AutoComplete
                                    useSimpleValue
                                    options={["France", "Germany", "Italy", "Spain"]}
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
                    <Form data={{ country: "Germany" }}>
                        {({ Bind }) => (
                            <Bind name="country">
                                <AutoComplete
                                    useSimpleValue
                                    options={["France", "Germany", "Italy", "Spain"]}
                                    label="Country"
                                    disabled={disabled}
                                    description="Choose your country"
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
