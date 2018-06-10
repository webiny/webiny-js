import React from "react";
import { app, i18n, createComponent } from "webiny-app";

const t = i18n.namespace("Security.ApiTokensForm");

class ApiTokensForm extends React.Component {
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
            Textarea,
            Loader,
            AutoCompleteList
        } = this.props.modules;

        return (
            <AdminLayout>
                <FormData
                    entity="SecurityApiToken"
                    withRouter
                    fields="id name token description groups { id name } policies { id name }"
                    onSubmitSuccess="ApiTokens.List"
                    onCancel="ApiTokens.List"
                    defaultModel={{ groups: [], policies: [] }}
                    onSuccessMessage={data => (
                        <span>
                            {t`API Token {apiToken} was saved successfully!`({
                                apiToken: <strong>{data.model.firstName}</strong>
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
                                                    ? t`Security - Edit API Token`
                                                    : t`Security - Create API Token`
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
                                                                    label={t`Name`}
                                                                    name="name"
                                                                    validators="required"
                                                                />
                                                            </Bind>
                                                        </Grid.Col>
                                                    </Grid.Row>
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <Bind>
                                                                <Textarea
                                                                    label={t`Short description`}
                                                                    name="description"
                                                                />
                                                            </Bind>
                                                        </Grid.Col>
                                                    </Grid.Row>
                                                </Grid.Col>

                                                <Grid.Col all={6}>
                                                    <Section title={t`Roles and policies`} />
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <Grid.Row>
                                                                <Grid.Col all={12}>
                                                                    <OptionsData
                                                                        entity="SecurityGroup"
                                                                        fields="id name"
                                                                        labelField="name"
                                                                        perPage={10}
                                                                        search={{
                                                                            fields: ["name"],
                                                                            query: this.state
                                                                                .searchQuery.group
                                                                        }}
                                                                    >
                                                                        {({ options }) => (
                                                                            <Bind>
                                                                                <AutoCompleteList
                                                                                    options={
                                                                                        options
                                                                                    }
                                                                                    label={t`Groups`}
                                                                                    name="groups"
                                                                                    onSearch={query => {
                                                                                        this.setState(
                                                                                            state => {
                                                                                                state.searchQuery.group = query;
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
                                                                {({ options }) => (
                                                                    <Bind>
                                                                        <AutoCompleteList
                                                                            options={options}
                                                                            label={t`Policies`}
                                                                            name="policies"
                                                                            onSearch={query => {
                                                                                this.setState(
                                                                                    state => {
                                                                                        state.searchQuery.policy = query;
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
                                            </Grid.Row>

                                            <Grid.Row>
                                                <Grid.Col all={12}>
                                                    <Section title={t`API Token`} />
                                                    <Bind>
                                                        <Textarea
                                                            label={t`Token`}
                                                            name="token"
                                                            placeholder={t`Save API token first...`}
                                                            disabled
                                                            description={t`Sent via "Authorization" header. Generated automatically and cannot be changed.`}
                                                        />
                                                    </Bind>
                                                </Grid.Col>
                                            </Grid.Row>
                                        </View.Body>
                                        <View.Footer>
                                            <Button
                                                type="default"
                                                onClick={() =>
                                                    app.router.goToRoute("ApiTokens.List")
                                                }
                                                label={t`Go back`}
                                            />
                                            <Button
                                                type="primary"
                                                onClick={form.submit}
                                                label={t`Save API Token`}
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

export default createComponent(ApiTokensForm, {
    modules: [
        "View",
        "Form",
        "FormData",
        "FormError",
        "Grid",
        "Input",
        "Textarea",
        "Button",
        "Section",
        "Loader",
        "OptionsData",
        "AutoCompleteList",
        "Link",
        {
            AdminLayout: "Admin.Layout"
        }
    ]
});
