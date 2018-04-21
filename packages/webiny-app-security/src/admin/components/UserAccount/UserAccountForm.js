import React from "react";
import { app, createComponent, i18n } from "webiny-app";
import gql from "graphql-tag";
import TwoFactorAuthActivation from "./TwoFactorAuthActivation";

// import TwoFactorAuthConfirmation from './TwoFactorAuthConfirmation';

const t = i18n.namespace("Webiny.Admin.UserAccount");

class UserAccount extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            model: {}
        };

        this.auth = app.services.get("authentication");
        this.growler = app.services.get("growler");
        this.onSubmit = this.onSubmit.bind(this);
    }

    componentWillMount() {
        app.graphql
            .query({
                query: gql`
                {
                    me: getIdentity {
                        ... on ${this.auth.identity.__typename} {
                            ${this.props.fields}
                        }
                    }
                }
            `
            })
            .then(({ data }) => {
                this.setState({ model: data.me });
            });
    }

    onSubmit(model) {
        this.setState({ error: null, loading: true });

        const mutation = gql`
            mutation UpdateIdentity($data: JSON!) {
                updateIdentity(data: $data) {
                    ... on ${this.auth.identity.__typename} {
                        ${this.props.fields}
                    }
                }
            }
        `;

        app.graphql
            .mutate({
                mutation,
                variables: { data: model }
            })
            .then(({ data }) => {
                this.setState(() => {
                    return {
                        loading: false,
                        model: {
                            ...data.updateIdentity,
                            password: null,
                            confirmPassword: null
                        }
                    };
                });
                this.growler.success(t`Account settings saved!`);
                this.auth.refresh();
            })
            .catch(error => {
                this.setState({ error: Error.from(error), loading: false });
            });
    }

    render() {
        const {
            modules: {
                AdminLayout,
                Form,
                FormError,
                View,
                Grid,
                Input,
                Button,
                Switch,
                Loader,
                Email,
                Gravatar,
                Section,
                Password,
                ChangeConfirm
            }
        } = this.props;

        return (
            <AdminLayout>
                <Form model={this.state.model} onSubmit={model => this.onSubmit(model)}>
                    {({ model, form, Bind }) => (
                        <View.Form>
                            <View.Header title={t`Account Settings`} />
                            {this.state.error && (
                                <View.Error>
                                    <FormError error={this.state.error} />
                                </View.Error>
                            )}
                            <View.Body>
                                {this.state.loading && <Loader />}
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
                                            <Email label={t`Email`} name="email" />
                                        </Bind>
                                        <div className="form-group">
                                            <label className="control-label">{t`Gravatar`}</label>
                                            <div className="input-group">
                                                <Gravatar hash={model.gravatar} size={100} />
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
                                            message={({ value }) => (value ? "Dummy" : null)}
                                            renderDialog={function() {
                                                return <TwoFactorAuthActivation />;
                                            }}
                                            onComplete={() => this.twoFactorAuthConfirmation.show()}
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
                                <pre>{JSON.stringify(this.state.model, null, 2)}</pre>
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
            </AdminLayout>
        );
    }
}

UserAccount.defaultProps = {
    fields: `id firstName lastName email gravatar`
};

export default createComponent(UserAccount, {
    modules: [
        { AdminLayout: "Admin.Layout" },
        "View",
        "Form",
        "FormError",
        "Grid",
        "Gravatar",
        "Loader",
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
