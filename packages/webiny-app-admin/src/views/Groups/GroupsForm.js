// @flow
import * as React from "react";
import { i18n } from "webiny-app/i18n";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import { withForm, withRouter } from "webiny-app/components";
import { withSnackbar } from "webiny-app-admin/components";
import { refreshDataList } from "webiny-app/actions";
import compose from "recompose/compose";
import { connect } from "react-redux";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "webiny-app-admin/components/Views/SimpleForm";

const t = i18n.namespace("Security.GroupsForm");

const GroupsForm = props => {
    const { SecurityGroupForm, router, refreshDataList } = props;

    return (
        <Form
            {...SecurityGroupForm}
            onSubmit={data => {
                SecurityGroupForm.submit({
                    data,
                    onSuccess: data => {
                        props.showSnackbar(
                            t`Group {name} saved successfully.`({ name: data.name })
                        );
                        router.goToRoute({ params: { id: data.id }, merge: true });
                        refreshDataList({ name: "GroupsDataList" });
                    }
                });
            }}
        >
            {({ data, form, Bind }) => (
                <SimpleForm>
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
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary type="primary" onClick={form.submit} align="right">
                            {t`Save group`}
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
    withSnackbar(),
    withRouter(),
    withForm({
        name: "SecurityGroupForm",
        type: "Security.Groups",
        fields: "id name slug description"
    })
)(GroupsForm);
