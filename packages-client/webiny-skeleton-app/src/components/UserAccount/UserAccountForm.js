import React from "react";
import { app, createComponent, i18n } from "webiny-client";
import TwoFactorAuthActivation from "./TwoFactorAuthActivation";

// import TwoFactorAuthConfirmation from './TwoFactorAuthConfirmation';

/**
 * @i18n.namespace Webiny.Skeleton.UserAccount
 */
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
                    this.growler.success(i18n("Account settings were saved!"));
                    this.auth.refresh();
                });
            }
        };

        const { Ui } = this.props;

        return (
            <Ui.AdminLayout>
                <Ui.Form {...formContainer}>
                    {({ model, form }) => (
                        <Ui.View.Form>
                            <Ui.View.Header title={i18n("Account Settings")} />
                            <Ui.View.Body>
                                <Ui.Grid.Row>
                                    <Ui.Grid.Col md={6} sm={12}>
                                        <Ui.Section title={i18n("Your account")} />
                                        <Ui.Input
                                            label={i18n("First name")}
                                            name="firstName"
                                            validators="required"
                                        />
                                        <Ui.Input
                                            label={i18n("Last name")}
                                            name="lastName"
                                            validators="required"
                                        />
                                        <Ui.Email
                                            label={i18n("Email")}
                                            name="email"
                                            validators="required"
                                        />

                                        <div className="form-group">
                                            <label className="control-label">
                                                {i18n("Gravatar")}
                                            </label>

                                            <div className="input-group">
                                                <Ui.Gravatar hash={model.gravatar} size={100} />
                                            </div>
                                        </div>
                                    </Ui.Grid.Col>
                                    <Ui.Grid.Col md={6} sm={12}>
                                        <Ui.Section title={i18n("Reset password")} />
                                        <Ui.Password
                                            label={i18n("New password")}
                                            name="password"
                                            placeholder={i18n("Type your new password")}
                                        />
                                        <Ui.Password
                                            label={i18n("Confirm password")}
                                            name="confirmPassword"
                                            validators="eq:@password"
                                            placeholder={i18n("Re-type your new password")}
                                        >
                                            <validator name="eq">
                                                {i18n("Passwords do not match")}
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
                                                label={i18n("Enable 2 Factor Authentication")}
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
                                    label={i18n("Save account")}
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
    modulesProp: "Ui",
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
