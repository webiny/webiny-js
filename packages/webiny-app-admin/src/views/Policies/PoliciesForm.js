// @flow
import * as React from "react";
import { i18n } from "webiny-app/i18n";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import { withForm, withRouter } from "webiny-app/components";
import { withTheme, withSnackbar } from "webiny-app-admin/components";
import { refreshDataList, setFormData } from "webiny-app/actions";
import { dispatch } from "webiny-app/redux";
import compose from "recompose/compose";
import { connect } from "react-redux";

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

const t = i18n.namespace("Security.PoliciesForm");

const PoliciesForm = props => {
    const {
        SecurityPolicyForm,
        router,
        refreshDataList,
        theme: { dark: darkTheme }
    } = props;

    return (
        <Form
            {...SecurityPolicyForm}
            onSubmit={data => {
                SecurityPolicyForm.submit({
                    data: {
                        ...data,
                        permissions: data.permissions && JSON.parse(data.permissions)
                    },
                    onSuccess: data => {
                        dispatch(
                            setFormData({
                                name: "SecurityPolicyForm",
                                data: {
                                    ...data,
                                    permissions: JSON.stringify(data.permissions, null, 2)
                                }
                            })
                        );
                        props.showSnackbar(
                            t`Policy {name} saved successfully.`({ name: data.name })
                        );
                        router.goToRoute({ params: { id: data.id }, merge: true });
                        refreshDataList({ name: "PoliciesDataList" });
                    }
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
                        <ButtonPrimary type="primary" onClick={form.submit} align="right">
                            {t`Save policy`}
                        </ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default compose(
    connect(
        null,
        { refreshDataList }
    ),
    withTheme(),
    withSnackbar(),
    withRouter(),
    withForm({
        name: "SecurityPolicyForm",
        type: "Security.Policies",
        fields: "id name slug description permissions",
        onSuccess: data => {
            dispatch(
                setFormData({
                    name: "SecurityPolicyForm",
                    data: {
                        ...data.data,
                        permissions: JSON.stringify(data.data.permissions, null, 2)
                    }
                })
            );
        }
    })
)(PoliciesForm);
