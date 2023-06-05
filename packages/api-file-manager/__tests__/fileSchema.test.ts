import prettier from "prettier";
import { useHandler } from "./utils/useHandler";
import { createFilesTypeDefs } from "~/graphql/createFilesTypeDefs";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords";
import fileSdlSnapshot from "./mocks/file.sdl";

jest.retryTimes(0);

describe("File Model Modifier test", () => {
    test("should generate GraphQL schema for File model", async () => {
        const { handler } = useHandler();

        const context = await handler();

        const fileModel = (await context.cms.getModel("fmFile")) as CmsModel;
        const models = await context.cms.listModels();
        const fieldPlugins = createFieldTypePluginRecords(context.plugins);

        const schema = createFilesTypeDefs({
            model: fileModel,
            models,
            plugins: fieldPlugins
        });

        const prettySnapshot = prettier.format(fileSdlSnapshot.trim(), { parser: "graphql" });
        const fileSdl = prettier.format(schema.trim(), { parser: "graphql" });

        expect(fileSdl).toEqual(prettySnapshot);
    });
});
