import React from 'react';
import classSet from "classnames";
import invariant from "invariant";
import { app, createComponent, i18n } from 'webiny-client';
import logoOrange from './../../assets/images/logo_orange.png';
import styles from './styles/Login.css';

/**
 * @i18n.namespace Webiny.Skeleton.Auth.Login
 */
class Login extends React.Component {
    constructor(props) {
        super(props);

        invariant(props.identity, `You must specify an "identity" prop!`);
        invariant(props.strategy, `You must specify a "strategy" prop!`);

        this.state = {
            twoFactorAuth: false,
            verificationToken: null
        };

    }

    async onSubmit({ model, form }) {
        form.setState({ error: null });
        form.showLoading();

        const auth = app.services.get("authentication");
        try {
            const { identity, strategy } = this.props;

            const result = await auth.login(identity, strategy, model);
            if (result.token) {
                return this.props.onSuccess(result);
            }
        } catch (e) {
            return form.handleApiError(e.data.response);
        }
    }

    render() {
        const { Form, Input, Password, Button, Email } = this.props;

        return (
            <sign-in-form class={classSet('sign-in', (this.props.overlay && 'overlay'))}>
                <Form onSubmit={params => this.onSubmit(params)}>
                    {({ form }) => (
                        <div className="container">
                            <div className="sign-in-holder">
                                <div className="form-signin">
                                    <Form.Loader/>
                                    <a href="#" className="logo">
                                        <img src={logoOrange} width="180" height="58"/>
                                    </a>

                                    <h2 className="form-signin-heading"><span/>{i18n('Sign in to your Account')}
                                    </h2>

                                    <div className="clear"/>
                                    <Form.Error/>

                                    <div className="clear"/>

                                    {this.state.twoFactorAuth && (<Input
                                        name="twoFactorAuthCode"
                                        placeholder={i18n('Enter your verification code')}
                                        label={i18n('Verification code')}
                                        validators="required"
                                        onEnter={form.submit}
                                        autoFocus={true}/>)}

                                    {!this.state.twoFactorAuth && (<div>
                                        <Email
                                            name="username"
                                            placeholder={i18n('Enter email')}
                                            label={i18n('Email address')}
                                            validators="required"
                                            onEnter={form.submit}
                                            autoFocus={true}/>

                                        <Password
                                            name="password"
                                            placeholder={i18n('Password')}
                                            label={i18n('Password')}
                                            validators="required"
                                            onEnter={form.submit}/>
                                    </div>)}

                                    <div className="form-footer">
                                        <Button
                                            type="primary"
                                            style={{ float: 'right' }}
                                            size="large"
                                            onClick={form.submit}
                                            icon="icon-next"
                                            className={styles.btnLogin}>
                                            <span>{i18n('Submit')}</span>
                                        </Button>
                                    </div>
                                </div>

                                <p className="copyright">{i18n('powered by')}</p>
                                <a href="https://www.webiny.com/" className="site">www.webiny.com</a>
                            </div>
                        </div>
                    )}
                </Form>
            </sign-in-form>
        );
    }
}

Login.defaultProps = {
    overlay: false
};

export default createComponent(Login, { modules: ['Form', 'Input', 'Password', 'Button', 'Email'] });