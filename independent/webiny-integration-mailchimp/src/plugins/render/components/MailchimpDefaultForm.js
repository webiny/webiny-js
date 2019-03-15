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

class MailchimpDefaultForm extends React.Component<
    *,
    { processing: boolean, message: React.Node }
> {
    state = {
        processing: false,
        message: null
    };

    render() {
        const { Bind, submit } = this.props;
        return (
            <div className={"webiny-cms-element-mailchimp-form " + style}>
                <div className={"webiny-cms-element-mailchimp-form__wrapper"}>
                    <Bind name={"email"} validators={["required", "email"]}>
                        <Input
                            className={"webiny-cms-element-mailchimp-form__subscribe_input"}
                            label={"Your e-mail"}
                        />
                    </Bind>
                    <ButtonPrimary
                        className={"webiny-cms-element-mailchimp-form__subscribe_btn"}
                        disabled={this.state.processing}
                        onClick={async () => {
                            this.setState({ processing: true });

                            await submit({
                                onSuccess: () => {
                                    this.setState({ processing: false });
                                },
                                onError: err => {
                                    this.setState({ processing: false });
                                    this.setState({ message: err });
                                }
                            });

                            this.setState({ processing: false });
                        }}
                    >
                        Subscribe
                    </ButtonPrimary>
                </div>
                {this.state.message && (
                    <div className={"webiny-cms-element-mailchimp-form__msg"}>
                        {this.state.message}
                    </div>
                )}
            </div>
        );
    }
}

export default MailchimpDefaultForm;
