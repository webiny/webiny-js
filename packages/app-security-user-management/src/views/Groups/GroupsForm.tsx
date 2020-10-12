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
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import get from "lodash/get";
import { createPermissionsMap } from "./utils";

const t = i18n.ns("app-security/admin/groups/form");

const GroupForm = () => {
    const { form: crudForm } = useCrud();

    const permissionPlugins = plugins.byType<AdminAppPermissionRendererPlugin>(
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
                                </Cell>
                                <Cell span={12}>
                                    <Bind name={"permissions"}>
                                        {props => (
                                            <Accordion elevation={0}>
                                                {permissionPlugins.map(pl =>
                                                    pl.render({
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
