import React from "react";
import { app, i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.RolesForm");

class RolesForm extends React.Component {
    constructor() {
        super();
        this.state = { searchQuery: {} };
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
            Loader,
            AutoCompleteList
        } = this.props.modules;

        return (
            <AdminLayout>
                <FormData
                    entity="SecurityRole"
                    withRouter
                    fields="id name slug description permissions { id name }"
                    defaultModel={{ permissions: [] }}
                    onSubmitSuccess="Roles.List"
                    onCancel="Roles.List"
                    onSuccessMessage={({ model }) => {
                        return (
                            <span>
                                {t`Role {role} was saved successfully!`({
                                    role: <strong>{model.name}</strong>
                                })}
                            </span>
                        );
                    }}
                >
                    {({ model, onSubmit, invalidFields, error, loading }) => (
                        <Form model={model} onSubmit={onSubmit} invalidFields={invalidFields}>
                            {({ model, form, Bind }) => {
                                return (
                                    <View.Form>
                                        <View.Header
                                            title={
                                                model.id
                                                    ? t`Security - Edit Role`
                                                    : t`Security - Create Role`
                                            }
                                        />
                                        {error && (
                                            <View.Error>
                                                <FormError error={error} />
                                            </View.Error>
                                        )}
                                        <View.Body>
                                            {loading && <Loader />}
                                            <Section title={t`General`} />
                                            <Grid.Row>
                                                <Grid.Col all={6}>
                                                    <Bind>
                                                        <Input
                                                            label={t`Name`}
                                                            name="name"
                                                            validate="required"
                                                        />
                                                    </Bind>
                                                </Grid.Col>
                                                <Grid.Col all={6}>
                                                    <Bind>
                                                        <Input
                                                            label={t`Slug`}
                                                            name="slug"
                                                            validate="required"
                                                        />
                                                    </Bind>
                                                </Grid.Col>
                                            </Grid.Row>
                                            <Grid.Row>
                                                <Grid.Col all={12}>
                                                    <Bind>
                                                        <Input
                                                            label={t`Description`}
                                                            name="description"
                                                            validate="required"
                                                        />
                                                    </Bind>
                                                </Grid.Col>
                                            </Grid.Row>{" "}
                                            <Grid.Row>
                                                <Grid.Col all={12}>
                                                    <OptionsData
                                                        entity="SecurityPermission"
                                                        fields="id name"
                                                        labelField="name"
                                                        perPage={10}
                                                        search={{
                                                            fields: ["name"],
                                                            query: this.state.searchQuery
                                                        }}
                                                    >
                                                        {({ options }) => (
                                                            <Bind>
                                                                <AutoCompleteList
                                                                    options={options}
                                                                    label={t`Permissions`}
                                                                    name="permissions"
                                                                    onSearch={query => {
                                                                        this.setState({
                                                                            searchQuery: query
                                                                        });
                                                                    }}
                                                                />
                                                            </Bind>
                                                        )}
                                                    </OptionsData>
                                                </Grid.Col>
                                            </Grid.Row>
                                        </View.Body>
                                        <View.Footer>
                                            <Button
                                                type="default"
                                                onClick={() => app.router.goToRoute("Roles.List")}
                                                label={t`Go back`}
                                            />
                                            <Button
                                                type="primary"
                                                onClick={form.submit}
                                                label={t`Save role`}
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

export default createComponent(RolesForm, {
    modules: [
        "Form",
        "FormData",
        "OptionsData",
        "FormError",
        "View",
        "Input",
        "Button",
        "Grid",
        "Section",
        "Loader",
        "AutoCompleteList",
        {
            AdminLayout: "Admin.Layout"
        }
    ]
});
