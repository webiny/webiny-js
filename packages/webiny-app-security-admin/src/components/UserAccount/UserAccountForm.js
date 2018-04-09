import React from "react";
import { app, createComponent, i18n } from "webiny-app";
import TwoFactorAuthActivation from "./TwoFactorAuthActivation";

// import TwoFactorAuthConfirmation from './TwoFactorAuthConfirmation';

const t = i18n.namespace("Webiny.Skeleton.UserAccount");
class UserAccount extends React.Component {
    constructor(props) {
        super(props);

        this.auth = app.services.get("authentication");
        this.growler = app.services.get("growler");
    }

    render() {
        const formContainer = {
            api: "/security/auth/me",
            loadModel: ({ form }) => {
                form.showLoading();
                const config = {
                    params: { _fields: "id,firstName,lastName,email,gravatar,twoFactorAuth.status" }
                };
                return form.props.api.request(config).then(res => {
                    form.hideLoading();
                    return res.data.data;
                });
            },
            onSubmit: ({ model, form }) => {
                form.showLoading();
                return form.props.api.request({ method: "patch", data: model }).then(response => {
                    form.hideLoading();
                    if (response.data.code) {
                        return form.handleApiError(response);
                    }

                    form.setModel({ password: null, confirmPassword: null });
                    this.growler.success(t`Account settings were saved!`);
                    this.auth.refresh();
                });
            }
        };

        const { modules: Ui } = this.props;

        return (
            <Ui.AdminLayout>
                <Ui.Form {...formContainer}>
                    {({ model, form }) => (
                        <Ui.View.Form>
                            <Ui.View.Header title={t`Account Settings`} />
                            <Ui.View.Body>
                                <Ui.Grid.Row>
                                    <Ui.Grid.Col md={6} sm={12}>
                                        <Ui.Section title={t`Your account`} />
                                        <Ui.Input
                                            label={t`First name`}
                                            name="firstName"
                                            validators="required"
                                        />
                                        <Ui.Input
                                            label={t`Last name`}
                                            name="lastName"
                                            validators="required"
                                        />
                                        <Ui.Email
                                            label={t`Email`}
                                            name="email"
                                            validators="required"
                                        />

                                        <div className="form-group">
                                            <label className="control-label">{t`Gravatar`}</label>

                                            <div className="input-group">
                                                <Ui.Gravatar hash={model.gravatar} size={100} />
                                            </div>
                                        </div>
                                    </Ui.Grid.Col>
                                    <Ui.Grid.Col md={6} sm={12}>
                                        <Ui.Section title={t`Reset password`} />
                                        <Ui.Password
                                            label={t`New password`}
                                            name="password"
                                            placeholder={t`Type your new password`}
                                        />
                                        <Ui.Password
                                            label={t`Confirm password`}
                                            name="confirmPassword"
                                            validators="eq:@password"
                                            placeholder={t`Re-type your new password`}
                                        >
                                            <validator name="eq">
                                                {t`Passwords do not match`}
                                            </validator>
                                        </Ui.Password>
                                        <Ui.ChangeConfirm
                                            message={({ value }) => (value ? "Dummy" : null)}
                                            renderDialog={function() {
                                                return <TwoFactorAuthActivation />;
                                            }}
                                            onComplete={() => this.twoFactorAuthConfirmation.show()}
                                        >
                                            <Ui.Switch
                                                label={t`Enable 2 Factor Authentication`}
                                                name="twoFactorAuth.status"
                                            />
                                        </Ui.ChangeConfirm>
                                        {/*<TwoFactorAuthConfirmation ref={ref => this.twoFactorAuthConfirmation = ref}/>*/}
                                    </Ui.Grid.Col>
                                </Ui.Grid.Row>
                            </Ui.View.Body>
                            <Ui.View.Footer align="right">
                                <Ui.Button
                                    type="primary"
                                    onClick={form.submit}
                                    label={t`Save account`}
                                />
                            </Ui.View.Footer>
                        </Ui.View.Form>
                    )}
                </Ui.Form>
            </Ui.AdminLayout>
        );
    }
}

export default createComponent(UserAccount, {
    modules: [
        { AdminLayout: "Skeleton.AdminLayout" },
        "View",
        "Form",
        "Grid",
        "Gravatar",
        "Input",
        "Email",
        "Password",
        "Button",
        "Section",
        "ChangeConfirm",
        "Switch",
        "Modal",
        "Data",
        "Link",
        "Icon"
    ]
});
