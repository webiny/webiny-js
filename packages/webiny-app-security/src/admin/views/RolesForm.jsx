import React from "react";
import { GraphQLFormData, GraphQLFormError } from "webiny-data-ui";
import { app, i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.RolesForm");

class RolesForm extends React.Component {
    render() {
        const {
            AdminLayout,
            Form,
            Section,
            View,
            Grid,
            Input,
            Button,
            Loader
        } = this.props.modules;

        return (
            <AdminLayout>
                <GraphQLFormData
                    entity="SecurityRole"
                    withRouter
                    fields="id name slug description permissions { id }"
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
                                                <GraphQLFormError error={error} />
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
                </GraphQLFormData>
            </AdminLayout>
        );
    }
}

export default createComponent(RolesForm, {
    modules: [
        "Form",
        "View",
        "Input",
        "Button",
        "Grid",
        "Section",
        "Loader",
        {
            AdminLayout: "Admin.Layout"
        }
    ]
});
