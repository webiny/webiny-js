import React, { useMemo } from "react";
import { FbFormLayoutPlugin } from "~/plugins";
import { createForm, FormRenderer } from "@webiny/app-page-builder-elements/renderers/form";
import {
    createSubmitFormDataLoader,
    createLogFormViewDataLoader
} from "@webiny/app-page-builder-elements/renderers/form/dataLoaders";
import { plugins } from "@webiny/plugins";
import { getTenantId } from "~/utils";
import { FbFormFieldValidatorPlugin, FbFormTriggerHandlerPlugin } from "~/types";
import { BeforeFormRender } from "~/page-builder/components/BeforeFormRender";
import { useApolloClient } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { GET_PUBLISHED_FORM } from "@webiny/app-page-builder-elements/renderers/form/dataLoaders/graphql";

const dataLoadersConfig = {
    apiUrl: process.env.REACT_APP_API_URL + "/graphql",
    includeHeaders: {
        "x-tenant": getTenantId()
    }
};

const PeForm: FormRenderer = props => {
    // We wrap the original renderer in order to be able to provide the Apollo client.
    const apolloClient = useApolloClient();

    const Renderer = useMemo(() => {
        return createForm({
            preview: false,
            dataLoaders: {
                // When fetching form, we want to use the default Apollo client. We want to
                // ensure the data gets cached during page prerendering. Using a
                // default `getForm` data loader would not give us that option.
                getForm: ({ variables }) => {
                    const queryParams = { query: gql(GET_PUBLISHED_FORM), variables };

                    try {
                        const data = apolloClient.readQuery({
                            query: gql(GET_PUBLISHED_FORM),
                            variables
                        });

                        return data.formBuilder.getPublishedForm.data;
                    } catch {
                        return apolloClient
                            .query(queryParams)
                            .then(({ data }) => data.formBuilder.getPublishedForm.data);
                    }
                },
                submitForm: createSubmitFormDataLoader(dataLoadersConfig),
                logFormView: createLogFormViewDataLoader(dataLoadersConfig)
            },
            formLayoutComponents: () => {
                const registeredPlugins = plugins.byType<FbFormLayoutPlugin>("form-layout");

                return registeredPlugins.map(plugin => {
                    return {
                        id: plugin.layout.name,
                        name: plugin.layout.title,
                        component: plugin.layout.component
                    };
                });
            },
            fieldValidators: () => {
                const registeredPlugins =
                    plugins.byType<FbFormFieldValidatorPlugin>("fb-form-field-validator");

                return registeredPlugins.map(plugin => {
                    return {
                        id: plugin.validator.name,
                        name: plugin.validator.name,
                        validate: plugin.validator.validate
                    };
                });
            },
            triggers: () => {
                const registeredPlugins =
                    plugins.byType<FbFormTriggerHandlerPlugin>("form-trigger-handler");

                return registeredPlugins.map(plugin => {
                    return {
                        id: plugin.trigger.id,
                        name: plugin.trigger.id,
                        handle: plugin.trigger.handle
                    };
                });
            },
            renderFormNotSelected: () => {
                return (
                    <BeforeFormRender
                        border={false}
                        message={
                            <>
                                Please select a form you wish to display via the&nbsp;<b>Element</b>
                                &nbsp;tab in the right sidebar.
                            </>
                        }
                    />
                );
            },
            renderFormLoading: () => {
                return <BeforeFormRender message={"Loading form..."} border={false} />;
            },
            renderFormNotFound: () => {
                return <BeforeFormRender message={"Form not found."} border={false} />;
            }
        });
    }, []);

    return <Renderer {...props} />;
};

export default PeForm;
