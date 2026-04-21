import { describe, expect, it } from "vitest";
import { mdbid } from "@webiny/utils";
import useGqlHandler from "~tests/utils/useGqlHandler";

const FIELDS = ["description"];

describe("File description field", { timeout: 100_000 }, () => {
    const { createFile, updateFile, getFile } = useGqlHandler();

    it("should default to empty string when not provided on create", async () => {
        const id = mdbid();
        const [response] = await createFile(
            {
                data: {
                    id,
                    key: `${id}/image.png`,
                    name: "image.png",
                    size: 1024,
                    type: "image/png",
                    tags: []
                }
            },
            FIELDS
        );

        expect(response.data.fileManager.createFile.error).toBeNull();
        expect(response.data.fileManager.createFile.data.description).toBe("");
    });

    it("should save and return description on create", async () => {
        const id = mdbid();
        const [response] = await createFile(
            {
                data: {
                    id,
                    key: `${id}/image.png`,
                    name: "image.png",
                    size: 1024,
                    type: "image/png",
                    tags: [],
                    description: "A cartoon character holding a microphone."
                }
            },
            FIELDS
        );

        expect(response.data.fileManager.createFile.error).toBeNull();
        expect(response.data.fileManager.createFile.data.description).toBe(
            "A cartoon character holding a microphone."
        );
    });

    it("should update and return description", async () => {
        const id = mdbid();
        await createFile({
            data: {
                id,
                key: `${id}/image.png`,
                name: "image.png",
                size: 1024,
                type: "image/png",
                tags: []
            }
        });

        const [response] = await updateFile(
            { id, data: { description: "Updated description." } },
            FIELDS
        );

        expect(response.data.fileManager.updateFile.error).toBeNull();
        expect(response.data.fileManager.updateFile.data.description).toBe("Updated description.");
    });

    it("should persist description and return it via getFile", async () => {
        const id = mdbid();
        await createFile({
            data: {
                id,
                key: `${id}/image.png`,
                name: "image.png",
                size: 1024,
                type: "image/png",
                tags: [],
                description: "Persisted description."
            }
        });

        const [response] = await getFile({ id }, FIELDS);

        expect(response.data.fileManager.getFile.error).toBeNull();
        expect(response.data.fileManager.getFile.data.description).toBe("Persisted description.");
    });
});
