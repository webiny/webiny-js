import React from "react";
import { app, i18n, createComponent } from "webiny-app";

const t = i18n.namespace("Security.UsersForm");

class UsersForm extends React.Component {
    constructor() {
        super();

        this.state = {
            searchQuery: {
                role: {},
                roleGroup: {}
            }
        };
    }

    render() {
        const {
            AdminLayout,
            Form,
            FormData,
            FormError,
            OptionsData,
            Section,
            View,
            Grid,
            Input,
            Button,
            Switch,
            Password,
            Loader,
            AutoCompleteList
        } = this.props.modules;

        return (
            <AdminLayout>
                <FormData
                    entity="SecurityUser"
                    withRouter
                    fields="id firstName lastName enabled email roles { id name } roleGroups { id name }"
                    onSubmitSuccess="Users.List"
                    onCancel="Users.List"
                    defaultModel={{ roleGroups: [], roles: [] }}
                    onSuccessMessage={data => (
                        <span>
                            {t`User {user} was saved successfully!`({
                                user: <strong>{data.model.firstName}</strong>
                            })}
                        </span>
                    )}
                >
                    {({ model, onSubmit, loading, invalidFields, error }) => (
                        <Form model={model} onSubmit={onSubmit} invalidFields={invalidFields}>
                            {({ model, form, Bind }) => {
                                return (
                                    <View.Form>
                                        <View.Header
                                            title={
                                                model.id
                                                    ? t`Security - Edit User`
                                                    : t`Security - Create User`
                                            }
                                        />
                                        {error && (
                                            <View.Error>
                                                <FormError error={error} />
                                            </View.Error>
                                        )}
                                        <View.Body>
                                            {loading && <Loader />}
                                            <Grid.Row>
                                                <Grid.Col all={6}>
                                                    <Section title={t`Info`} />
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <Bind>
                                                                <Input
                                                                    label={t`First name`}
                                                                    name="firstName"
                                                                    validate="required"
                                                                />
                                                            </Bind>
                                                            <Bind>
                                                                <Input
                                                                    label={t`Last name`}
                                                                    name="lastName"
                                                                    validate="required"
                                                                />
                                                            </Bind>
                                                            <Bind>
                                                                <Input
                                                                    label={t`Email`}
                                                                    name="email"
                                                                    description={t`Your email`}
                                                                    validate="required,email"
                                                                />
                                                            </Bind>
                                                        </Grid.Col>
                                                    </Grid.Row>
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <OptionsData
                                                                entity="SecurityRole"
                                                                fields="id name"
                                                                labelField="name"
                                                                perPage={10}
                                                                search={{
                                                                    fields: ["name"],
                                                                    query: this.state.searchQuery
                                                                        .role
                                                                }}
                                                            >
                                                                {({ options }) => (
                                                                    <Bind>
                                                                        <AutoCompleteList
                                                                            options={options}
                                                                            label={t`Roles`}
                                                                            name="roles"
                                                                            onSearch={query => {
                                                                                this.setState(
                                                                                    state => {
                                                                                        state.searchQuery.role = query;
                                                                                        return state;
                                                                                    }
                                                                                );
                                                                            }}
                                                                        />
                                                                    </Bind>
                                                                )}
                                                            </OptionsData>
                                                        </Grid.Col>
                                                    </Grid.Row>

                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <OptionsData
                                                                entity="SecurityRoleGroup"
                                                                fields="id name"
                                                                labelField="name"
                                                                perPage={10}
                                                                search={{
                                                                    fields: ["name"],
                                                                    query: this.state.searchQuery
                                                                        .roleGroup
                                                                }}
                                                            >
                                                                {({ options }) => (
                                                                    <Bind>
                                                                        <AutoCompleteList
                                                                            options={options}
                                                                            label={t`Role Groups`}
                                                                            name="roleGroups"
                                                                            onSearch={query => {
                                                                                this.setState(
                                                                                    state => {
                                                                                        state.searchQuery.roleGroup = query;
                                                                                        return state;
                                                                                    }
                                                                                );
                                                                            }}
                                                                        />
                                                                    </Bind>
                                                                )}
                                                            </OptionsData>
                                                        </Grid.Col>
                                                    </Grid.Row>
                                                </Grid.Col>
                                                <Grid.Col all={6}>
                                                    <Section title={t`Password`} />
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <Bind>
                                                                <Password
                                                                    label={t`New password`}
                                                                    name="password"
                                                                    placeholder={t`Type a new password`}
                                                                />
                                                            </Bind>

                                                            <Bind>
                                                                <Password
                                                                    label={t`Confirm password`}
                                                                    name="confirmPassword"
                                                                    validate="eq:@password"
                                                                    placeholder={t`Retype the new password`}
                                                                >
                                                                    <validator name="eq">
                                                                        {t`Passwords do not match`}
                                                                    </validator>
                                                                </Password>
                                                            </Bind>
                                                        </Grid.Col>
                                                    </Grid.Row>
                                                </Grid.Col>
                                            </Grid.Row>
                                            <Grid.Row>
                                                <Grid.Col all={12}>
                                                    <Bind>
                                                        <Switch label={t`Enabled`} name="enabled" />
                                                    </Bind>
                                                </Grid.Col>
                                            </Grid.Row>
                                        </View.Body>
                                        <View.Footer>
                                            <Button
                                                type="default"
                                                onClick={() => app.router.goToRoute("Users.List")}
                                                label={t`Go back`}
                                            />
                                            <Button
                                                type="primary"
                                                onClick={form.submit}
                                                label={t`Save user`}
                                                align="right"
                                            />
                                        </View.Footer>
                                    </View.Form>
                                );
                            }}
                        </Form>
                    )}
                </FormData>
            </AdminLayout>
        );
    }
}

export default createComponent(UsersForm, {
    modules: [
        "View",
        "Form",
        "FormData",
        "FormError",
        "Grid",
        "Input",
        "Password",
        "Switch",
        "Button",
        "Section",
        "Loader",
        "OptionsData",
        "AutoCompleteList",
        {
            AdminLayout: "Admin.Layout"
        }
    ]
});
