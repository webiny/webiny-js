// @flow
import * as React from "react";
import { i18n } from "webiny-app/i18n";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import MenuItemsForm from "./MenusForm/MenuItemsForm";
import type { WithCrudFormProps } from "webiny-app-admin/components";
import { withTheme, type WithThemeProps } from "webiny-app-cms/theme";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "webiny-app-admin/components/Views/SimpleForm";
const t = i18n.namespace("Cms.MenusForm");

type Props = WithCrudFormProps & WithThemeProps;
type State = {
    item: ?Object
};

class MenusForm extends React.Component<Props, State> {
    render() {
        const { data, invalidFields, onSubmit } = this.props;

        return (
            <Form data={data || { items: [] }} invalidFields={invalidFields} onSubmit={onSubmit}>
                {({ data, form, Bind }) => (
                    <SimpleForm>
                        <SimpleFormContent>
                            <Grid>
                                <Cell span={6}>
                                    <Bind name="title" validators={["required"]}>
                                        <Input label={t`Name`} />
                                    </Bind>
                                </Cell>
                                <Cell span={6}>
                                    <Bind name="slug" validators={["required"]}>
                                        <Input disabled={data.id} label={t`Slug`} />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name="description">
                                        <Input rows={5} label={t`Description`} />
                                    </Bind>
                                </Cell>
                            </Grid>
                            <Bind name="items">
                                {props => <MenuItemsForm menuForm={form} {...props} />}
                            </Bind>
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            <ButtonPrimary type="primary" onClick={form.submit} align="right">
                                {t`Save menu`}
                            </ButtonPrimary>
                        </SimpleFormFooter>
                    </SimpleForm>
                )}
            </Form>
        );
    }
}

export default withTheme()(MenusForm);
