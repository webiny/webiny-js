import { ContextPlugin } from "@webiny/api";
import { WebsiteBuilderContextSetup } from "~/WebsiteBuilderContextSetup";
import type { WebsiteBuilderContext } from "~/types";
import { createWebsiteBuilderGraphQL } from "~/createWebsiteBuilderGraphQL";

const createWebsiteBuilderContext = () => {
    const plugin = new ContextPlugin<WebsiteBuilderContext>(async context => {
        const websiteBuilder = new WebsiteBuilderContextSetup(context);
        context.websiteBuilder = await websiteBuilder.setupContext();
    });

    plugin.name = "wb.createContext";

    return plugin;
};

export const createWebsiteBuilder = () => {
    return [createWebsiteBuilderContext(), createWebsiteBuilderGraphQL()];
};
