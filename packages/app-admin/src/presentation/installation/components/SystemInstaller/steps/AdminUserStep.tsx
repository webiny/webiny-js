import React from "react";
import { Button, Grid, Input } from "@webiny/admin-ui";
import { Bind, Form, useForm } from "@webiny/form";
import { validation } from "@webiny/validation";
import { Center } from "./Center.js";
import { Container } from "./Container.js";
import type { ISystemInstallerPresenter } from "~/presentation/installation/presenters/SystemInstaller/abstractions.js";
import { usePasswordValidator } from "./AdminUserStep/usePasswordValidator.js";

interface StepProps {
    nextStep: ISystemInstallerPresenter["nextStep"];
}

export const AdminUserStep = ({ nextStep }: StepProps) => {
    return (
        <Container
            title={"Admin account"}
            message={"This is the account you’ll use to access and manage your Webiny instance."}
        >
            <Center>
                <div style={{ width: 400 }}>
                    <Form onSubmit={data => nextStep(data)}>{() => <AdminUserInputs />}</Form>
                </div>
            </Center>
        </Container>
    );
};

const AdminUserInputs = () => {
    const form = useForm();
    const passwordValidator = usePasswordValidator();

    return (
        <Grid>
            <Grid.Column span={6}>
                <Bind name={"Cognito.firstName"} validators={validation.create("required")}>
                    <Input label={"First name"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={6}>
                <Bind name={"Cognito.lastName"} validators={validation.create("required")}>
                    <Input label={"Last name"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind
                    name={"Cognito.email"}
                    beforeChange={(value: string, cb) => cb(value.toLowerCase())}
                    validators={validation.create("required,email")}
                >
                    <Input label={"Your email"} autoComplete={"new-password"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind
                    name={"Cognito.password"}
                    validators={[passwordValidator, validation.create("required")]}
                >
                    <Input
                        label={"Choose password"}
                        type={"password"}
                        autoComplete={"new-password"}
                    />
                </Bind>
            </Grid.Column>

            <Grid.Column span={12}>
                <Button
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
