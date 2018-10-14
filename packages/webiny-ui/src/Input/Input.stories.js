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
} from "webiny-storybook-utils/Story";
import { withKnobs, boolean } from "@storybook/addon-knobs";
import readme from "./../Input/README.md";
import { ReactComponent as AutoRenewIcon } from "./svg/baseline-autorenew-24px.svg";
import { ReactComponent as CloudDoneIcon } from "./svg/baseline-cloud_done-24px.svg";
import { ReactComponent as BaselineDeleteIcon } from "./svg/baseline-delete-24px.svg";
import { ReactComponent as BaselineDoneIcon } from "./svg/baseline-done-24px.svg";

import { Form } from "webiny-form";

// $FlowFixMe
import { Input, PropsType } from "./Input";

const story = storiesOf("Components/Input", module);
story.addDecorator(withKnobs);

story.add("usage", () => {
    const bindProps = {
        name: "name",
        validators: ["required", "minLength:3"],
        validationMessages: { minLength: "Please enter more characters" }
    };

    const disabled = boolean("Disabled", false);

    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox>
                <StorySandboxExample title={"Label, description and validation"}>
                    <Form>
                        {({ Bind }) => (
                            <Bind {...bindProps}>
                                <Input
                                    label={"Your name"}
                                    disabled={disabled}
                                    description={"This is your profile name"}
                                />
                            </Bind>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                    <Form>
                        {({ Bind }) => (
                            <Bind
                                name="name"
                                validators={["required", "minLength:3"]}
                                validationMessages={{ minLength: "Please enter more characters" }}>
                                <Input label={"Your name"} disabled={${disabled}} description={"This is your profile name"}/>
                            </Bind>
                        )}
                    </Form>
                    `}
                </StorySandboxCode>
            </StorySandbox>
            <StorySandbox>
                <StorySandboxExample title={"With icon (box)"}>
                    <Form>
                        {({ Bind }) => (
                            <React.Fragment>
                                <Bind name="phone">
                                    <Input
                                        leadingIcon={<AutoRenewIcon/>}
                                        label={"Your phone number"}
                                        description={"Please enter a real number"}
                                        disabled={disabled}
                                    />
                                </Bind>
                                <Bind name="mobile">
                                    <Input
                                        trailingIcon={<CloudDoneIcon />}
                                        label={"Your mobile number"}
                                        description={"An SMS will be sent to this number"}
                                        disabled={disabled}
                                    />
                                </Bind>
                            </React.Fragment>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                    <Form>
                        {({ Bind }) => (
                            <React.Fragment>
                                <Bind name="phone">
                                    <Input
                                        leadingIcon={<AutoRenewIcon />}
                                        label={"Your phone number"}
                                        description={"Please enter a real number"}
                                        disabled={${disabled}}
                                    />
                                </Bind>
                                <Bind name="mobile">
                                    <Input
                                        trailingIcon={<CloudDoneIcon />}
                                        label={"Your mobile number"}
                                        description={"An SMS will be sent to this number"}
                                        disabled={${disabled}}
                                    />
                                </Bind>
                            </React.Fragment>
                        )}
                    </Form>
                    `}
                </StorySandboxCode>
            </StorySandbox>
            <StorySandbox>
                <StorySandboxExample title={"With icon (outlined)"}>
                    <Form>
                        {({ Bind }) => (
                            <React.Fragment>
                                <Bind name="phone">
                                    <Input
                                        outlined
                                        leadingIcon={<BaselineDeleteIcon />}
                                        label={"Your phone number"}
                                        description={"Please enter a real number"}
                                        disabled={disabled}
                                    />
                                </Bind>
                                <Bind name="mobile">
                                    <Input
                                        outlined
                                        trailingIcon={<BaselineDoneIcon />}
                                        label={"Your mobile number"}
                                        description={"An SMS will be sent to this number"}
                                        disabled={disabled}
                                    />
                                </Bind>
                            </React.Fragment>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                    <Form>
                        {({ Bind }) => (
                            <React.Fragment>
                                <Bind name="phone">
                                    <Input
                                        outlined
                                        leadingIcon={<BaselineDeleteIcon />}
                                        label={"Your phone number"}
                                        description={"Please enter a real number"}
                                        disabled={${disabled}}
                                    />
                                </Bind>
                                <Bind name="mobile">
                                    <Input
                                        outlined
                                        trailingIcon={<BaselineDoneIcon />}
                                        label={"Your mobile number"}
                                        description={"An SMS will be sent to this number"}
                                        disabled={${disabled}}
                                    />
                                </Bind>
                            </React.Fragment>
                        )}
                    </Form>
                    `}
                </StorySandboxCode>
            </StorySandbox>
            <StorySandbox>
                <StorySandboxExample title={"Full width"}>
                    <Form>
                        {({ Bind }) => (
                            <Bind {...bindProps}>
                                <Input placeholder={"Your name"} fullwidth disabled={disabled} />
                            </Bind>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                    <Form>
                        {({ Bind }) => (
                            <Bind
                                name="name"
                                validators={["required", "minLength:3"]}
                                validationMessages={{ minLength: "Please enter more characters" }}>
                                <Input placeholder={"Your name"} fullwidth disabled={${disabled}}/>
                            </Bind>
                        )}
                    </Form>
                    `}
                </StorySandboxCode>
            </StorySandbox>
            <StorySandbox>
                <StorySandboxExample title={"Textarea"}>
                    <Form>
                        {({ Bind }) => (
                            <React.Fragment>
                                <Bind name="info">
                                    <Input
                                        rows={6}
                                        placeholder={"Tell us something..."}
                                        description={"Just a little bit about yourself."}
                                        disabled={disabled}
                                    />
                                </Bind>
                                <Bind name="description">
                                    <Input
                                        fullwidth
                                        rows={6}
                                        placeholder={"How's the weather today?"}
                                        description={"We actually need to know."}
                                        disabled={disabled}
                                    />
                                </Bind>
                            </React.Fragment>
                        )}
                    </Form>
                </StorySandboxExample>
                <StorySandboxCode>
                    {`
                    <Form>
                        {({ Bind }) => (
                            <React.Fragment>
                                <Bind name="info">
                                    <Input
                                        rows={6}
                                        placeholder={"Tell us something..."}
                                        description={"Just a little bit about yourself."}
                                        disabled={${disabled}}
                                    />
                                </Bind>
                                <Bind name="description">
                                    <Input
                                        fullwidth
                                        rows={6}
                                        placeholder={"How's the weather today?"}
                                        description={"We actually need to know."}
                                        disabled={${disabled}}
                                    />
                                </Bind>
                            </React.Fragment>
                        )}
                    </Form>
                    `}
                </StorySandboxCode>
            </StorySandbox>
        </Story>
    );
});
