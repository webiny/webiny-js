import React from "react";
import { lowerCase } from "lodash";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import Input from "../components/Input";
import ButtonPrimary from "../components/ButtonPrimary";
import { Content, Header, Row } from "../components/Layout";

const sentenceCase = str => {
    const lower = lowerCase(str);
    return lower[0].toUpperCase() + lower.substring(1);
};

const RequireNewPassword = ({ confirm, requiredAttributes }) => {
    return (
        <Form onSubmit={data => confirm(data)} submitOnEnter>
            {({ Bind, submit }) => (
                <Content>
                    <Header title="Set new password" />

                    <Row>
                        <Bind name="password" validators={validation.create("required")}>
                            <Input type={"password"} label={"New password"} />
                        </Bind>
                    </Row>
                    {requiredAttributes.length > 0 && (
                        <Header title="Please enter additional information" />
                    )}
                    {requiredAttributes.map(name => (
                        <Row key={name}>
                            <Bind name={name} validators={validation.create("required")}>
                                <Input label={sentenceCase(name)} box={true} />
                            </Bind>
                        </Row>
                    ))}

                    <Row alignRight>
                        <ButtonPrimary onClick={submit}>
                            {"Set password"}
                        </ButtonPrimary>
                    </Row>
                </Content>
            )}
        </Form>
    );
};

export default RequireNewPassword;
