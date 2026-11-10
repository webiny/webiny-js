import { describe, expect, it } from "vitest";
import { useHandler } from "./utils/useHandler";
import { CreateFolderUseCase } from "~/features/folder/CreateFolder/index.js";
import { UpdateFolderUseCase } from "~/features/folder/UpdateFolder/index.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import { AcoFlpCrud } from "~/features/folder/shared/abstractions.js";
import { ROOT_FOLDER } from "~/constants";
import type { Folder } from "~/folder/folder.types";
import type { FolderPermission } from "~/flp/flp.types";

/*
 * The Postgres-native FLP strategy (`@webiny/api-aco-pg`) keeps the folder catalog in the
 * transaction that writes the folder: no background task, so every read right after a write must
 * already see the new paths and permissions, across a whole subtree.
 */
const isPg = (process.env.WEBINY_STORAGE || "").split(",").includes("pg");

const type = "pg-catalog";

describe.runIf(isPg)("Folder catalog on pg", () => {
    const { handler } = useHandler();

    const setup = async () => {
        const context = await handler();
        const createFolder = context.container.resolve(CreateFolderUseCase);
        const updateFolder = context.container.resolve(UpdateFolderUseCase);
        const getFolder = context.container.resolve(GetFolderUseCase);
        const flpCrud = context.container.resolve(AcoFlpCrud);

        const create = async (
            slug: string,
            parentId: string | null,
            permissions?: FolderPermission[]
        ): Promise<Folder> => {
            const result = await createFolder.execute({
                type,
                title: slug,
                slug,
                parentId,
                ...(permissions ? { permissions } : {})
            });
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        };

        const update = async (id: string, data: Record<string, unknown>): Promise<Folder> => {
            const result = await updateFolder.execute(id, data);
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        };

        const pathOf = async (id: string): Promise<string> => {
            const result = await getFolder.execute(id);
            if (result.isFail()) {
                throw result.error;
            }
            return result.value.path;
        };

        /** A chain of folders, each the child of the previous one. */
        const createChain = async (depth: number, parentId: string | null): Promise<Folder[]> => {
            const chain: Folder[] = [];
            for (let level = 1; level <= depth; level++) {
                chain.push(await create(`level-${level}`, chain[chain.length - 1]?.id ?? parentId));
            }
            return chain;
        };

        return { create, update, pathOf, createChain, flpCrud };
    };

    it("should rewrite the paths of a 10-level subtree when a folder's slug changes", async () => {
        const { create, update, pathOf, createChain, flpCrud } = await setup();

        const top = await create("top", null);
        const chain = await createChain(10, top.id);
        const sibling = await create("sibling", null);

        await update(top.id, { slug: "renamed" });

        let expected = `${ROOT_FOLDER}/renamed`;
        expect(await pathOf(top.id)).toBe(expected);
        for (const folder of chain) {
            expected = `${expected}/${folder.slug}`;
            // The folder entry and the FLP record agree, right after the write.
            expect(await pathOf(folder.id)).toBe(expected);
            expect((await flpCrud.get(folder.id))?.path).toBe(expected);
        }
        // Folders outside the subtree are left alone.
        expect(await pathOf(sibling.id)).toBe(`${ROOT_FOLDER}/sibling`);
    });

    it("should move a subtree under a new parent, paths and inherited permissions", async () => {
        const { create, update, pathOf, createChain, flpCrud } = await setup();

        const source = await create("source", null);
        const target = await create("target", null, [{ target: "team:editors", level: "editor" }]);
        const chain = await createChain(5, source.id);

        // Before the move, nothing is inherited.
        expect((await flpCrud.get(chain[4].id))?.permissions).toEqual([]);

        await update(chain[0].id, { parentId: target.id });

        let expected = `${ROOT_FOLDER}/target`;
        for (const folder of chain) {
            expected = `${expected}/${folder.slug}`;
            expect(await pathOf(folder.id)).toBe(expected);
        }

        // The deepest folder inherits the new parent's permission through its moved ancestors.
        const deepest = await flpCrud.get(chain[4].id);
        expect(deepest).toMatchObject({ parentId: chain[3].id, path: expected });
        expect(deepest?.permissions).toEqual([
            { target: "team:editors", level: "editor", inheritedFrom: `parent:${chain[3].id}` }
        ]);
        expect(await pathOf(source.id)).toBe(`${ROOT_FOLDER}/source`);
    });

    it("should apply a parent's permission change to every descendant at once", async () => {
        const { create, update, createChain, flpCrud } = await setup();

        const top = await create("top", null);
        const chain = await createChain(4, top.id);

        await update(top.id, { permissions: [{ target: "team:viewers", level: "viewer" }] });

        for (const [index, folder] of chain.entries()) {
            const parentId = index === 0 ? top.id : chain[index - 1].id;
            expect((await flpCrud.get(folder.id))?.permissions).toEqual([
                { target: "team:viewers", level: "viewer", inheritedFrom: `parent:${parentId}` }
            ]);
        }

        // A child's own permission for the same target overrides the inherited one...
        await update(chain[1].id, {
            permissions: [{ target: "team:viewers", level: "editor" }]
        });
        expect((await flpCrud.get(chain[1].id))?.permissions).toEqual([
            { target: "team:viewers", level: "editor" }
        ]);
        // ...and is what its descendants inherit.
        expect((await flpCrud.get(chain[3].id))?.permissions).toEqual([
            { target: "team:viewers", level: "editor", inheritedFrom: `parent:${chain[2].id}` }
        ]);
    });

    it("should keep a parent's no-access over a child's own permission", async () => {
        const { create, flpCrud } = await setup();

        const parent = await create("parent", null, [
            { target: "team:blocked", level: "no-access" }
        ]);
        const child = await create("child", parent.id, [
            { target: "team:blocked", level: "owner" }
        ]);

        expect((await flpCrud.get(child.id))?.permissions).toEqual([
            { target: "team:blocked", level: "no-access", inheritedFrom: `parent:${parent.id}` }
        ]);
    });

    it("should build the catalog from existing folders on first use", async () => {
        const { create, createChain } = await setup();

        const top = await create("existing", null, [{ target: "team:editors", level: "editor" }]);
        const chain = await createChain(3, top.id);

        // As if the storage was just deployed over existing folders: no catalog yet.
        const knex = (globalThis as any).__testKnex;
        const tables = await knex.raw(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%aco_folder%'"
        );
        for (const { tablename } of tables.rows) {
            await knex.raw(`DROP TABLE "${tablename}"`);
        }
        for (const manager of (globalThis as any).__sqlTableManagers || []) {
            if (typeof manager.isKnownBuilt === "function") {
                manager.reset();
            }
        }

        // A fresh request: the first permission read builds the catalog from the folder entries.
        const { flpCrud } = await setup();
        const deepest = await flpCrud.get(chain[2].id);
        expect(deepest).toMatchObject({
            path: `${ROOT_FOLDER}/existing/level-1/level-2/level-3`,
            permissions: [
                { target: "team:editors", level: "editor", inheritedFrom: `parent:${chain[1].id}` }
            ]
        });
    });
});
