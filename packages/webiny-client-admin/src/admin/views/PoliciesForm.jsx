import React from "react";
import { app, i18n, Component } from "webiny-client";
import EntitiesList from "./PoliciesForm/EntitiesList";
import ApiAccess from "./PoliciesForm/ApiAccess";

const t = i18n.namespace("Security.PoliciesForm");

@Component({
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
        "Tabs",
        {
            AdminLayout: "Admin.Layout"
        }
    ]
})
class PoliciesForm extends React.Component {
    render() {
        const {
            AdminLayout,
            Form,
            FormData,
            FormError,
            View,
            Grid,
            Input,
            Button,
            Loader,
            Tabs
        } = this.props.modules;

        return (
            <AdminLayout>
                <FormData
                    entity="SecurityPolicy"
                    withRouter
                    fields="id name slug description permissions"
                    onSubmitSuccess="Policies.List"
                    onCancel="Policies.List"
                    onSuccessMessage={({ model }) => {
                        return (
                            <span>
                                {t`Policy {policy} was saved successfully!`({
                                    policy: <strong>{model.name}</strong>
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
                                                    ? t`Security - Edit Policy`
                                                    : t`Security - Create Policy`
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
                                                    <Bind name="name" validators={["required"]}>
                                                        <Input label={t`Name`} />
                                                    </Bind>
                                                </Grid.Col>
                                                <Grid.Col all={6}>
                                                    <Bind name="slug" validators={["required"]}>
                                                        <Input label={t`Slug`} />
                                                    </Bind>
                                                </Grid.Col>
                                            </Grid.Row>
                                            <Grid.Row>
                                                <Grid.Col all={12}>
                                                    <Bind name="description" validators={["required"]}>
                                                        <Input label={t`Description`} />
                                                    </Bind>
                                                </Grid.Col>
                                            </Grid.Row>

                                            <Tabs size="large">
                                                <Tabs.Tab label={t`Entity permissions`}>
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <EntitiesList
                                                                model={model}
                                                                form={form}
                                                            />
                                                        </Grid.Col>
                                                    </Grid.Row>
                                                </Tabs.Tab>
                                                <Tabs.Tab label={t`API access`}>
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <ApiAccess model={model} form={form} />
                                                        </Grid.Col>
                                                    </Grid.Row>
                                                </Tabs.Tab>
                                            </Tabs>
                                        </View.Body>
                                        <View.Footer>
                                            <Button
                                                type="default"
                                                onClick={() => app.router.goToRoute("Policies.List")}
                                                label={t`Go back`}
                                            />
                                            <Button
                                                type="primary"
                                                onClick={form.submit}
                                                label={t`Save policy`}
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

export default PoliciesForm;
