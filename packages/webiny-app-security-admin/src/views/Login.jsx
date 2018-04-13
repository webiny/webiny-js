import React from "react";
import classSet from "classnames";
import invariant from "invariant";
import { app, createComponent, i18n } from "webiny-app";
import logoOrange from "webiny-app-admin/lib/assets/images/logo_orange.png";
import styles from "./Login.css";

const t = i18n.namespace("Webiny.Admin.Auth.Login");

class Login extends React.Component {
    constructor(props) {
        super(props);

        invariant(props.identity, `You must specify an "identity" prop!`);
        invariant(props.strategy, `You must specify a "strategy" prop!`);

        this.state = {
            twoFactorAuth: false,
            verificationToken: null,
            loading: false,
            error: null
        };
    }

    render() {
        const { Alert, Form, Input, Password, Button, Email, Loader } = this.props.modules;

        return (
            <sign-in-form class={classSet("sign-in", this.props.overlay && "overlay")}>
                <Form onSubmit={model => this.props.onSubmit.call(this, model)}>
                    {({ form, Bind }) => (
                        <div className="container">
                            <div className="sign-in-holder">
                                <div className="form-signin">
                                    {this.state.loading && <Loader />}
                                    <a href="#" className="logo">
                                        <img src={logoOrange} width="180" height="58" />
                                    </a>

                                    <h2 className="form-signin-heading">
                                        <span />
                                        {t`Sign in to your Account`}
                                    </h2>

                                    <div className="clear" />
                                    {this.state.error && (
                                        <Alert type={"error"}>{this.state.error.message}</Alert>
                                    )}
                                    <div className="clear" />

                                    {this.state.twoFactorAuth && (
                                        <Bind>
                                            <Input
                                                name="twoFactorAuthCode"
                                                placeholder={t`Enter your verification code`}
                                                label={t`Verification code`}
                                                validators="required"
                                                onEnter={form.submit}
                                                autoFocus={true}
                                            />
                                        </Bind>
                                    )}

                                    {!this.state.twoFactorAuth && (
                                        <div>
                                            <Bind>
                                                <Email
                                                    name="username"
                                                    placeholder={t`Enter email`}
                                                    label={t`Email address`}
                                                    validators="required"
                                                    onEnter={form.submit}
                                                    autoFocus={true}
                                                />
                                            </Bind>
                                            <Bind>
                                                <Password
                                                    name="password"
                                                    placeholder={t`Password`}
                                                    label={t`Password`}
                                                    validators="required"
                                                    onEnter={form.submit}
                                                />
                                            </Bind>
                                        </div>
                                    )}

                                    <div className="form-footer">
                                        <Button
                                            type="primary"
                                            style={{ float: "right" }}
                                            size="large"
                                            onClick={form.submit}
                                            icon={["fas", "arrow-alt-circle-right"]}
                                            className={styles.btnLogin}
                                        >
                                            <span>{t`Submit`}</span>
                                        </Button>
                                    </div>
                                </div>

                                <p className="copyright">{t`powered by`}</p>
                                <a href="https://www.webiny.com/" className="site">
                                    www.webiny.com
                                </a>
                            </div>
                        </div>
                    )}
                </Form>
            </sign-in-form>
        );
    }
}

Login.defaultProps = {
    overlay: false,
    async onSubmit(model) {
        const auth = app.services.get("authentication");
        try {
            const { identity, strategy } = this.props;

            this.setState({ loading: true });
            const result = await auth.login(identity, strategy, model);
            this.setState({ loading: false });
            if (result.token) {
                return this.props.onSuccess(result);
            }
        } catch (e) {
            this.setState({ error: e, loading: false });
        }
    }
};

export default createComponent(Login, {
    modules: ["Form", "Input", "Password", "Button", "Email", "Loader", "Alert"]
});
