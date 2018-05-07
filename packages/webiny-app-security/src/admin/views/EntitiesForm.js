import React from "react";
import Scopes from "./EntitiesForm/Scopes";

import { app, i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.EntitiesForm");

class EntitiesForm extends React.Component {
    render() {
        const {
            AdminLayout,
            Form,
            FormData,
            FormError,
            Section,
            View,
            Grid,
            Input,
            Button,
            Loader
        } = this.props.modules;




        return (

            <AdminLayout>
                <FormData
                    entity="SecurityEntity"
                    withRouter
                    fields="id name slug description scope createdOn"
                    onSubmitSuccess="Entities.List"
                    onCancel="Entities.List"
                    defaultModel={{ scope: {} }}
                    onSuccessMessage={({ model }) => {
                        return (
                            <span>
                                {t`Entity {entity} was saved successfully!`({
                                    entity: <strong>{model.name}</strong>
                                })}
                            </span>
                        );
                    }}
                >
                    {({ model, onSubmit, error, loading, invalidFields }) => (
                        <Form model={model} onSubmit={onSubmit} invalidFields={invalidFields}>
                            {({ model, form, Bind }) => {
                                return (
                                    <View.Form>
                                        <View.Header
                                            title={
                                                model.id
                                                    ? t`Security - Edit entity`
                                                    : t`Security - Create entity`
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
                                                            validators="required"
                                                        />
                                                    </Bind>
                                                </Grid.Col>
                                                <Grid.Col all={6}>
                                                    <Bind>
                                                        <Input
                                                            label={t`Slug`}
                                                            name="slug"
                                                            validators="required"
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
                                                            validators="required"
                                                        />
                                                    </Bind>
                                                </Grid.Col>
                                            </Grid.Row>
                                            <br />
                                            <Grid.Row>
                                                <Grid.Col all={12}>
                                                    <Scopes model={model} form={form} />
                                                </Grid.Col>
                                            </Grid.Row>
                                        </View.Body>
                                        <View.Footer>
                                            <Button
                                                type="default"
                                                onClick={() =>
                                                    app.router.goToRoute("Entities.List")
                                                }
                                                label={t`Go back`}
                                            />
                                            <Button
                                                type="primary"
                                                onClick={form.submit}
                                                label={t`Save entity`}
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

export default createComponent(EntitiesForm, {
    modules: [
        { AdminLayout: "Admin.Layout" },
        "Form",
        "FormData",
        "FormError",
        "Section",
        "View",
        "Grid",
        "Input",
        "Button",
        "Loader"
    ]
});
