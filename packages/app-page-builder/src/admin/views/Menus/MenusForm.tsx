import React, { useCallback, useMemo } from "react";
import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonDefault, ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { useMutation, useQuery } from "@apollo/react-hooks";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { validation } from "@webiny/validation";
import {
    GET_MENU,
    CREATE_MENU,
    UPDATE_MENU,
    LIST_MENUS,
    GetMenuQueryResponse,
    GetMenuQueryVariables
} from "./graphql";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Input } from "@webiny/ui/Input";
import MenuItems from "./MenusForm/MenuItems";
import { useSecurity } from "@webiny/app-security";
import pick from "lodash/pick";
import get from "lodash/get";
import set from "lodash/set";
import isEmpty from "lodash/isEmpty";
import omit from "lodash/omit";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { PageBuilderSecurityPermission } from "~/types";

const t = i18n.ns("app-page-builder/admin/menus/form");
const ButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between"
});

interface MenusFormProps {
    canCreate: boolean;
}
const MenusForm: React.FC<MenusFormProps> = ({ canCreate }) => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const newEntry = new URLSearchParams(location.search).get("new") === "true";
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
        refetchQueries: [{ query: LIST_MENUS }],
        update: (cache, { data }) => {
            const dataFromCache = cache.readQuery<GetMenuQueryResponse, GetMenuQueryVariables>({
                query: GET_MENU,
                variables: {
                    slug: slug as string
                }
            });
            const updatedData = get(data, "pageBuilder.menu.data");

            if (updatedData && dataFromCache) {
                cache.writeQuery<GetMenuQueryResponse, GetMenuQueryVariables>({
                    query: GET_MENU,
                    data: set(dataFromCache, "pageBuilder.getMenu.data", updatedData)
                });
            }
        }
    });

    const loadedMenu = getQuery.data?.pageBuilder?.getMenu?.data || {};

    const loading = [getQuery, createMutation, updateMutation].find(item => item.loading);

    const onSubmit = useCallback(
        async formData => {
            const isUpdate = loadedMenu.slug;
            const data = pick(formData, ["slug", "title", "description", "items"]);
            const [operation, args] = isUpdate
                ? [update, { variables: { slug: data.slug, data } }]
                : [create, { variables: { data: data } }];

            const response = await operation(args);

            const error = response?.data?.pageBuilder?.menu?.error;
            if (error) {
                return showSnackbar(error.message);
            }

            !isUpdate && history.push(`/page-builder/menus?slug=${formData.slug}`);
            showSnackbar(t`Menu saved successfully.`);
        },
        [loadedMenu.slug]
    );

    const data = useMemo(() => {
        const data = getQuery.data?.pageBuilder?.getMenu.data || {};
        if (!data.items) {
            data.items = [];
        }
        return data;
    }, [loadedMenu.slug]);

    const { identity, getPermission } = useSecurity();
    const pbMenuPermission = useMemo((): PageBuilderSecurityPermission | null => {
        return getPermission("pb.menu");
    }, [identity]);

    const canSave = useMemo((): boolean => {
        if (!pbMenuPermission) {
            return false;
        }
        // User should be able to save the form
        // if it's a new entry and user has the "own" permission set.
        if (!loadedMenu.slug && pbMenuPermission.own) {
            return true;
        }

        if (pbMenuPermission.own) {
            if (!identity) {
                return false;
            }
            return loadedMenu?.createdBy?.id === identity.id;
        }

        if (typeof pbMenuPermission.rwd === "string") {
            return pbMenuPermission.rwd.includes("w");
        }

        return true;
    }, [loadedMenu.slug]);

    const showEmptyView = !newEntry && !loading && isEmpty(omit(data, "items"));
    // Render "No content selected" view.
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display menu details {message}`({
                    message: canCreate ? "or create a..." : ""
                })}
                action={
                    canCreate ? (
                        <ButtonDefault
                            data-testid="new-record-button"
                            onClick={() => history.push("/page-builder/menus?new=true")}
                        >
                            <ButtonIcon icon={<AddIcon />} /> {t`New Menu`}
                        </ButtonDefault>
                    ) : (
                        <></>
                    )
                }
            />
        );
    }

    return (
        <Form data={data} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm data-testid={"pb-menus-form"}>
                    {loading && <CircularProgress />}
                    <SimpleFormHeader title={data.title || t`New menu`} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={6}>
                                <Bind name="title" validators={validation.create("required")}>
                                    <Input label={t`Name`} data-testid="pb.menu.create.name" />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind name="slug" validators={validation.create("required")}>
                                    <Input
                                        disabled={data.createdOn}
                                        label={t`Slug`}
                                        data-testid="pb.menu.create.slug"
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name="description">
                                    <Input
                                        rows={5}
                                        label={t`Description`}
                                        data-testid="pb.menu.create.description"
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Bind name="items">
                            {props => <MenuItems {...props} canSave={canSave} />}
                        </Bind>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonWrapper>
                            <ButtonDefault
                                onClick={() => history.push("/page-builder/menus")}
                            >{t`Cancel`}</ButtonDefault>
                            {canSave && (
                                <ButtonPrimary
                                    data-testid="pb.menu.save.button"
                                    onClick={ev => {
                                        form.submit(ev);
                                    }}
                                >{t`Save menu`}</ButtonPrimary>
                            )}
                        </ButtonWrapper>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default MenusForm;
