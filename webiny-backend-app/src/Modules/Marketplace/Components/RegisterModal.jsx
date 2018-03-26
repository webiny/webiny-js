import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './../Views/styles.css';

/**
 * @i18n.namespace Webiny.Backend.Marketplace.RegisterModal
 */
class RegisterModal extends Webiny.Ui.ModalComponent {
    constructor(props) {
        super(props);

        this.state = {
            success: false
        };

        this.bindMethods('login');
    }

    login() {
        this.hide().then(() => this.props.showLogin());
    }

    show() {
        this.setState({success: false});
        return super.show();
    }

    renderRegisterForm() {
        const {Modal, Button, Grid, Password, Form, Link, Input} = this.props;

        const containerProps = {
            api: Webiny.Auth.getApiEndpoint(),
            url: 'register',
            fields: 'id,firstName,lastName,email',
            onSubmitSuccess: () => this.setState({success: true}),
            onCancel: this.hide,
            onSuccessMessage: null
        };


        return (
            <Modal.Dialog>
                <Form {...containerProps}>
                    {({form}) => (
                        <Modal.Content>
                            <Modal.Header title={this.i18n('Register')} onClose={this.hide}/>
                            <Modal.Body>

                                <Grid.Row>
                                    <Grid.Col all={12}>
                                        <Form.Error/>
                                    </Grid.Col>
                                    <Grid.Col all={6}>
                                        <Input
                                            placeholder={this.i18n('First Name')}
                                            label={this.i18n('First Name')}
                                            name="firstName"
                                            validate="required"
                                            onEnter={form.submit}/>
                                    </Grid.Col>

                                    <Grid.Col all={6}>
                                        <Input
                                            placeholder={this.i18n('Last Name')}
                                            label={this.i18n('Last Name')}
                                            name="lastName"
                                            validate="required"
                                            onEnter={form.submit}/>
                                    </Grid.Col>

                                    <Grid.Col all={12}>
                                        <Input
                                            placeholder={this.i18n('Email')}
                                            label={this.i18n('Email')}
                                            name="email"
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
                                        />
                                    </Grid.Col>
                                </Grid.Row>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button
                                    type="secondary"
                                    onClick={form.submit}
                                    size="large"
                                    icon="icon-next"
                                    label={this.i18n('Register')}/>
                            </Modal.Footer>
                        </Modal.Content>
                    )}
                </Form>
            </Modal.Dialog>

        );
    }

    renderSuccess() {
        const {Modal, Icon, Link} = this.props;

        return (
            <Modal.Dialog>
                <Modal.Content>
                    <Modal.Body>
                        <div className="text-center">
                            <br/>
                            <Icon type="success" size="4x" icon="fa-check-circle" element="div"/><br/>
                            <h4>{this.i18n('Done')}</h4>
                            <p>{this.i18n('Thanks for registering!')}</p>
                            <p>
                                {this.i18n('Your profile is ready, {backLink}', {
                                    backLink: <Link className="text-link" onClick={this.close}>{this.i18n('back to login page.')}</Link>
                                })}
                            </p>
                        </div>
                    </Modal.Body>
                </Modal.Content>
            </Modal.Dialog>
        );
    }

    renderDialog() {
        return this.state.success ? this.renderSuccess() : this.renderRegisterForm();
    }
}

export default Webiny.createComponent(RegisterModal, {
    styles,
    modules: ['Modal', 'Form', 'Input', 'Password', 'Button', 'Link', 'Icon', 'Grid', 'Link']
});