import React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import MenuItems from "./MenuItems";
import { CircularProgress } from "@webiny/ui/Progress";
import { READ_MENU } from "../graphql";
import { useQuery } from "react-apollo";
import { i18n } from "@webiny/app/i18n";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";

const t = i18n.ns("app-page-builder/admin/menus/form");

const MenuForm = ({menu}) => {
    console.log("Menu Template:::::::::::")
    console.log(menu);
    const variables = {
        id: menu
    }

    const { data, loading: menuLoading, refetch } = useQuery(READ_MENU, {variables});

    if (menuLoading) {
        return <span>Loading...</span>
    } 

    if (!data) {
        return <span>Couln't find Menu!</span>
    }

    const menuData = data?.pageBuilder?.menu?.data;

    let { id, title, slug, description, items, createdOn, loading } = menuData;
  
    return (
        <Form {...menuData} data={id ? { id, title, slug, description, items, createdOn } : { items: [] }}>
            {({ data, form, Bind }) => (
                <SimpleForm data-testid={"pb-menus-form"}>
                    {loading && <CircularProgress />}
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={6}>
                                <Bind name="title" validators={validation.create("required")}>
                                    <Input label={t`Name`} />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind name="slug" validators={validation.create("required")}>
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
                </SimpleForm>
            )}
        </Form>
    );
}
export default MenuForm;