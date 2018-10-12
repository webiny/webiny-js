// @flow
import * as React from "react";
import { compose, withHandlers, withProps, withState } from "recompose";
import styled from "react-emotion";
import { get } from "dot-prop-immutable";
import { graphql, Query } from "react-apollo";
import { i18n } from "webiny-app/i18n";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import { withRouter } from "webiny-app/components";
import { withTheme, withSnackbar } from "webiny-app-admin/components";
import { loadPolicy, createPolicy, updatePolicy } from "./graphql";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-app-admin/components/Views/SimpleForm";

import { CodeEditor } from "webiny-ui/CodeEditor";
import "brace/mode/json";
import "brace/theme/chrome";
import "brace/theme/twilight";

import PolicyEditorDialog from "./PoliciesForm/PolicyEditorDialog";
const t = i18n.namespace("Security.PoliciesForm");

const PolicyEditorDialogButton = styled("div")({
    marginBottom: 10,
    float: "right"
});

class PoliciesForm extends React.Component<*, { showFullScreenPolicyEditor: boolean }> {
    state = { showFullScreenPolicyEditor: false };
    render() {
        const {
            id,
            savePolicy,
            formErrors,
            theme: { darkTheme = false }
        } = this.props;

        return (
            <Query query={loadPolicy} variables={{ id }} skip={!id}>
                {({ data }) => {
                    let formData = get(data, "Security.Policies.one") || {};
                    if (id) {
                        formData = {
                            ...formData,
                            permissions: JSON.stringify(formData.permissions || {}, null, 2)
                        };
                    }

                    return (
                        <Form
                            invalidFields={formErrors}
                            data={formData}
                            onSubmit={data => {
                                savePolicy({
                                    ...data,
                                    permissions: data.permissions && JSON.parse(data.permissions)
                                });
                            }}
                        >
                            {({ data, form, Bind }) => (
                                <SimpleForm>
                                    <SimpleFormHeader title={data.name ? data.name : "Untitled"} />
                                    <SimpleFormContent>
                                        <Grid>
                                            <Cell span={6}>
                                                <Bind name="name" validators={["required"]}>
                                                    <Input label={t`Name`} />
                                                </Bind>
                                            </Cell>
                                            <Cell span={6}>
                                                <Bind name="slug" validators={["required"]}>
                                                    <Input disabled={data.id} label={t`Slug`} />
                                                </Bind>
                                            </Cell>
                                        </Grid>
                                        <Grid>
                                            <Cell span={12}>
                                                <Bind name="description" validators={["required"]}>
                                                    <Input label={t`Description`} rows={4} />
                                                </Bind>
                                            </Cell>
                                        </Grid>
                                        <Grid>
                                            <Cell span={12}>
                                                <PolicyEditorDialogButton>
                                                    <ButtonPrimary
                                                        onClick={() =>
                                                            this.setState({
                                                                showFullScreenPolicyEditor: true
                                                            })
                                                        }
                                                    >
                                                        {t`Open in dialog`}
                                                    </ButtonPrimary>
                                                </PolicyEditorDialogButton>
                                                <PolicyEditorDialog
                                                    open={this.state.showFullScreenPolicyEditor}
                                                    onClose={() =>
                                                        this.setState({
                                                            showFullScreenPolicyEditor: false
                                                        })
                                                    }
                                                >
                                                    <Bind name="permissions" validators={["json"]}>
                                                        <CodeEditor
                                                            maxLines={40}
                                                            mode="json"
                                                            fontSize={14}
                                                            theme={
                                                                darkTheme ? "twilight" : "github"
                                                            }
                                                        />
                                                    </Bind>
                                                </PolicyEditorDialog>
                                                <Bind name="permissions" validators={["json"]}>
                                                    <CodeEditor
                                                        mode="json"
                                                        fontSize={14}
                                                        theme={darkTheme ? "twilight" : "github"}
                                                    />
                                                </Bind>
                                            </Cell>
                                        </Grid>
                                    </SimpleFormContent>
                                    <SimpleFormFooter>
                                        <ButtonPrimary
                                            type="primary"
                                            onClick={form.submit}
                                            align="right"
                                        >
                                            {t`Save policy`}
                                        </ButtonPrimary>
                                    </SimpleFormFooter>
                                </SimpleForm>
                            )}
                        </Form>
                    );
                }}
            </Query>
        );
    }
}

export default compose(
    withTheme(),
    withSnackbar(),
    withRouter(),
    graphql(createPolicy, { name: "createPolicy" }),
    graphql(updatePolicy, { name: "updatePolicy" }),
    withProps(({ router }) => ({
        id: router.getQuery("id"),
        theme: {
            // TODO:
            darkTheme: false
        }
    })),
    withState("formErrors", "setFormErrors", null),
    withHandlers({
        saveRole: ({ router, showSnackbar, id, updatePolicy, createPolicy, setFormErrors }) => (
            data: Object
        ) => {
            const operation = data.id
                ? updatePolicy({ variables: { id, data } })
                : createPolicy({ variables: { data } });
            return operation.then(res => {
                const { data, error } = res.security.policy;
                if (error) {
                    return setFormErrors(error.data);
                }
                showSnackbar(t`Role {name} saved successfully.`({ name: data.name }));
                router.goToRoute({ params: { id: data.id }, merge: true });
                // TODO: refreshDataList({ name: "PoliciesDataList" });
            });
        }
    })
)(PoliciesForm);
