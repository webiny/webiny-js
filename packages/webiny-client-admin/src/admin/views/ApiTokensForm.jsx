import React from "react";
import { app, i18n, Component } from "webiny-client";
const t = i18n.namespace("Security.ApiTokensForm");

@Component({
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
        "Alert",
        "Copy",
        {
            AdminLayout: "Admin.Layout"
        }
    ]
})
class ApiTokensForm extends React.Component {
    constructor() {
        super();
        this.state = {
            searchQuery: {}
        };
    }

    render() {
        const {
            Alert,
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
            AutoCompleteList,
            Copy
        } = this.props.modules;

        const onSubmitSuccess = app.router.getParams().id ? "ApiTokens.List" : null;

        return (
            <AdminLayout>
                <FormData
                    entity="SecurityApiToken"
                    withRouter
                    fields="id name token description groups { id name } policies { id name }"
                    onSubmitSuccess={onSubmitSuccess}
                    onCancel="ApiTokens.List"
                    defaultModel={{ groups: [], policies: [] }}
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
                                            {model.id && (
                                                <Alert type="info" title={t`Success`}>
                                                    {t`To disable API token, you must delete it.`}
                                                </Alert>
                                            )}

                                            {loading && <Loader />}
                                            <Grid.Row>
                                                <Grid.Col all={6}>
                                                    <Section title={t`Info`} />
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <Bind name="name" validators={["required"]}>
                                                                <Input label={t`Name`} />
                                                            </Bind>
                                                        </Grid.Col>
                                                    </Grid.Row>
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <Bind name="description">
                                                                <Textarea label={t`Short description`} />
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
                                                                            <Bind name="groups">
                                                                                <AutoCompleteList
                                                                                    options={
                                                                                        options
                                                                                    }
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
                                            </Grid.Row>

                                            <Grid.Row>
                                                <Grid.Col all={12}>
                                                    <Section title={t`API Token`} />
                                                    <Bind name="token">

                                                        <Copy.Input
                                                            label={t`Token`}
                                                            placeholder={t`To receive a token, you must save it first.`}
                                                            disabled
                                                            description={t`Sent via "Authorization" header. Generated automatically and cannot be changed.`} />
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

export default ApiTokensForm;
