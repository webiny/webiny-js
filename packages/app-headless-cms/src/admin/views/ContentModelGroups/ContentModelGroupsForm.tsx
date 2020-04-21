import React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import { i18n } from "@webiny/app/i18n";
import { validation } from "@webiny/validation";
import { GET_CONTENT_MODEL_GROUP_BY_SLUG } from "./graphql";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";

import {
    SimpleFormHeader,
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import IconPicker from "./IconPicker";
import NameSlug from "../../components/NameSlug";
import get from "lodash.get";

const t = i18n.ns("app-headless-cms/admin/content-model-groups/form");

function ContentModelGroupsForm() {
    const { form: crudForm } = useCrud();
    const {
        environments: { apolloClient }
    } = useCms();

    return (
        <Form {...crudForm} data={crudForm.id ? crudForm.data : { icon: "fas/star" }}>
            {({ data, form, Bind, setValue }) => (
                <SimpleForm data-testid={"pb-content-model-groups-form"}>
                    <SimpleFormHeader title={data.name ? data.name : t`New content model group`} />
                    {crudForm.loading && <CircularProgress />}
                    <SimpleFormContent>
                        <Grid>
                            <NameSlug
                                newEntry={!crudForm.id}
                                Bind={Bind}
                                setValue={setValue}
                                validateSlugUniqueness={async () => {
                                    if (data.id) {
                                        return;
                                    }

                                    const getContentModelGroupBySlug = await apolloClient.query({
                                        query: GET_CONTENT_MODEL_GROUP_BY_SLUG,
                                        variables: {
                                            slug: data.slug
                                        }
                                    });

                                    const existingEnvironmentAlias = get(
                                        getContentModelGroupBySlug,
                                        "data.getContentModelGroup.data"
                                    );

                                    if (existingEnvironmentAlias) {
                                        throw new Error(
                                            t`Content model group with slug "{slug}" already exists.`(
                                                {
                                                    slug: data.slug
                                                }
                                            )
                                        );
                                    }
                                }}
                            />

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
