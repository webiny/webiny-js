import * as React from "react";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import Input from "../components/Input";
import ButtonPrimary from "../components/ButtonPrimary";
import { Content, Header, Row, Loading, Alert } from "../components/Layout";

const SignIn = ({ signIn, error, authProps, loading }) => {
    return (
        <Form onSubmit={signIn} submitOnEnter>
            {({ Bind, submit }) => (
                <Content>
                    {loading && <Loading />}
                    <Header title="Sign In">
                        <p>
                            Welcome to Webiny.
                            <br />
                            To view the page please sign in using your credentials.
                        </p>
                    </Header>

                    {authProps.message && (
                        <Row>
                            <Alert title={authProps.message.title} type={authProps.message.type}>
                                {authProps.message.text}
                            </Alert>
                        </Row>
                    )}

                    {error && (
                        <Row>
                            <Alert title="Authentication error" type={"danger"}>
                                {error.message}
                            </Alert>
                        </Row>
                    )}

                    <Row>
                        <Bind
                            name="username"
                            validators={validation.create("required,email")}
                            beforeChange={(val, cb) => cb(val.toLowerCase())}
                        >
                            <Input label={"Your e-mail"} outlined={true} />
                        </Bind>
                    </Row>
                    <Row>
                        <Bind name="password" validators={validation.create("required,password")}>
                            <Input type={"password"} label={"Your password"} outlined={true} />
                        </Bind>
                    </Row>
                    <Row alignRight>
                        <ButtonPrimary onClick={submit}>Submit</ButtonPrimary>
                    </Row>
                    <Row alignCenter>
                        <a href="#" onClick={() => authProps.changeState("forgotPassword")}>
                            Forgot password?
                        </a>
                    </Row>
                </Content>
            )}
        </Form>
    );
};

export default SignIn;
