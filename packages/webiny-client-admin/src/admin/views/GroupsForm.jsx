import React from "react";
import { app, i18n, inject } from "webiny-client";

const t = i18n.namespace("Security.GroupsForm");

@inject({
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
        "AutoCompleteList",
        {
            AdminLayout: "Admin.Layout"
        }
    ]
})
class GroupsForm extends React.Component {
    constructor() {
        super();

        this.state = {
            searchQuery: {
                policy: {}
            }
        };
    }

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
            Tabs,
            OptionsData,
            AutoCompleteList
        } = this.props.modules;

        return (
            <AdminLayout>
                <FormData
                    entity="SecurityGroup"
                    withRouter
                    fields="id name slug description policies { id name }"
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
                                            <Grid.Row>
                                                <Grid.Col all={12}>
                                                    <OptionsData
                                                        entity="SecurityPolicy"
                                                        fields="id name"
                                                        labelField="name"
                                                        perPage={10}
                                                        search={{
                                                            fields: ["name"],
                                                            query: this.state.searchQuery.policy
                                                        }}
                                                    >
                                                        {({ options }) => (
                                                            <Bind name="policies">
                                                                <AutoCompleteList
                                                                    options={options}
                                                                    label={t`Policies`}
                                                                    onSearch={query => {
                                                                        this.setState(state => {
                                                                            state.searchQuery.policy = query;
                                                                            return state;
                                                                        });
                                                                    }} />
                                                            </Bind>
                                                        )}
                                                    </OptionsData>
                                                </Grid.Col>
                                            </Grid.Row>
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

export default GroupsForm;
