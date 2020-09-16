import * as React from "react";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Accordion } from "@webiny/ui/Accordion";
import { CircularProgress } from "@webiny/ui/Progress";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { Typography } from "@webiny/ui/Typography";
import { plugins } from "@webiny/plugins";
import { AdminAppPermissionRenderer } from "@webiny/app-admin/types";
import { SecurityPermission } from "@webiny/app-security/SecurityIdentity";
import get from "lodash.get";

const t = i18n.ns("app-security/admin/groups/form");

export const createPermissionsMap = (permissions: SecurityPermission[]) => {
    const permissionsMap = {};
    if (!permissions || !Array.isArray(permissions)) {
        return permissionsMap;
    }

    for (let i = 0; i < permissions.length; i++) {
        const perm = permissions[i];
        if (perm.name) {
            permissionsMap[perm.name] = perm;
        }
    }
    return permissionsMap;
};

export const createPermissionsArray = (permissionsMap: object) => {
    const permissions: SecurityPermission[] = [];

    if (!permissionsMap) {
        return permissions;
    }

    const values = Object.values(permissionsMap);

    for (let i = 0; i < values.length; i++) {
        const perm: SecurityPermission = values[i];
        if (perm.name) {
            permissions.push(perm);
        }
    }
    return permissions;
};

const GroupForm = () => {
    const { form: crudForm } = useCrud();

    const permissionPlugins = plugins.byType<AdminAppPermissionRenderer>(
        "admin-app-permissions-renderer"
    );
    // From API to UI
    crudForm.data = {
        ...crudForm.data,
        permissions: createPermissionsMap(crudForm.data.permissions)
    };

    return (
        <Form {...crudForm}>
            {({ data, form, Bind }) => {
                return (
                    <SimpleForm>
                        {crudForm.loading && <CircularProgress />}
                        <SimpleFormHeader title={data.name ? data.name : "Untitled"} />
                        <SimpleFormContent>
                            <Grid>
                                <Cell span={6}>
                                    <Bind name="name" validators={validation.create("required")}>
                                        <Input label={t`Name`} />
                                    </Bind>
                                </Cell>
                                <Cell span={6}>
                                    <Bind name="slug" validators={validation.create("required")}>
                                        <Input disabled={data.id} label={t`Slug`} />
                                    </Bind>
                                </Cell>
                            </Grid>
                            <Grid>
                                <Cell span={12}>
                                    <Bind
                                        name="description"
                                        validators={validation.create("required")}
                                    >
                                        <Input label={t`Description`} rows={4} />
                                    </Bind>
                                </Cell>
                            </Grid>
                            <Grid>
                                <Cell span={12}>
                                    <Typography use={"subtitle1"}>{t`Permissions`}</Typography>
                                    <Bind name={"permissions"}>
                                        {props => (
                                            <Accordion elevation={0}>
                                                {permissionPlugins.map(pl =>
                                                    pl.render({
                                                        key: pl.name,
                                                        id: get(
                                                            props,
                                                            "form.state.data.id",
                                                            pl.name
                                                        ),
                                                        value: props.value,
                                                        onChange: props.onChange
                                                    })
                                                )}
                                            </Accordion>
                                        )}
                                    </Bind>
                                </Cell>
                            </Grid>
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            <ButtonPrimary onClick={form.submit}>{t`Save group`}</ButtonPrimary>
                        </SimpleFormFooter>
                    </SimpleForm>
                );
            }}
        </Form>
    );
};

export default GroupForm;
