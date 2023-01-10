import { FbFormLayoutPlugin } from "~/plugins";
import { createForm } from "@webiny/app-page-builder-elements/renderers/form";
import {
    createGetFormDataLoader,
    createSubmitFormDataLoader,
    createLogFormViewDataLoader
} from "@webiny/app-page-builder-elements/renderers/form/dataLoaders";
import { plugins } from "@webiny/plugins";
import { getTenantId } from "~/utils";

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
    triggers: [],
    fieldValidators: []
});

export default PeForm;
