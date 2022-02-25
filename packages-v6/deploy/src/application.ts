import { defineApp, ResourceHandler } from "@webiny/pulumi-sdk-v6";
import { APIPulumiApplication } from "./index";

interface Params {
    onResource: ResourceHandler;
    tagResources: () => void;
}

export const createAPIApplication = ({ onResource, tagResources }: Params) => {
    const APIApplication = defineApp<APIPulumiApplication>({
        name: "API",
        config(app) {
            app.onResource(onResource);
            app.addHandler(tagResources);
            return {};
        }
    });

    return new APIApplication();
};
