// @flow
import React from "react";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import { css } from "react-emotion";
import classnames from "classnames";

const wrapper = css({
    display: "flex",
    justifyContent: "space-between"
});

const MailchimpDefaultForm = (props: *) => {
    const { Bind, submit } = props;
    return (
        <div className={classnames("mailchimp-default", wrapper)}>
            <Bind name={"email"} validate={["required"]}>
                <Input label={"Your e-mail"} />
            </Bind>
            <ButtonPrimary onClick={submit}>Submit</ButtonPrimary>
        </div>
    );
};

export default MailchimpDefaultForm;
