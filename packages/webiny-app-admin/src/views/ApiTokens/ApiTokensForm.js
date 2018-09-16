// @flow
import * as React from "react";
import { i18n } from "webiny-app/i18n";
import { withForm, withRouter } from "webiny-app/components";
import { refreshDataList } from "webiny-app/actions";
import { withSnackbar } from "webiny-app-admin/components";

import { compose } from "recompose";

import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import { Form } from "webiny-form";
import { connect } from "react-redux";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "webiny-app-admin/components/Views/SimpleForm";

const t = i18n.namespace("Security.ApiTokensForm");

const ApiTokensForm = props => {
    const { SecurityApiTokenForm, router, refreshDataList } = props;

    return (
        <Form
            {...SecurityApiTokenForm}
            onSubmit={data => {
                SecurityApiTokenForm.submit({
                    data,
                    onSuccess: data => {
                        props.showSnackbar(
                            t`API token {name} saved successfully.`({
                                name: data.name
                            })
                        );
                        router.goToRoute({ params: { id: data.id }, merge: true });
                        refreshDataList({ name: "ApiTokensDataList" });
                    }
                });
            }}
        >
            {({ form, Bind }) => (
                <SimpleForm>
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="name" validators={["required"]}>
                                    <Input label={t`Name`} />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="description" validators={["required"]}>
                                    <Input rows={4} label={t`Description`} />
                                </Bind>
                            </Cell>
                        </Grid>

                        <Grid>
                            <Cell span={12}>
                                <Bind name="token">
                                    <Input
                                        rows={5}
                                        label={t`Token`}
                                        placeholder={t`To receive a token, you must save it first.`}
                                        disabled
                                        description={t`Sent via "Authorization" header. Generated automatically and cannot be changed.`}
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary type="primary" onClick={form.submit} align="right">
                            {t`Save API token`}
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
        name: "SecurityApiTokenForm",
        type: "Security.ApiTokens",
        fields: "id name slug description token permissions"
    })
)(ApiTokensForm);
