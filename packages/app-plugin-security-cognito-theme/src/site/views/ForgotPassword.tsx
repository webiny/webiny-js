import React from "react";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import Input from "../components/Input";
import ButtonPrimary from "../components/ButtonPrimary";
import ButtonDefault from "../components/ButtonDefault";
import { Content, Header, Row, Loading, Alert } from "../components/Layout";

const ForgotPassword = ({ requestCode, setPassword, codeSent, error, loading, authProps }) => {
    const { username = "" } = authProps.authData || {};
    return (
        <Form
            data={{ username }}
            onSubmit={data => (codeSent ? setPassword(data) : requestCode(data))}
            submitOnEnter
        >
            {({ Bind, submit, data }) => (
                <Content>
                    {loading && <Loading />}
                    <Header title="Password recovery">
                        To reset your password please provide your email address.
                    </Header>

                    {error && (
                        <Row>
                            <Alert title="Something went wrong">{error}</Alert>
                        </Row>
                    )}

                    {!codeSent ? (
                        <>
                            <Row>
                                <Bind
                                    name="username"
                                    validators={validation.create("required")}
                                    beforeChange={(val, cb) => cb(val.toLowerCase())}
                                >
                                    <Input
                                        label={"Email"}
                                        description={"A reset code will be sent to your email."}
                                    />
                                </Bind>
                            </Row>

                            <Row alignRight>
                                <ButtonPrimary onClick={submit}>Send me the code</ButtonPrimary>
                            </Row>
                        </>
                    ) : (
                        <>
                            <Row>
                                We have sent you a code to reset your password!
                                <br />
                                <br />
                                Click the &quot;Resend code&quot; button below to resend the code in
                                case you haven&apos;t received it the first time.
                            </Row>
                            <Row alignRight>
                                <ButtonDefault onClick={() => requestCode(data)}>
                                    {"Resend code"}
                                </ButtonDefault>
                                <ButtonPrimary onClick={submit}>I got the code!</ButtonPrimary>
                            </Row>
                        </>
                    )}
                    <Row alignCenter>
                        Want to sign in? {/* eslint-disable-next-line */}
                        <a href={"#"} onClick={() => authProps.changeState("signIn")}>
                            Sign in
                        </a>
                    </Row>
                </Content>
            )}
        </Form>
    );
};

export default ForgotPassword;
