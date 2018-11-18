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
import readme from "./MultiAutoCompleteReadme.md";

import { Form } from "webiny-form";

// $FlowFixMe
import { MultiAutoComplete, PropsType } from "./MultiAutoComplete";

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

story.add("MultiAutoComplete", () => {
    const disabled = boolean("Disabled", false);

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample title={"Values as objects"}>
                    <Form
                        data={{
                            country: [{ id: "uk", name: "UK" }, { id: "italy", name: "Italy" }]
                        }}
                    >
                        {({ Bind }) => (
                            <Bind name="country">
                                <MultiAutoComplete
                                    options={options}
                                    label="Country"
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
                                    <MultiAutoComplete
                                        options={${JSON.stringify(options)}}
                                        label="Country"
                                        disabled={${disabled}}
                                        description="Choose one or more countries."
                                    />
                                </Bind>
                            )}
                        </Form>
                    `}
                </StorySandboxCode>
            </StorySandbox>

            <StorySandbox>
                <StorySandboxExample title={"Values as strings"}>
                    <Form data={{ country: ["Italy", "France"] }}>
                        {({ Bind }) => (
                            <Bind name="country">
                                <MultiAutoComplete
                                    useSimpleValue
                                    options={options.map(item => item.name)}
                                    label="Country"
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
                                    <MultiAutoComplete
                                        useSimpleValue
                                        options={${JSON.stringify(options)}}
                                        label="Country"
                                        disabled={${disabled}}
                                        description="Choose one or more countries."
                                    />
                                </Bind>
                            )}
                        </Form>
                    `}
                </StorySandboxCode>
            </StorySandbox>

            <StorySandbox>
                <StorySandboxExample title={"Allow free input"}>
                    <Form
                        data={{
                            country: [
                                { id: "anotherCountry", name: "Another Country" },
                                { id: "nowhere", name: "Nowhere" },
                                { id: "france", name: "France" }
                            ]
                        }}
                    >
                        {({ Bind }) => (
                            <Bind name="country">
                                <MultiAutoComplete
                                    allowFreeInput
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
                    <Form data={{ country: { id: "anotherCountry", name: "Another Country" } }}>
                        {({ Bind }) => (
                            <Bind name="country">
                                <MultiAutoComplete
                                    useSimpleValue
                                    options={${JSON.stringify(options)}}
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

            <StorySandbox>
                <StorySandboxExample title={"Allow free input (values as strings)"}>
                    <Form
                        data={{
                            country: ["Another Country", "Nowhere", "France"]
                        }}
                    >
                        {({ Bind }) => (
                            <Bind name="country">
                                <MultiAutoComplete
                                    useSimpleValue
                                    allowFreeInput
                                    options={options.map(item => item.name)}
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
                  <Form
                        data={{
                            country: ["Another Country", "Nowhere", "France"]
                        }}
                    >
                        {({ Bind }) => (
                            <Bind name="country">
                                <MultiAutoComplete
                                    useSimpleValue
                                    allowFreeInput
                                    options={options.map(item => item.name)}
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
