// @flow
import * as React from "react";
import { css } from "react-emotion";

const style = css({
    ".webiny-cms-element-mailchimp-form__wrapper": {
        position: "relative",
        ".webiny-cms-element-mailchimp-form__subscribe_btn": {
            position: "absolute",
            top: 5,
            right: 5
        },
        ".webiny-cms-element-mailchimp-form__subscribe_input": {
            padding: 15
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
                    <Bind
                        name={"email"}
                        validators={["required", "email"]}
                        validationMessages={{ email: "Please enter a valid email address." }}
                    >
                        {({ value, onChange, validation }) => (
                            <div className="webiny-cms-element-input">
                                <input
                                    onChange={e => onChange(e.target.value)}
                                    disabled={processing}
                                    className={
                                        "webiny-cms-element-mailchimp-form__subscribe_input webiny-cms-element-input__field"
                                    }
                                    value={value}
                                    placeholder={"Your e-mail"}
                                />
                                <div className="webiny-cms-element-mailchimp-form__msg webiny-cms-element-input__helper-text">
                                    {validation.isValid === false && validation.message}
                                </div>

                                {this.state.error && (
                                    <div
                                        className={
                                            "webiny-cms-element-mailchimp-form__msg webiny-cms-element-input__helper-text"
                                        }
                                    >
                                        Error: {this.state.error}
                                    </div>
                                )}
                                {this.state.success && (
                                    <div
                                        className={
                                            "webiny-cms-element-mailchimp-form__msg webiny-cms-element-input__helper-text"
                                        }
                                    >
                                        You are on the list. Thank you!
                                    </div>
                                )}
                            </div>
                        )}
                    </Bind>
                    <button
                        className={
                            "webiny-cms-element-mailchimp-form__subscribe_btn webiny-cms-element-button webiny-cms-element-button--primary"
                        }
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
                    </button>
                </div>
            </div>
        );
    }
}

export default MailchimpDefaultForm;
