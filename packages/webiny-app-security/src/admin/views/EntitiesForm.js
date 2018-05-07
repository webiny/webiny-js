import React from "react";
import Access from "./EntitiesForm/Access";

import { app, i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.EntitiesForm");

class EntitiesForm extends React.Component {
    render() {
        const {
            AdminLayout,
            Form,
            FormData,
            FormError,
            View,
            Grid,
            Button,
            Loader
        } = this.props.modules;

        return (
            <AdminLayout>
                <FormData
                    entity="EntityAccess"
                    withRouter
                    fields={`group {
                              operations {
                                read
                                create
                                update
                                delete
                              }
                              methods
                              attributes
                            }
                            other {
                              operations {
                                create
                                delete
                                update
                                read
                              }
                              methods
                              attributes
                            }
                            owner {
                              operations {
                                create
                                delete
                                update
                                read
                              }
                              methods
                              attributes
                            }
                            roles`}
                    onSubmitSuccess="Entities.List"
                    onCancel="Entities.List"
                    defaultModel={{ id: app.router.getParams("id") }}
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
                            {({ model, form }) => {
                                return (
                                    <View.Form>
                                        <View.Header title={t`Security - Edit entity`} />
                                        {error && (
                                            <View.Error>
                                                <FormError error={error} />
                                            </View.Error>
                                        )}
                                        <View.Body>
                                            {loading && <Loader />}
                                            <Grid.Row>
                                                <Grid.Col all={12}>
                                                    <Access model={model} form={form} />
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
        "View",
        "Grid",
        "Button",
        "Loader"
    ]
});
