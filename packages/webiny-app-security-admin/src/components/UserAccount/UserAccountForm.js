import React from "react";
import { app, createComponent, i18n } from "webiny-app";
import { GraphQLFormData, GraphQLFormError } from "webiny-data-ui";
import TwoFactorAuthActivation from "./TwoFactorAuthActivation";

// import TwoFactorAuthConfirmation from './TwoFactorAuthConfirmation';

const t = i18n.namespace("Webiny.Admin.UserAccount");
class UserAccount extends React.Component {
    constructor(props) {
        super(props);

        this.auth = app.services.get("authentication");
        this.growler = app.services.get("growler");
    }

    render() {
        /*const formContainer = {
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
        };*/

        const {
            modules: {
                AdminLayout,
                Form,
                View,
                Grid,
                Input,
                Button,
                Switch,
                Email,
                Gravatar,
                Section,
                Password,
                ChangeConfirm
            }
        } = this.props;

        return (
            <AdminLayout>
                <GraphQLFormData>
                    {({ model, error, onSubmit }) => (
                        <Form model={model} onSubmit={onSubmit}>
                            {({ model, form, Bind }) => (
                                <View.Form>
                                    <View.Header title={t`Account Settings`} />
                                    {error && (
                                        <View.Error>
                                            <GraphQLFormError error={error} />
                                        </View.Error>
                                    )}
                                    <View.Body>
                                        <Grid.Row>
                                            <Grid.Col md={6} sm={12}>
                                                <Section title={t`Your account`} />
                                                <Bind>
                                                    <Input
                                                        label={t`First name`}
                                                        name="firstName"
                                                        validators="required"
                                                    />
                                                </Bind>
                                                <Bind>
                                                    <Input
                                                        label={t`Last name`}
                                                        name="lastName"
                                                        validators="required"
                                                    />
                                                </Bind>
                                                <Bind>
                                                    <Email
                                                        label={t`Email`}
                                                        name="email"
                                                        validators="required"
                                                    />
                                                </Bind>
                                                <div className="form-group">
                                                    <label className="control-label">{t`Gravatar`}</label>
                                                    <div className="input-group">
                                                        <Gravatar
                                                            hash={model.gravatar}
                                                            size={100}
                                                        />
                                                    </div>
                                                </div>
                                            </Grid.Col>
                                            <Grid.Col md={6} sm={12}>
                                                <Section title={t`Reset password`} />
                                                <Bind>
                                                    <Password
                                                        label={t`New password`}
                                                        name="password"
                                                        placeholder={t`Type your new password`}
                                                    />
                                                </Bind>
                                                <Bind>
                                                    <Password
                                                        label={t`Confirm password`}
                                                        name="confirmPassword"
                                                        validators="eq:@password"
                                                        placeholder={t`Re-type your new password`}
                                                    >
                                                        <validator name="eq">
                                                            {t`Passwords do not match`}
                                                        </validator>
                                                    </Password>
                                                </Bind>
                                                <ChangeConfirm
                                                    message={({ value }) =>
                                                        value ? "Dummy" : null
                                                    }
                                                    renderDialog={function() {
                                                        return <TwoFactorAuthActivation />;
                                                    }}
                                                    onComplete={() =>
                                                        this.twoFactorAuthConfirmation.show()
                                                    }
                                                >
                                                    {({ showConfirmation }) => (
                                                        <Bind beforeChange={showConfirmation}>
                                                            <Switch
                                                                label={t`Enable 2 Factor Authentication`}
                                                                name="twoFactorAuth.status"
                                                            />
                                                        </Bind>
                                                    )}
                                                </ChangeConfirm>
                                                {/*<TwoFactorAuthConfirmation ref={ref => this.twoFactorAuthConfirmation = ref}/>*/}
                                            </Grid.Col>
                                        </Grid.Row>
                                    </View.Body>
                                    <View.Footer align="right">
                                        <Button
                                            type="primary"
                                            onClick={form.submit}
                                            label={t`Save account`}
                                        />
                                    </View.Footer>
                                </View.Form>
                            )}
                        </Form>
                    )}
                </GraphQLFormData>
            </AdminLayout>
        );
    }
}

export default createComponent(UserAccount, {
    modules: [
        { AdminLayout: "Admin.Layout" },
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
