import React, { useCallback, useMemo } from "react";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { useMutation, useQuery } from "react-apollo";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { validation } from "@webiny/validation";
import { GET_MENU, CREATE_MENU, UPDATE_MENU, LIST_MENUS } from "./graphql";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Input } from "@webiny/ui/Input";
import MenuItems from "./MenusForm/MenuItems";

const t = i18n.ns("app-page-builder/admin/menus/form");

const MenusForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const slug = new URLSearchParams(location.search).get("slug");

    const getQuery = useQuery(GET_MENU, {
        variables: { slug },
        skip: !slug,
        onCompleted: data => {
            const error = data?.pageBuilder?.getMenu?.error;
            if (error) {
                history.push("/page-builder/menus");
                showSnackbar(error.message);
            }
        }
    });

    const [create, createMutation] = useMutation(CREATE_MENU, {
        refetchQueries: [{ query: LIST_MENUS }]
    });

    const [update, updateMutation] = useMutation(UPDATE_MENU, {
        refetchQueries: [{ query: LIST_MENUS }]
    });

    const loading = [getQuery, createMutation, updateMutation].find(item => item.loading);

    const onSubmit = useCallback(
        async data => {
            const isUpdate = slug;
            const [operation, args] = isUpdate
                ? [update, { variables: { slug: data.slug, data } }]
                : [create, { variables: { data } }];

            const response = await operation(args);

            const error = response?.data?.pageBuilder?.menu?.error;
            if (error) {
                return showSnackbar(error.message);
            }

            !isUpdate && history.push(`/page-builder/menus?slug=${data.slug}`);
            showSnackbar(t`Menu saved successfully.`);
        },
        [slug]
    );

    const data = useMemo(() => {
        const data = getQuery.data?.pageBuilder?.getMenu.data || {};
        if (!data.items) {
            data.items = [];
        }
        return data;
    }, [getQuery.data?.pageBuilder?.getMenu.data.slug]);

    return (
        <Form data={data} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm data-testid={"pb-menus-form"}>
                    {loading && <CircularProgress />}
                    <SimpleFormHeader title={data.slug || t`New menu`} />
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
                    <SimpleFormFooter>
                        <ButtonPrimary onClick={form.submit}>{t`Save menu`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default MenusForm;
