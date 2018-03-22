import React from 'react';
import { createComponent } from 'webiny-client';

// import TwoFactorAuthConfirmation from './TwoFactorAuthConfirmation';

/**
 * @i18n.namespace Webiny.Skeleton.UserAccount
 */
class UserAccount extends React.Component {

    constructor(props) {
        super(props);

        this.twoFactorAuthModal = this.twoFactorAuthModal.bind(this);
    }

    twoFactorAuthModal({ onConfirm, onCancel }) {
        const { Ui } = this.props;

        const formProps = {
            api: '/entities/webiny/user/2factor-verify',
            fields: 'id,title',
            onSuccessMessage: null,
            onSubmitSuccess: ({ apiResponse }) => {
                if (apiResponse.getData().result) {
                    onConfirm();
                } else {
                    Webiny.Growl.danger(this.i18n(`The code doesn't match`));
                }
            }
        };

        return (
            <Ui.Modal.Dialog>
                <Ui.Form {...formProps}>
                    {({ model, form }) => (
                        <Ui.Modal.Content>
                            <Ui.Modal.Header title={this.i18n('2 Factor Auth')} onClose={onCancel}/>
                            <Ui.Modal.Body>
                                <Ui.Grid.Row>
                                    <Ui.Grid.Col all={6}>
                                        <Ui.Section title={this.i18n('Step 1')}/>
                                        <p>
                                            {this.i18n('Install the Google Authenticator iOS or Android app:')} <br/>
                                        </p>
                                        <p>
                                            <Ui.Link
                                                url="https://itunes.apple.com/us/app/google-authenticator/id388497605?mt=8">
                                                <Ui.Icon icon="fa-apple"/> {this.i18n('iOS download')}
                                            </Ui.Link>
                                            <br/>
                                            <Ui.Link
                                                url="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=en">
                                                <Ui.Icon icon="fa-android"/> {this.i18n('Android download')}
                                            </Ui.Link>
                                        </p>
                                    </Ui.Grid.Col>

                                    <Ui.Grid.Col all={6}>
                                        <Ui.Section title={this.i18n('Step 2')}/>
                                        <p>{this.i18n('Scan the QR code below with the authenticator app')}</p>
                                        <Ui.Data api="/entities/webiny/user/2factor-qr" waitForData={true}>
                                            {({ data }) => (
                                                <Ui.Grid.Col all={12} className="text-center">
                                                    <img src={data.qrCode}/>
                                                </Ui.Grid.Col>
                                            )}
                                        </Ui.Data>
                                    </Ui.Grid.Col>
                                </Ui.Grid.Row>
                                <Ui.Grid.Row>
                                    <Ui.Grid.Col all={12}>
                                        <Ui.Section title={this.i18n('Step 3')}/>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.Input
                                                label={this.i18n('Enter the generated code in the field below:')}
                                                name="verification"
                                                validate="required"/>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Col>
                                </Ui.Grid.Row>

                            </Ui.Modal.Body>
                            <Ui.Modal.Footer>
                                <Ui.Button type="default" label={this.i18n('Cancel')} onClick={onCancel}/>
                                <Ui.Button type="primary" label={this.i18n('Verify')} onClick={form.submit}/>
                            </Ui.Modal.Footer>
                        </Ui.Modal.Content>
                    )}
                </Ui.Form>
            </Ui.Modal.Dialog>

        );
    }

    render() {
        return null;
        /*const formContainer = {
            api: Webiny.Auth.getApiEndpoint(),
            loadModel: ({ form }) => {
                form.showLoading();
                return form.api.get('/me', { _fields: 'id,firstName,lastName,email,gravatar,twoFactorAuth.status,meta.appNotifications' }).then(res => {
                    form.hideLoading();
                    return res.getData();
                });
            },
            onSubmit: ({ model, form }) => {
                form.showLoading();
                return form.api.patch('/me', model).then(apiResponse => {
                    form.hideLoading();
                    if (apiResponse.isError()) {
                        return form.handleApiError(apiResponse);
                    }

                    form.setModel({ password: null, confirmPassword: null });
                    Webiny.Growl.success(this.i18n('Account settings were saved!'));
                    Webiny.Auth.refresh();
                });
            }
        };

        const { Ui } = this.props;


        return (
            <Ui.Form {...formContainer}>
                {({ model, form }) => (
                    <Ui.View.Form>
                        <Ui.View.Header title={this.i18n('Account Settings')}/>
                        <Ui.View.Body>
                            <Ui.Grid.Row>
                                <Ui.Grid.Col md={6} sm={12}>
                                    <Ui.Section title={this.i18n('Your account')}/>
                                    <Ui.Input label={this.i18n('First name')} name="firstName" validate="required"/>
                                    <Ui.Input label={this.i18n('Last name')} name="lastName" validate="required"/>
                                    <Ui.Input label={this.i18n('Email')} name="email" validate="required,email"/>

                                    <div className="form-group">
                                        <label className="control-label">{this.i18n('Gravatar')}</label>

                                        <div className="input-group">
                                            <Ui.Gravatar hash={model.gravatar} size={100}/>
                                        </div>
                                    </div>
                                </Ui.Grid.Col>
                                <Ui.Grid.Col md={6} sm={12}>
                                    <Ui.Section title={this.i18n('Reset password')}/>
                                    <Ui.Password
                                        label={this.i18n('New password')}
                                        name="password"
                                        placeholder={this.i18n('Type your new password')}/>
                                    <Ui.Password
                                        label={this.i18n('Confirm password')}
                                        name="confirmPassword"
                                        validate="eq:@password"
                                        placeholder={this.i18n('Re-type your new password')}>
                                        <validator name="eq">{this.i18n('Passwords do not match')}</validator>
                                    </Ui.Password>
                                    <Ui.ChangeConfirm
                                        message={({ value }) => value ? 'Dummy' : null}
                                        renderDialog={this.twoFactorAuthModal}
                                        onComplete={() => this.twoFactorAuthConfirmation.show()}>
                                        <Ui.Switch label={this.i18n('Enable 2 Factor Authentication')}
                                                   name="twoFactorAuth.status"/>
                                    </Ui.ChangeConfirm>
                                    {/!*<TwoFactorAuthConfirmation ref={ref => this.twoFactorAuthConfirmation = ref}/>*!/}
                                </Ui.Grid.Col>
                            </Ui.Grid.Row>
                            <Ui.Grid.Row>
                                <Ui.Grid.Col all={6}>
                                    <Ui.Section title={this.i18n('App Notifications')}/>
                                    <Ui.CheckboxGroup
                                        api="/services/webiny/app-notifications/types"
                                        name="meta.appNotifications"
                                        valueAttr="type"
                                        textAttr="title"
                                        checkboxLabelRenderer={({ option }) => {
                                            return <span><strong>{option.text}</strong> ({option.data.description || 'no description'})</span>
                                        }}
                                    />
                                </Ui.Grid.Col>
                            </Ui.Grid.Row>
                        </Ui.View.Body>
                        <Ui.View.Footer align="right">
                            <Ui.Button type="primary" onClick={form.submit} label={this.i18n('Save account')}/>
                        </Ui.View.Footer>
                    </Ui.View.Form>
                )}
            </Ui.Form>
        );*/
    }

}

export default createComponent(UserAccount, {
    modulesProp: 'Ui',
    modules: ['View', 'Form', 'Grid', 'Gravatar', 'Input', 'Password', 'Button', 'Section', 'ChangeConfirm', 'Switch', 'Modal', 'Data', 'Link', 'Icon', 'CheckboxGroup']
});