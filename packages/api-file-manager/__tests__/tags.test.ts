import { describe, expect, it } from "vitest";
import { mdbid } from "@webiny/utils";
import useGqlHandler from "~tests/utils/useGqlHandler";

const file = (tags: string[]) => {
    const id = mdbid();
    return {
        id,
        key: `${id}/file.png`,
        name: "file.png",
        size: 1000,
        type: "image/png",
        tags
    };
};

describe("file tags", () => {
    const { createFile, updateFile, deleteFile, listTags } = useGqlHandler();

    const tagsOf = async (where?: Record<string, unknown>) => {
        const [response] = await listTags(where ? { where } : {});
        expect(response.data.fileManager.listTags.error).toBeNull();
        return response.data.fileManager.listTags.data;
    };

    it("filters tags by their own prefix, not the files that carry them", async () => {
        await createFile({ data: file(["sketch", "shared"]) });
        await createFile({ data: file(["scope:apw", "scope:apw:media", "shared"]) });

        // A file with a scoped tag still contributes its other tags to the default list.
        expect(await tagsOf({ tags_not_startsWith: "scope:" })).toEqual([
            { tag: "shared", count: 2 },
            { tag: "sketch", count: 1 }
        ]);
        expect(await tagsOf({ tags_startsWith: "scope:apw" })).toEqual([
            { tag: "scope:apw", count: 1 },
            { tag: "scope:apw:media", count: 1 }
        ]);
    });

    it("keeps tag counts as files are updated and deleted", async () => {
        const a = file(["red", "blue"]);
        const b = file(["red"]);
        const c = file(["red", "green"]);
        await createFile({ data: a });
        await createFile({ data: b });
        await createFile({ data: c });

        expect(await tagsOf()).toEqual([
            { tag: "red", count: 3 },
            { tag: "blue", count: 1 },
            { tag: "green", count: 1 }
        ]);

        await updateFile({ id: a.id, data: { tags: ["blue", "green"] } });
        await deleteFile({ id: b.id });

        expect(await tagsOf()).toEqual([
            { tag: "green", count: 2 },
            { tag: "blue", count: 1 },
            { tag: "red", count: 1 }
        ]);
        expect(await tagsOf({ tags_not_startsWith: "scope:" })).toEqual([
            { tag: "green", count: 2 },
            { tag: "blue", count: 1 },
            { tag: "red", count: 1 }
        ]);
    });
});
