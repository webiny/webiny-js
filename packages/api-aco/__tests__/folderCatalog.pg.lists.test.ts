import { describe, expect, it } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

/*
 * On pg, folder-level permissions are applied inside the list query, so the paging meta
 * describes the folders the identity can see: no short pages, exact totals.
 */
const isPg = (process.env.WEBINY_STORAGE || "").split(",").includes("pg");

const FOLDER_TYPE = "pg-lists";

const owner: IdentityData = { id: "1", type: "admin", displayName: "Owner" };
const restricted: IdentityData = { id: "2", type: "admin", displayName: "Restricted" };
const reader: IdentityData = { id: "3", type: "admin", displayName: "Reader" };

describe.runIf(isPg)("Folder lists with FLP on pg", () => {
    const { aco: asOwner } = useGraphQlHandler({ identity: owner });
    const { aco: asRestricted } = useGraphQlHandler({ identity: restricted, permissions: [] });

    it("should page through only the folders the identity can read, with exact totals", async () => {
        const visible: string[] = [];
        for (let i = 1; i <= 10; i++) {
            // Six of the ten folders are the owner's alone; 3, 6, 9 and 10 are not.
            const hidden = !(i % 3 === 0 || i === 10);
            const [response] = await asOwner.createFolder({
                data: {
                    title: `Folder ${String(i).padStart(2, "0")}`,
                    slug: `folder-${i}`,
                    type: FOLDER_TYPE,
                    ...(hidden ? { permissions: [{ target: "admin:1", level: "owner" }] } : {})
                }
            });
            const folder = response.data.aco.createFolder.data;
            if (!hidden) {
                visible.push(folder.id);
            }
        }
        expect(visible).toHaveLength(4);

        const seen: string[] = [];
        let after: string | null = null;
        let pages = 0;
        do {
            const [result] = await asRestricted.listFolders({
                where: { type: FOLDER_TYPE },
                limit: 2,
                ...(after ? { after } : {})
            });
            const { data, meta } = result.data.aco.listFolders;
            pages++;

            // Every page is full until the last one, and the total is what the identity can see.
            expect(meta.totalCount).toBe(4);
            expect(data).toHaveLength(2);
            seen.push(...data.map((folder: { id: string }) => folder.id));

            after = meta.hasMoreItems ? meta.cursor : null;
        } while (after);

        expect(pages).toBe(2);
        expect(seen.sort()).toEqual([...visible].sort());
    });

    it("should page through only the entries in folders the identity can read, with exact totals", async () => {
        const { cms: ownerCms } = useGraphQlHandler({ identity: owner });
        const { cms: readerCms } = useGraphQlHandler({
            identity: reader,
            permissions: [{ name: "cms.*" }]
        });
        const modelGroup = await ownerCms.createTestModelGroup();
        const model = await ownerCms.createBasicModel({ modelGroup: modelGroup.id });
        const type = `cms:${model.modelId}`;

        const createFolder = async (
            slug: string,
            permissions?: Array<{ target: string; level: string }>,
            parentId?: string
        ): Promise<string> => {
            const [response] = await asOwner.createFolder({
                data: {
                    title: slug,
                    slug,
                    type,
                    ...(parentId ? { parentId } : {}),
                    ...(permissions ? { permissions } : {})
                }
            });
            return response.data.aco.createFolder.data.id;
        };

        // The owner's alone, a child of it granted to the reader, a public one, and one where the
        // reader is denied.
        const ownersOnly = await createFolder("owners-only", [
            { target: "admin:1", level: "owner" }
        ]);
        const granted = await createFolder(
            "granted",
            [{ target: "admin:3", level: "viewer" }],
            ownersOnly
        );
        const open = await createFolder("open");
        const denied = await createFolder("denied", [
            { target: "admin:1", level: "owner" },
            { target: "admin:3", level: "no-access" }
        ]);

        const visible: string[] = [];
        const createEntries = async (
            folderId: string | null,
            count: number,
            isVisible: boolean
        ) => {
            for (let i = 0; i < count; i++) {
                const [response] = await ownerCms.createEntry(model, {
                    data: {
                        values: { title: `${folderId ?? "no-folder"}-${i}` },
                        ...(folderId ? { wbyAco_location: { folderId } } : {})
                    }
                });
                const entry = response.data.createBasicTestModel.data;
                expect(entry).toBeTruthy();
                if (isVisible) {
                    visible.push(entry.id);
                }
            }
        };
        await createEntries(ownersOnly, 4, false);
        await createEntries(denied, 3, false);
        await createEntries(granted, 2, true);
        await createEntries(open, 2, true);
        await createEntries(null, 1, true);
        expect(visible).toHaveLength(5);

        const seen: string[] = [];
        let after: string | null = null;
        let pages = 0;
        do {
            const [result] = await readerCms.listEntries(model, {
                limit: 2,
                ...(after ? { after } : {})
            });
            const { data, meta, error } = result.data.listBasicTestModels;
            expect(error).toBeNull();
            pages++;

            expect(meta.totalCount).toBe(5);
            expect(data).toHaveLength(pages < 3 ? 2 : 1);
            seen.push(...data.map((entry: { id: string }) => entry.id));

            after = meta.hasMoreItems ? meta.cursor : null;
        } while (after);

        expect(pages).toBe(3);
        expect(seen.sort()).toEqual([...visible].sort());
    });
});
