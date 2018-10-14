// @flow
import * as React from "react";
import { i18n } from "webiny-app/i18n";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import { Form } from "webiny-form";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "webiny-app-admin/components/Views/SimpleForm";

const t = i18n.namespace("Security.ApiTokensForm");

const ApiTokensForm = ({ data, onSubmit, invalidFields }: Object) => {
    return (
        <Form data={data} invalidFields={invalidFields} onSubmit={onSubmit}>
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
export default ApiTokensForm;
