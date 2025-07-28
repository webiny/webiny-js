import { createContextPlugin } from "@webiny/api";
import { WebsiteBuilderContext } from "./context/types";
import { WebsiteBuilder } from "./context/WebsiteBuilder";
import { createGraphQL } from "~/graphql/createGraphQL";

const createContext = () => {
    return createContextPlugin<WebsiteBuilderContext>(
        async context => {
            context.websiteBuilder = await WebsiteBuilder.create(context);
        },
        { name: "wb.createContext" }
    );
};

export const createWebsiteBuilder = () => {
    return [createContext(), createGraphQL()];
};
