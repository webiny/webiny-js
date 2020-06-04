import React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import { i18n } from "@webiny/app/i18n";
import { useApolloClient } from "react-apollo";
import get from "lodash.get";
import { GET_ENVIRONMENT_ALIAS_BY_SLUG } from "./graphql";
import NameSlug from "../../components/NameSlug";
import { AutoComplete } from "@webiny/ui/AutoComplete";

import { useCms } from "@webiny/app-headless-cms/admin/hooks";

import {
    SimpleFormHeader,
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";

const t = i18n.ns("app-headless-cms/admin/environmentAliases/form");

function EnvironmentAliasesForm() {
    const { form: crudForm } = useCrud();
    const {
        environments: { environments: environmentsOptions }
    } = useCms();

    const apolloClient = useApolloClient();

    return (
        <Form {...crudForm}>
            {({ data, form, Bind, setValue }) => (
                <SimpleForm data-testid={"pb-environmentAliases-form"}>
                    {crudForm.loading && <CircularProgress />}
                    <SimpleFormHeader title={data.name ? data.name : t`New environment alias`} />
                    <SimpleFormContent>
                        <Grid>
                            <NameSlug
                                newEntry={!crudForm.id}
                                Bind={Bind}
                                setValue={setValue}
                                slug={{
                                    description: t`Will be used as part of the GraphQL API URL.`
                                }}
                                validateSlugUniqueness={async () => {
                                    if (data.id) {
                                        return;
                                    }

                                    const getEnvironmentAliasBySlug = await apolloClient.query({
                                        query: GET_ENVIRONMENT_ALIAS_BY_SLUG,
                                        variables: {
                                            slug: data.slug
                                        }
                                    });

                                    const existingEnvironmentAlias = get(
                                        getEnvironmentAliasBySlug,
                                        "data.cms.getEnvironmentAlias.data"
                                    );

                                    if (existingEnvironmentAlias) {
                                        throw new Error(
                                            t`Environment with slug "{slug}" already exists.`({
                                                slug: data.slug
                                            })
                                        );
                                    }
                                }}
                            />
                            <Cell span={12}>
                                <Bind name="description">
                                    {props => (
                                        <Input
                                            {...props}
                                            rows={4}
                                            maxLength={200}
                                            characterCount
                                            label={t`Description`}
                                        />
                                    )}
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name="environment">
                                    {props => (
                                        <AutoComplete
                                            {...props}
                                            placeholder={t`No environment selected.`}
                                            label={t`Environment`}
                                            options={environmentsOptions}
                                            description={t`Choose an existing environment to which this alias will point to.`}
                                        />
                                    )}
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary
                            onClick={form.submit}
                        >{t`Save environment alias`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
}

export default EnvironmentAliasesForm;
