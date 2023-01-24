import React from "react";
import { FbFormLayoutPlugin } from "~/plugins";
import { createForm } from "@webiny/app-page-builder-elements/renderers/form";
import {
    createGetFormDataLoader,
    createSubmitFormDataLoader,
    createLogFormViewDataLoader
} from "@webiny/app-page-builder-elements/renderers/form/dataLoaders";
import { plugins } from "@webiny/plugins";
import { getTenantId } from "~/utils";
import { FbFormFieldValidatorPlugin, FbFormTriggerHandlerPlugin } from "~/types";
import { BeforeFormRender } from "~/page-builder/components/BeforeFormRender";

const dataLoadersConfig = {
    apiUrl: process.env.REACT_APP_API_URL + "/graphql",
    includeHeaders: {
        "x-tenant": getTenantId()
    }
};

const PeForm = createForm({
    preview: false,
    dataLoaders: {
        getForm: createGetFormDataLoader(dataLoadersConfig),
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

export default PeForm;
