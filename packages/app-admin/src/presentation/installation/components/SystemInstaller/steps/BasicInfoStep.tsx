import React from "react";
import { Button, Checkbox, Grid, Input, Select } from "@webiny/admin-ui";
import { Bind, Form, useBind, useForm } from "@webiny/form";
import { validation } from "@webiny/validation";
import { Center } from "./Center.js";
import { Container } from "./Container.js";
import type { ISystemInstallerPresenter } from "~/presentation/installation/presenters/SystemInstaller/abstractions.js";
import { referralSources } from "~/presentation/installation/components/SystemInstaller/steps/referralSources.js";

interface StepProps {
    nextStep: ISystemInstallerPresenter["nextStep"];
}

type ExternalLinkProps = {
    to: string;
    children: React.ReactNode;
};

const ExternalLink = ({ to, children }: ExternalLinkProps) => {
    return (
        <a href={to} target={"_blank"} rel="noreferrer">
            {children}
        </a>
    );
};

export const BasicInfoStep = ({ nextStep }: StepProps) => {
    return (
        <Container
            title={"Basic info"}
            message={
                "To get started, we need some basic information about your project and how you found us."
            }
        >
            <Center>
                <div style={{ width: 400 }}>
                    <Form onSubmit={data => nextStep(data)}>{() => <BasicInfoFormInputs />}</Form>
                </div>
            </Center>
        </Container>
    );
};

const referralOptions = referralSources.map(label => ({ label, value: label }));

const requireChecked = (value: boolean) => {
    if (!value) {
        throw Error(`You must accept our Terms of Service and Privacy Policy.`);
    }
};

const BasicInfoFormInputs = () => {
    const form = useForm();

    const tosBind = useBind({
        name: "basicInfo.termsOfService",
        defaultValue: false,
        validators: requireChecked
    });

    return (
        <Grid>
            <Grid.Column span={12}>
                <Bind name={"basicInfo.projectName"} validators={validation.create("required")}>
                    <Input label={"Project name"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind
                    name={"basicInfo.organizationName"}
                    validators={validation.create("required")}
                >
                    <Input label={"Organization name"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"basicInfo.referralSource"} validators={validation.create("required")}>
                    <Select
                        label={"Where did you hear about Webiny?"}
                        displayResetAction={false}
                        options={referralOptions}
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Checkbox
                    onChange={tosBind.onChange}
                    checked={tosBind.value}
                    label={
                        <>
                            I agree to Webiny’s{" "}
                            <ExternalLink to={"https://www.webiny.com/terms-of-service"}>
                                Terms of Service
                            </ExternalLink>{" "}
                            and{" "}
                            <ExternalLink to={"https://www.webiny.com/privacy-policy"}>
                                Privacy Policy
                            </ExternalLink>
                        </>
                    }
                    validation={tosBind.validation}
                />
            </Grid.Column>
            <Grid.Column span={12}>
                <Button
                    disabled={tosBind.value !== true}
                    containerClassName={"w-full"}
                    className={"w-full"}
                    variant={"primary"}
                    size={"lg"}
                    text={"Next step"}
                    onClick={form.submit}
                />
            </Grid.Column>
        </Grid>
    );
};
