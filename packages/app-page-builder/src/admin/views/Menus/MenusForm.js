// @flow
import * as React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import MenuItems from "./MenusForm/MenuItems";
import { CircularProgress } from "@webiny/ui/Progress";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import { i18n } from "@webiny/app/i18n";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";

const t = i18n.ns("app-page-builder/admin/menus/form");

function MenusForm() {
    const { form } = useCrud();

    return (
        <Form {...form} data={form.id ? form.data : { items: [] }}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    {form.loading && <CircularProgress />}
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
                            {props => <MenuItems menuForm={form} {...props} />}
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

export default MenusForm;
