import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import useGqlHandler from "~tests/utils/useGqlHandler";
import { fileAData } from "./mocks/files";

describe("File src", () => {
    const { createFile, getFile, listFiles, updateSettings } = useGqlHandler();

    it("should prefix the file key with the srcPrefix setting", async () => {
        const srcPrefix = "https://cdn.example.com/files/";
        const [update] = await updateSettings({ data: { srcPrefix } });
        expect(update.data.fileManager.updateSettings.error).toBeNull();

        // A new request reads the settings when the first URL is generated, not while the schema
        // is composed.
        const [create] = await createFile({ data: fileAData }, ["src"]);
        expect(create.data.fileManager.createFile.data.src).toEqual(srcPrefix + fileAData.key);

        const [get] = await getFile({ id: fileAData.id }, ["src"]);
        expect(get.data.fileManager.getFile.data.src).toEqual(srcPrefix + fileAData.key);

        const [list] = await listFiles({}, ["src"]);
        const sources = list.data.fileManager.listFiles.data.map(
            (file: { src: string }) => file.src
        );
        expect(sources).toEqual([srcPrefix + fileAData.key]);
    });
});
