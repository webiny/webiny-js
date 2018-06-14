import React from "react";
import {app, i18n, Component} from "webiny-client";

const t = i18n.namespace("Security.UsersForm");

@Component({
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
        "Tags",
        {
            AdminLayout: "Admin.Layout"
        }
    ]
})
class UsersForm extends React.Component {
    constructor() {
        super();

        this.state = {
            searchQuery: {}
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
            AutoCompleteList,
            Tags
        } = this.props.modules;

        return (
            <AdminLayout>
                <FormData
                    entity="SecurityUser"
                    withRouter
                    fields="id firstName lastName enabled email groups { id name } policies { id name }"
                    onSubmitSuccess="Users.List"
                    onCancel="Users.List"
                    defaultModel={{groups: [], policies: [], enabled: true}}
                    onSuccessMessage={data => (
                        <span>
                            {t`User {user} was saved successfully!`({
                                user: <strong>{data.model.firstName}</strong>
                            })}
                        </span>
                    )}
                >
                    {({model, onSubmit, loading, invalidFields, error}) => (
                        <Form model={model} onSubmit={onSubmit} invalidFields={invalidFields}>
                            {({model, form, Bind}) => {
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
                                                <FormError error={error}/>
                                            </View.Error>
                                        )}
                                        <View.Body>
                                            {loading && <Loader/>}
                                            <Grid.Row>
                                                <Grid.Col all={6}>
                                                    <Section title={t`Info`}/>
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <Bind name="firstName" validators={["required"]}>
                                                                <Input label={t`First name`} />
                                                            </Bind>
                                                            <Bind name="lastName" validators={["required"]}>
                                                                <Input label={t`Last name`} />
                                                            </Bind>
                                                            <Bind name="email" validators={["required", "email"]}>
                                                                <Input label={t`Email`} description={t`Your email`} />
                                                            </Bind>
                                                        </Grid.Col>
                                                    </Grid.Row>
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <OptionsData
                                                                entity="SecurityGroup"
                                                                fields="id name"
                                                                labelField="name"
                                                                perPage={10}
                                                                search={{
                                                                    fields: ["name"],
                                                                    query: this.state.searchQuery
                                                                        .group
                                                                }}
                                                            >
                                                                {({options}) => (
                                                                    <Bind name="groups">
                                                                        <AutoCompleteList
                                                                            options={options}
                                                                            label={t`Groups`}
                                                                            onSearch={query => {
                                                                                this.setState(
                                                                                    state => {
                                                                                        state.searchQuery.group = query;
                                                                                        return state;
                                                                                    }
                                                                                );
                                                                            }} />
                                                                    </Bind>
                                                                )}
                                                            </OptionsData>
                                                        </Grid.Col>
                                                    </Grid.Row>
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <OptionsData
                                                                entity="SecurityPolicy"
                                                                fields="id name"
                                                                labelField="name"
                                                                perPage={10}
                                                                search={{
                                                                    fields: ["name"],
                                                                    query: this.state.searchQuery
                                                                        .policy
                                                                }}
                                                            >
                                                                {({options}) => (
                                                                    <Bind name="policies">
                                                                        <AutoCompleteList
                                                                            options={options}
                                                                            label={t`Policies`}
                                                                            onSearch={query => {
                                                                                this.setState(
                                                                                    state => {
                                                                                        state.searchQuery.policy = query;
                                                                                        return state;
                                                                                    }
                                                                                );
                                                                            }} />
                                                                    </Bind>
                                                                )}
                                                            </OptionsData>
                                                        </Grid.Col>
                                                    </Grid.Row>
                                                </Grid.Col>
                                                <Grid.Col all={6}>
                                                    <Section title={t`Password`}/>
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <Bind name="password" validators={["password"]}>
                                                                <Password label={t`New password`} placeholder={t`Type a new password`} />
                                                            </Bind>

                                                            <Bind
                                                                name="confirmPassword"
                                                                validators={["password", "eq:@password"]}
                                                                name="eq">
                                                                <Password label={t`Confirm password`} placeholder={t`Retype the new password`}>
                                                                    <validator>
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
                                                    <Bind name="enabled">
                                                        <Switch label={t`Enabled`} />
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

export default UsersForm;
