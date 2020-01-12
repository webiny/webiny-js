import React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "@webiny/storybook-utils/Story";
import readme from "./AutoCompleteReadme.md";

import { Form } from "@webiny/form";
import { AutoComplete } from "./AutoComplete";

const story = storiesOf("Components/AutoComplete", module);

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

story.add(
    "AutoComplete",
    () => {
        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox>
                    <StorySandboxExample title={"Single value"}>
                        <Form data={{ country: { id: "italy", name: "Italy" } }}>
                            {({ Bind }) => (
                                <Bind name="country">
                                    <AutoComplete
                                        options={options}
                                        label="Country"
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
                                        useSimpleValues
                                        options={["France", "Germany", "Italy", "Spain"]}
                                        label="Country"
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
                                    useSimpleValues
                                    options={["France", "Germany", "Italy", "Spain"]}
                                    label="Country"
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
    },
    { info: { propTables: [AutoComplete] } }
);
