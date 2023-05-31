import { ContextPlugin } from "@webiny/api";
import { FileManagerConfig } from "~/createFileManager";
import { FileManagerContext } from "~/types";
import { FileManagerContextSetup } from "./FileManagerContextSetup";
import { createGraphQLSchemaPlugin } from "./graphql";

export * from "./plugins";

export const createFileManagerContext = ({
    storageOperations
}: Pick<FileManagerConfig, "storageOperations">) => {
    return new ContextPlugin<FileManagerContext>(async context => {
        const fmContext = new FileManagerContextSetup(context);
        context.fileManager = await fmContext.setupContext(storageOperations);
    });
};

export const createFileManagerGraphQL = () => {
    return createGraphQLSchemaPlugin();
};
