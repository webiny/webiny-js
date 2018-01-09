import React from 'react';
import {Webiny} from 'webiny-client';
import logoOrange from './../../Assets/images/logo_orange.png';
import styles from './styles/Login.css';

/**
 * @i18n.namespace Webiny.Skeleton.Auth.Login
 */
class Login extends Webiny.Ui.View {
    constructor(props) {
        super(props);

        this.state = {
            twoFactorAuth: false,
            verificationToken: null
        };

    }

    onSubmit({model, form}) {
        form.setState({error: null});
        form.showLoading();

        if (this.state.twoFactorAuth) {
            delete model.password;
            model.verificationToken = this.state.verificationToken;
        }

        return Webiny.Auth.getApiEndpoint().post('login', model, {_fields: Webiny.Auth.getUserFields()}).then(async apiResponse => {
            form.hideLoading();
            if (apiResponse.isError()) {
                return form.handleApiError(apiResponse);
            }

            const data = apiResponse.getData();
            if (data.twoFactorAuth) {
                // activate two factor auth
                this.setState({twoFactorAuth: true, verificationToken: data.verificationToken});
                return;
            }


            if (!Webiny.Auth.isAuthorized(data.user)) {
                return form.setState({error: 'Some of your input isn\'t quite right.'});
            }

            Webiny.Cookies.set(Webiny.Auth.getCookieName(), data.authToken, {expires: 30, path: '/'});
            Webiny.Model.set('User', data.user);

            if (this.props.onSuccess) {
                this.props.onSuccess();
            } else {
                let loginRedirect = await Webiny.LocalStorage.get('loginRedirect');
                if (loginRedirect) {
                    Webiny.LocalStorage.remove('loginRedirect');
                    Webiny.Router.goToUrl(loginRedirect)
                } else {
                    Webiny.Router.goToDefaultRoute();
                }
            }
        });
    }
}

Login.defaultProps = {
    overlay: false,
    renderer() {
        const {Form, Input, Password, Button, Email} = this.props;

        return (
            <sign-in-form class={this.classSet('sign-in', (this.props.overlay && 'overlay'))}>
                <Form onSubmit={params => this.onSubmit(params)}>
                    {({form}) => (
                        <div className="container">
                            <div className="sign-in-holder">
                                <div className="form-signin">
                                    <Form.Loader/>
                                    <a href="#" className="logo">
                                        <img src={logoOrange} width="180" height="58"/>
                                    </a>

                                    <h2 className="form-signin-heading"><span/>{this.i18n('Sign in to your Account')}</h2>

                                    <div className="clear"/>
                                    <Form.Error/>

                                    <div className="clear"/>

                                    {this.state.twoFactorAuth && ( <Input
                                        name="twoFactorAuthCode"
                                        placeholder={this.i18n('Enter your verification code')}
                                        label={this.i18n('Verification code')}
                                        validate="required"
                                        onEnter={form.submit}
                                        autoFocus={true}/>)}

                                    {!this.state.twoFactorAuth && (<div>
                                        <Email
                                            name="username"
                                            placeholder={this.i18n('Enter email')}
                                            label={this.i18n('Email address')}
                                            validate="required"
                                            onEnter={form.submit}
                                            autoFocus={true}/>

                                        <Password
                                            name="password"
                                            placeholder={this.i18n('Password')}
                                            label={this.i18n('Password')}
                                            validate="required"
                                            onEnter={form.submit}/>
                                    </div>)}

                                    <div className="form-footer">
                                        <Button
                                            type="primary"
                                            style={{float: 'right'}}
                                            size="large"
                                            onClick={form.submit}
                                            icon="icon-next"
                                            className={styles.btnLogin}>
                                            <span>{this.i18n('Submit')}</span>
                                        </Button>
                                    </div>
                                </div>

                                <p className="copyright">{this.i18n('powered by')}</p>
                                <a href="https://www.webiny.com/" className="site">www.webiny.com</a>
                            </div>
                        </div>
                    )}
                </Form>
            </sign-in-form>
        );
    }
};

export default Webiny.createComponent(Login, {modules: ['Form', 'Input', 'Password', 'Button', 'Email']});