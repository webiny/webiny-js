import React from "react";
import _ from "lodash";
import EndpointPermissions from "./PermissionsForm/EndpointPermissions";
import { i18n, app, createComponent } from "webiny-app";
const t = i18n.namespace("Security.PermissionsForm");

class PermissionsForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    onToggleMethod(model, form, classId, method) {
        let rule = _.find(model.rules, { classId });
        let methodIndex = _.findIndex(rule.methods, { method });
        if (methodIndex >= 0) {
            rule.methods.splice(methodIndex, 1);
        } else {
            rule.methods.push({ method });
        }
        form.setState({ model });
    }

    onAddEndpoint(model, form, endpoint) {
        model.rules.push({
            classId: endpoint.classId,
            methods: []
        });
        form.setState({ model });
    }

    onRemoveEndpoint(model, form, endpoint) {
        const pIndex = _.findIndex(model.rules, { classId: endpoint.classId });
        model.rules.splice(pIndex, 1);
        form.setState({ model });
    }

    render() {
        const newUserPermission = !app.router.getParams("id");
        const { Ui } = this.props;

        return (
            <Ui.AdminLayout>
                <Ui.Form
                    api="/security/permissions"
                    fields="id,name,slug,description,rules[classId,methods.method]"
                    connectToRouter
                    onSubmitSuccess="Permissions.List"
                    onCancel="Permissions.List"
                    defaultModel={{ rules: [] }}
                    onSuccessMessage={({ model }) => {
                        return (
                            <span>
                                {t`Permission {permission} was saved successfully!`({
                                    permission: <strong>{model.name}</strong>
                                })}
                            </span>
                        );
                    }}
                >
                    {({ model, form }) => {
                        return (
                            <Ui.View.Form>
                                <Ui.View.Header
                                    title={
                                        model.id
                                            ? t`Security - Edit permission`
                                            : t`Security - Create permission`
                                    }
                                />
                                <Ui.View.Body>
                                    <Ui.Section title={t`General`} />
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={6}>
                                            <Ui.Input
                                                label={t`Name`}
                                                name="name"
                                                validate="required"
                                            />
                                        </Ui.Grid.Col>
                                        <Ui.Grid.Col all={6}>
                                            <Ui.Input label={t`Slug`} name="slug" />
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>
                                    <Ui.Grid.Row>
                                        <Ui.Grid.Col all={12}>
                                            <Ui.Input
                                                label={t`Description`}
                                                name="description"
                                                validate="required"
                                            />
                                            <Ui.Tabs>
                                                <Ui.Tabs.Tab label={t`Entities`}>
                                                    {(newUserPermission || model.id) && (
                                                        <EndpointPermissions
                                                            model={model}
                                                            onToggleMethod={(classId, method) =>
                                                                this.onToggleMethod(
                                                                    model,
                                                                    form,
                                                                    classId,
                                                                    method
                                                                )
                                                            }
                                                            onAddEndpoint={endpoint =>
                                                                this.onAddEndpoint(
                                                                    model,
                                                                    form,
                                                                    endpoint
                                                                )
                                                            }
                                                            onRemoveEndpoint={endpoint =>
                                                                this.onRemoveEndpoint(
                                                                    model,
                                                                    form,
                                                                    endpoint
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </Ui.Tabs.Tab>
                                            </Ui.Tabs>
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Row>
                                </Ui.View.Body>
                                <Ui.View.Footer>
                                    <Ui.Button
                                        type="default"
                                        onClick={form.cancel}
                                        label={t`Go back`}
                                    />
                                    <Ui.Button
                                        type="primary"
                                        onClick={form.submit}
                                        label={t`Save permission`}
                                        align="right"
                                    />
                                </Ui.View.Footer>
                            </Ui.View.Form>
                        );
                    }}
                </Ui.Form>
            </Ui.AdminLayout>
        );
    }
}

export default createComponent(PermissionsForm, {
    modulesProp: "Ui",
    modules: [
        { AdminLayout: "Skeleton.AdminLayout" },
        "Form",
        "Section",
        "View",
        "Grid",
        "Tabs",
        "Input",
        "Label",
        "Button",
        "Switch",
        "Date"
    ]
});
