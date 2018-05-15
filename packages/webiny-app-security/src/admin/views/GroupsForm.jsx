import React from "react";
import { app, i18n, createComponent } from "webiny-app";
import EntitiesList from "./components/EntitiesList"
import ApiAccess from "./GroupsForm/ApiAccess";

const t = i18n.namespace("Security.GroupsForm");

class GroupsForm extends React.Component {
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
                    entity="SecurityGroup"
                    withRouter
                    fields="id name slug description permissions"
                    onSubmitSuccess="Groups.List"
                    onCancel="Groups.List"
                    onSuccessMessage={({ model }) => {
                        return (
                            <span>
                                {t`Group {group} was saved successfully!`({
                                    group: <strong>{model.name}</strong>
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
                                                    ? t`Security - Edit Group`
                                                    : t`Security - Create Group`
                                            }
                                        />
                                        {error && (
                                            <View.Error>
                                                <FormError error={error} />
                                            </View.Error>
                                        )}
                                        <View.Body>
                                            {loading && <Loader />}

                                            <Tabs size="large">
                                                <Tabs.Tab label={t`General`}>
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
                                                </Tabs.Tab>
                                                <Tabs.Tab label={t`Entity permissions`}>
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <EntitiesList model={model} form={form}/>
                                                        </Grid.Col>
                                                    </Grid.Row>
                                                </Tabs.Tab>
                                                <Tabs.Tab label={t`API access`}>
                                                    <Grid.Row>
                                                        <Grid.Col all={12}>
                                                            <ApiAccess model={model} form={form}/>
                                                        </Grid.Col>
                                                    </Grid.Row>
                                                </Tabs.Tab>
                                            </Tabs>
                                        </View.Body>
                                        <View.Footer>
                                            <Button
                                                type="default"
                                                onClick={() => app.router.goToRoute("Groups.List")}
                                                label={t`Go back`}
                                            />
                                            <Button
                                                type="primary"
                                                onClick={form.submit}
                                                label={t`Save group`}
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

export default createComponent(GroupsForm, {
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
});
