import React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import { i18n } from "@webiny/app/i18n";
import { validation } from "@webiny/validation";

import {
    SimpleFormHeader,
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import IconPicker from "./IconPicker";

const t = i18n.ns("app-headless-cms/admin/content-model-groups/form");

function ContentModelGroupsForm() {
    const { form: crudForm } = useCrud();

    return (
        <Form {...crudForm} data={crudForm.id ? crudForm.data : { icon: "fas/star" }}>
            {({ data, form, Bind }) => (
                <SimpleForm data-testid={"pb-content-model-groups-form"}>
                    <SimpleFormHeader title={data.name ? data.name : t`New content model group`} />
                    {crudForm.loading && <CircularProgress />}
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={12}>
                                <Bind
                                    name="name"
                                    validators={validation.create("required,maxLength:100")}
                                >
                                    <Input label={t`Name`} />
                                </Bind>
                            </Cell>

                            <Cell span={12}>
                                <Bind name="icon" validators={validation.create("required")}>
                                    <IconPicker
                                        label={t`Group icon`}
                                        description={t`Icon that will be displayed in the main menu.`}
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name="description">
                                    <Input rows={5} label={t`Description`} />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary
                            onClick={form.submit}
                        >{t`Save content model group`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
}

export default ContentModelGroupsForm;
