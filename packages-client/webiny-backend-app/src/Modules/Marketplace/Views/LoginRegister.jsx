import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.css';
import RegisterModal from './../Components/RegisterModal'
import ForgotPasswordModal from './../Components/ForgotPasswordModal'

/**
 * @i18n.namespace Webiny.Backend.Marketplace.LoginRegister
 */
class LoginRegister extends Webiny.Ui.View {
    constructor(props) {
        super(props);

        this.bindMethods('showLogin,showRegister,showForgotPassword');
    }

    showLogin() {
        this.loginModal.show();
    }

    showRegister() {
        this.registerModal.show();
    }

    showForgotPassword() {
        this.forgotPasswordModal.show();
    }
}

LoginRegister.defaultProps = {
    renderer() {
        const {styles, Button, Icon, Form, Input, Grid, Password, Link} = this.props;

        const childProps = {
            showLogin: this.showLogin,
            showRegister: this.showRegister,
            showForgotPassword: this.showForgotPassword,
            onUser: this.props.onUser
        };

        const formProps = {
            api: '/services/webiny/marketplace',
            url: 'login',
            onSubmitSuccess: ({apiResponse}) => this.props.onUser(apiResponse.getData()),
            onSuccessMessage: null
        };

        const cantRemember = (
            <Link className={this.classSet(styles.cantRemember, 'small')} onClick={this.showForgotPassword}>I CAN'T REMEMBER</Link>
        );

        return (
            <Form {...formProps}>
                {({form}) => (
                    <div className={styles.loginRegister}>
                        <div className={styles.message}>
                            <h2><Icon icon="icon-basket_n"/> {this.i18n('Webiny Marketplace')}</h2>
                            <h3>{this.i18n('Find and Install Apps for Webiny')}</h3>
                            <p>
                                {this.i18n('Access to the marketplace requires a Webiny.com profile.')}<br/>
                                {this.i18n('If you already have a profile, please sign-in, otherwise please register.')}
                            </p>
                            <div className={styles.loginForm}>
                                <Grid.Row>
                                    <Form.Loader/>
                                    <Grid.Col all={12}>
                                        <Form.Error/>
                                        <Input
                                            placeholder={this.i18n('Email')}
                                            label={this.i18n('Email')}
                                            name="username"
                                            validate="required, email"
                                            onEnter={form.submit}/>
                                    </Grid.Col>
                                    <Grid.Col all={12}>
                                        <Password
                                            label={this.i18n('Password')}
                                            placeholder={this.i18n('Password')}
                                            name="password"
                                            validate="required"
                                            onEnter={form.submit}
                                            description={cantRemember}/>
                                    </Grid.Col>
                                    <Grid.Col all={12} className={styles.modalAction}>
                                        <Button
                                            type="primary"
                                            onClick={form.submit}
                                            size="large"
                                            icon="icon-next"
                                            label={this.i18n('Sign In')}/>
                                    </Grid.Col>
                                </Grid.Row>
                            </div>
                            <div className={styles.actions}>
                                <div className="text-center">
                                    {this.i18n('Not a member? {signupLink}', {
                                        signupLink: <Link onClick={this.showRegister}><br/>Sign up here</Link>
                                    })}
                                </div>
                            </div>
                        </div>
                        <RegisterModal {...childProps} ref={ref => this.registerModal = ref}/>
                        <ForgotPasswordModal {...childProps} ref={ref => this.forgotPasswordModal = ref}/>
                    </div>
                )}
            </Form>
        );
    }
};

export default Webiny.createComponent(LoginRegister, {styles, modules: ['Button', 'Icon', 'Form', 'Input', 'Grid', 'Password', 'Link']});