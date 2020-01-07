import React from "react";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import Input from "../components/Input";
import ButtonPrimary from "../components/ButtonPrimary";
import { Content, Header, Row, Loading, Alert } from "../components/Layout";

const SetNewPassword = ({ setPassword, error, loading, authProps }) => {
    return (
        <Form onSubmit={setPassword} submitOnEnter>
            {({ Bind, submit, data }) => {
                const retypePasswordValidator = value => {
                    if (value !== data.password) {
                        throw Error("Passwords do not match!");
                    }
                };

                return (
                    <Content>
                        {loading && <Loading />}
                        <Header title="Set new password" />

                        {error && <Alert title="Something went wrong">{error}</Alert>}

                        <Row>
                            <Bind name="code" validators={validation.create("required")}>
                                <Input
                                    autoComplete={false}
                                    label={"Password reset code"}
                                    description={"Enter the code we sent to your email."}
                                />
                            </Bind>
                        </Row>
                        <Row>
                            <Bind
                                name="password"
                                validators={validation.create("required,password")}
                            >
                                <Input
                                    autoComplete={false}
                                    type={"password"}
                                    label={"New password"}
                                    description={"Enter your new password."}
                                />
                            </Bind>
                        </Row>
                        <Row>
                            <Bind
                                name="retypePassword"
                                validators={[
                                    validation.create("required"),
                                    retypePasswordValidator
                                ]}
                            >
                                <Input
                                    type={"password"}
                                    label={"Retype password"}
                                    description={"Enter your new password once more."}
                                />
                            </Bind>
                        </Row>
                        <Row alignRight>
                            <ButtonPrimary onClick={submit}>
                                {"Set new password"}
                            </ButtonPrimary>
                        </Row>
                        <Row alignCenter>
                            Want to sign in? {/* eslint-disable-next-line */}
                            <a href={"#"} onClick={() => authProps.changeState("signIn")}>
                                Sign in
                            </a>
                        </Row>
                    </Content>
                );
            }}
        </Form>
    );
};

export default SetNewPassword;
