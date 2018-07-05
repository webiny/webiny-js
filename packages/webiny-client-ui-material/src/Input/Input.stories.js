// @flow
import * as React from "react";
import { storiesOf } from "@storybook/react";
import Story from "webiny-storybook-utils/Story";
import { withKnobs, boolean } from "@storybook/addon-knobs";
import readme from "./../Input/README.md";

import { Form } from "webiny-form";

// $FlowFixMe
import Input, { PropsType } from "./Input";

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
            <Story.Readme>{readme}</Story.Readme>
            <Story.Props>{PropsType}</Story.Props>
            <Story.Sandbox>
                <Story.Sandbox.Example title={"Label, description and validation"}>
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
                </Story.Sandbox.Example>
                <Story.Sandbox.Code>
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
                </Story.Sandbox.Code>
            </Story.Sandbox>
            <Story.Sandbox>
                <Story.Sandbox.Example title={"With icon (box)"}>
                    <Form>
                        {({ Bind }) => (
                            <React.Fragment>
                                <Bind name="phone">
                                    <Input
                                        leadingIcon={<Input.Icon icon={"phone-volume"} />}
                                        label={"Your phone number"}
                                        description={"Please enter a real number"}
                                        disabled={disabled}
                                    />
                                </Bind>
                                <Bind name="mobile">
                                    <Input
                                        trailingIcon={<Input.Icon icon={"mobile-alt"} />}
                                        label={"Your mobile number"}
                                        description={"An SMS will be sent to this number"}
                                        disabled={disabled}
                                    />
                                </Bind>
                            </React.Fragment>
                        )}
                    </Form>
                </Story.Sandbox.Example>
                <Story.Sandbox.Code>
                    {`
                    <Form>
                        {({ Bind }) => (
                            <React.Fragment>
                                <Bind name="phone">
                                    <Input
                                        leadingIcon={<Input.Icon icon={"phone-volume"} />}
                                        label={"Your phone number"}
                                        description={"Please enter a real number"}
                                        disabled={${disabled}}
                                    />
                                </Bind>
                                <Bind name="mobile">
                                    <Input
                                        trailingIcon={<Input.Icon icon={"mobile-alt"} />}
                                        label={"Your mobile number"}
                                        description={"An SMS will be sent to this number"}
                                        disabled={${disabled}}
                                    />
                                </Bind>
                            </React.Fragment>
                        )}
                    </Form>
                    `}
                </Story.Sandbox.Code>
            </Story.Sandbox>
            <Story.Sandbox>
                <Story.Sandbox.Example title={"With icon (outlined)"}>
                    <Form>
                        {({ Bind }) => (
                            <React.Fragment>
                                <Bind name="phone">
                                    <Input
                                        outlined
                                        leadingIcon={<Input.Icon icon={"phone-volume"} />}
                                        label={"Your phone number"}
                                        description={"Please enter a real number"}
                                        disabled={disabled}
                                    />
                                </Bind>
                                <Bind name="mobile">
                                    <Input
                                        outlined
                                        trailingIcon={<Input.Icon icon={"mobile-alt"} />}
                                        label={"Your mobile number"}
                                        description={"An SMS will be sent to this number"}
                                        disabled={disabled}
                                    />
                                </Bind>
                            </React.Fragment>
                        )}
                    </Form>
                </Story.Sandbox.Example>
                <Story.Sandbox.Code>
                    {`
                    <Form>
                        {({ Bind }) => (
                            <React.Fragment>
                                <Bind name="phone">
                                    <Input
                                        outlined
                                        leadingIcon={<Input.Icon icon={"phone-volume"} />}
                                        label={"Your phone number"}
                                        description={"Please enter a real number"}
                                        disabled={${disabled}}
                                    />
                                </Bind>
                                <Bind name="mobile">
                                    <Input
                                        outlined
                                        trailingIcon={<Input.Icon icon={"mobile-alt"} />}
                                        label={"Your mobile number"}
                                        description={"An SMS will be sent to this number"}
                                        disabled={${disabled}}
                                    />
                                </Bind>
                            </React.Fragment>
                        )}
                    </Form>
                    `}
                </Story.Sandbox.Code>
            </Story.Sandbox>
            <Story.Sandbox>
                <Story.Sandbox.Example title={"Full width"}>
                    <Form>
                        {({ Bind }) => (
                            <Bind {...bindProps}>
                                <Input placeholder={"Your name"} fullWidth disabled={disabled} />
                            </Bind>
                        )}
                    </Form>
                </Story.Sandbox.Example>
                <Story.Sandbox.Code>
                    {`
                    <Form>
                        {({ Bind }) => (
                            <Bind
                                name="name"
                                validators={["required", "minLength:3"]}
                                validationMessages={{ minLength: "Please enter more characters" }}>
                                <Input placeholder={"Your name"} fullWidth disabled={${disabled}}/>
                            </Bind>
                        )}
                    </Form>
                    `}
                </Story.Sandbox.Code>
            </Story.Sandbox>
            <Story.Sandbox>
                <Story.Sandbox.Example title={"Textarea"}>
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
                                        fullWidth
                                        rows={6}
                                        placeholder={"How's the weather today?"}
                                        description={"We actually need to know."}
                                        disabled={disabled}
                                    />
                                </Bind>
                            </React.Fragment>
                        )}
                    </Form>
                </Story.Sandbox.Example>
                <Story.Sandbox.Code>
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
                                        fullWidth
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
                </Story.Sandbox.Code>
            </Story.Sandbox>
        </Story>
    );
});
