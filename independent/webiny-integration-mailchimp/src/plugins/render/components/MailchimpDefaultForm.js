// @flow
import * as React from "react";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import { css } from "react-emotion";

const style = css({
    ".webiny-cms-element-mailchimp-form__wrapper": {
        position: "relative",
        ".webiny-cms-element-mailchimp-form__subscribe_btn": {
            position: "absolute",
            top: 10,
            right: 10
        }
    }
});

class MailchimpDefaultForm extends React.Component<*, { success: boolean, error: ?string }> {
    state = {
        error: null,
        success: false
    };

    render() {
        const { Bind, submit, processing } = this.props;
        return (
            <div className={"webiny-cms-element-mailchimp-form " + style}>
                <div className={"webiny-cms-element-mailchimp-form__wrapper"}>
                    <Bind name={"email"} validators={["required", "email"]}>
                        <Input
                            disabled={processing}
                            className={"webiny-cms-element-mailchimp-form__subscribe_input"}
                            label={"Your e-mail"}
                        />
                    </Bind>
                    <ButtonPrimary
                        className={"webiny-cms-element-mailchimp-form__subscribe_btn"}
                        disabled={processing}
                        onClick={async () => {
                            this.setState({ success: false, error: null });

                            await submit({
                                onSuccess: () => {
                                    this.setState({ success: true });
                                },
                                onError: error => {
                                    this.setState({ error });
                                }
                            });
                        }}
                    >
                        Subscribe
                    </ButtonPrimary>
                </div>
                {this.state.error && (
                    <div className={"webiny-cms-element-mailchimp-form__msg"}>
                        Error: {this.state.error}
                    </div>
                )}
                {this.state.success && (
                    <div className={"webiny-cms-element-mailchimp-form__msg"}>Thank you!</div>
                )}
            </div>
        );
    }
}

export default MailchimpDefaultForm;
