// @flow
import * as React from "react";
import { i18n } from "webiny-app/i18n";
import { withForm, withRouter } from "webiny-app/components";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import { ButtonPrimary } from "webiny-ui/Button";
import compose from "recompose/compose";
import { withSnackbar } from "webiny-app-admin/components";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "webiny-app-admin/components/Views/SimpleForm";

const t = i18n.namespace("Cms.CategoriesForm");

const categoryURL = value => {
    if (value.startsWith("/") && value.endsWith("/")) {
        return true;
    }

    throw new Error("Category URL must begin and end with a forward slash (`/`)");
};

class CategoriesForm extends React.Component<*> {
    render() {
        const { CmsCategoriesForm, router } = this.props;

        return (
            <Form
                {...CmsCategoriesForm}
                onSubmit={data => {
                    CmsCategoriesForm.submit({
                        data,
                        onSuccess: data => {
                            this.props.showSnackbar(
                                t`Category {name} saved successfully.`({
                                    name: data.name
                                })
                            );
                            router.goToRoute({ params: { id: data.id }, merge: true });
                        }
                    });
                }}
            >
                {({ data, form, Bind }) => (
                    <div style={{ padding: 50, backgroundColor: "var(--mdc-theme-background)" }}>
                        <SimpleForm>
                            <SimpleFormContent>
                                <Grid>
                                    <Cell span={6}>
                                        <Bind name="name">
                                            <Input label={t`Name`} />
                                        </Bind>
                                    </Cell>
                                    <Cell span={6}>
                                        <Bind name="slug" validators={["required"]}>
                                            <Input disabled={data.id} label={t`Slug`} />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name="url" validators={["required", categoryURL]}>
                                            <Input disabled={data.id} label={t`URL`} />
                                        </Bind>
                                    </Cell>
                                    <Cell span={6}>
                                        <Bind name="layout">
                                            <Select label={t`Layout`} />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </SimpleFormContent>
                            <SimpleFormFooter>
                                <ButtonPrimary type="primary" onClick={form.submit} align="right">
                                    {t`Save category`}
                                </ButtonPrimary>
                            </SimpleFormFooter>
                        </SimpleForm>
                    </div>
                )}
            </Form>
        );
    }
}

export default compose(
    withSnackbar(),
    withRouter(),
    withForm({
        name: "CmsCategoriesForm",
        type: "Cms.Categories",
        fields: "id name slug url layout"
    })
)(CategoriesForm);
