// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
// Webiny imports
import { i18n } from "webiny-app/i18n";
import { withForm, withRouter } from "webiny-app/components";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import { ButtonPrimary } from "webiny-ui/Button";
import { refreshDataList } from "webiny-app/actions";
import { withSnackbar } from "webiny-app-admin/components";
import { withTheme } from "webiny-app-cms/theme";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "webiny-app-admin/components/Views/SimpleForm";
import { categoryUrlValidator } from "./validators";

const t = i18n.namespace("Cms.CategoriesForm");

class CategoriesForm extends React.Component<*> {
    render() {
        const { CmsCategoriesForm, theme, router, showSnackbar, refreshDataList } = this.props;

        return (
            <Form
                {...CmsCategoriesForm}
                onSubmit={data => {
                    CmsCategoriesForm.submit({
                        data,
                        onSuccess: data => {
                            showSnackbar(
                                t`Category {name} saved successfully.`({
                                    name: data.name
                                })
                            );
                            router.goToRoute({ params: { id: data.id }, merge: true });
                            refreshDataList({ name: "CategoriesDataList" });
                        }
                    });
                }}
            >
                {({ data, form, Bind }) => (
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
                                    <Bind
                                        name="url"
                                        validators={["required", categoryUrlValidator]}
                                    >
                                        <Input disabled={data.id} label={t`URL`} />
                                    </Bind>
                                </Cell>
                                <Cell span={6}>
                                    <Bind name="layout" defaultValue={""}>
                                        <Select label={t`Layout`}>
                                            {theme.layouts.map(({ name, title }) => (
                                                <option key={name} value={name}>
                                                    {title}
                                                </option>
                                            ))}
                                        </Select>
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
                )}
            </Form>
        );
    }
}

export default compose(
    connect(
        null,
        { refreshDataList }
    ),
    withSnackbar(),
    withRouter(),
    withForm({
        name: "CmsCategoriesForm",
        type: "Cms.Categories",
        fields: "id name slug url layout"
    }),
    withTheme()
)(CategoriesForm);
