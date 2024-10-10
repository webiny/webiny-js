import React, { useMemo } from "react";
import { FbFormLayoutPlugin } from "~/plugins";
import { createForm, FormRenderer } from "@webiny/app-page-builder-elements/renderers/form";
import { plugins } from "@webiny/plugins";
import { FbFormFieldValidatorPlugin, FbFormTriggerHandlerPlugin } from "~/types";
import { BeforeFormRender } from "~/page-builder/components/BeforeFormRender";
import { useApolloClient } from "@apollo/react-hooks";
import gql from "graphql-tag";
import {
    CREATE_FORM_SUBMISSION,
    GET_PUBLISHED_FORM,
    LOG_FORM_VIEW
} from "@webiny/app-page-builder-elements/renderers/form/dataLoaders/graphql";

type PeFormProps = React.ComponentProps<FormRenderer>;

const PeForm = (props: PeFormProps) => {
    // We wrap the original renderer in order to be able to provide the Apollo client.
    const apolloClient = useApolloClient();

    const Renderer = useMemo(() => {
        return createForm({
            preview: true,
            dataLoaders: {
                // When fetching form, we want to use the default Apollo client. We want to
                // ensure the data gets cached during page prerendering. Using a
                // default `getForm` data loader would not give us that option.
                getForm: ({ variables }) => {
                    try {
                        const data = apolloClient.readQuery({
                            query: gql(GET_PUBLISHED_FORM),
                            variables
                        });

                        return data.formBuilder.getPublishedForm.data;
                    } catch {
                        /*
                            This query will always be called on the initial render of the page,
                            so if we have deleted the form that we were using on the page,
                            the page would crash.
                            Because we are trying to request a form, that does not exist anymore.
                            The "catch" helps to avoid that issue.
                        */
                        return apolloClient
                            .query({ query: gql(GET_PUBLISHED_FORM), variables })
                            .then(({ data }) => data.formBuilder.getPublishedForm.data)
                            .catch(() => null);
                    }
                },
                submitForm: ({ variables }) => {
                    return apolloClient
                        .mutate({ mutation: gql(CREATE_FORM_SUBMISSION), variables })
                        .then(({ data }) => data.formBuilder.createFormSubmission);
                },
                logFormView: ({ variables }) => {
                    return apolloClient
                        .mutate({ mutation: gql(LOG_FORM_VIEW), variables })
                        .then(({ data }) => data.formBuilder.saveFormView);
                }
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
