import { appendFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { useHandler } from "./utils/useHandler";
import { CreateFolderUseCase } from "~/features/folder/CreateFolder/index.js";
import { UpdateFolderUseCase } from "~/features/folder/UpdateFolder/index.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import { ListFoldersUseCase } from "~/features/folder/ListFolders/index.js";
import { AcoFlpCrud } from "~/features/folder/shared/abstractions.js";
import { ListUserFolderAccessUseCase } from "~/features/flp/ListFolderAccess/index.js";
import { CreateTeam } from "@webiny/api-core/features/security/teams/CreateTeam/index.js";
import { CreateRoleUseCase } from "@webiny/api-core/features/security/roles/CreateRole/index.js";
import { CreateUserUseCase } from "@webiny/api-core/features/users/CreateUser/index.js";
import { ROOT_FOLDER } from "~/constants";
import type { Folder } from "~/folder/folder.types";

/*
 * Opt-in benchmark of the Postgres-native folder catalog at the target scale: 15,000 folders, 10
 * levels deep. Not part of the regular suites (it takes minutes to seed). Run with:
 *
 *   ACO_CATALOG_BENCH=1 ACO_CATALOG_BENCH_OUT=/tmp/bench.txt \
 *     WEBINY_STORAGE=pg,sql WEBINY_PG_DATABASE=webiny_bench \
 *     yarn vitest --config testing/vitest.config.ts --run \
 *     packages/api-aco/__tests__/folderCatalog.pg.bench.test.ts
 *
 * First run (local Postgres 17, M1 Pro, fsync off): seeding 205 s; permissions of the deepest
 * folder 0.8 ms; listing root folders with FLP 11.5 ms; renaming the root (catalog, 15,000 paths
 * and their search rows, one transaction) 5.0 s; moving a level-2 subtree 0.8 s. With the list
 * push-down, for an identity without full access: a parent's children 47 ms, an unscoped first page
 * over all 15,000 folders 308 ms, 56 ms once only the identity's grant candidates are checked. Which folders a user can access: a member of one team (1,271
 * folders) 152 ms through the grants index; a full-access user (every folder) 245 ms.
 */
const isPg = (process.env.WEBINY_STORAGE || "").split(",").includes("pg");
const enabled = isPg && process.env.ACO_CATALOG_BENCH === "1";

const type = "bench";
// Folders per level: 1 root, 10 levels in all, 15,000 folders.
const LEVELS = [1, 3, 8, 20, 50, 120, 300, 800, 2500, 11198];

/* Test output is swallowed; ACO_CATALOG_BENCH_OUT names a file that gets the timings as well. */
const report = (line: string) => {
    console.log(`[bench] ${line}`);
    if (process.env.ACO_CATALOG_BENCH_OUT) {
        appendFileSync(process.env.ACO_CATALOG_BENCH_OUT, `${line}\n`);
    }
};

const time = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    report(`${label}: ${(performance.now() - start).toFixed(1)} ms`);
    return result;
};

describe.runIf(enabled)("Folder catalog benchmark (pg)", () => {
    const { handler } = useHandler();
    // No full access: folders under a team grant are hidden, so lists have real filtering to do.
    const { handler: restrictedHandler } = useHandler({ permissions: [] });

    it(
        "should rename the root of 15,000 folders, 10 levels deep",
        async () => {
            const context = await handler();
            const createFolder = context.container.resolve(CreateFolderUseCase);
            const updateFolder = context.container.resolve(UpdateFolderUseCase);
            const getFolder = context.container.resolve(GetFolderUseCase);
            const listFolders = context.container.resolve(ListFoldersUseCase);
            const flpCrud = context.container.resolve(AcoFlpCrud);

            const levels: Folder[][] = [];
            await time("seed 15,000 folders", async () => {
                for (const [depth, count] of LEVELS.entries()) {
                    const level: Folder[] = [];
                    for (let i = 0; i < count; i++) {
                        const parent =
                            depth === 0 ? null : levels[depth - 1][i % levels[depth - 1].length];
                        const result = await createFolder.execute({
                            type,
                            title: `f-${depth}-${i}`,
                            slug: `f-${depth}-${i}`,
                            parentId: parent?.id ?? null,
                            // A grant every few folders, so inheritance has work to do.
                            ...(i % 7 === 0
                                ? {
                                      permissions: [
                                          { target: `team:team-${i % 5}`, level: "viewer" }
                                      ]
                                  }
                                : {})
                        });
                        if (result.isFail()) {
                            throw result.error;
                        }
                        level.push(result.value);
                    }
                    levels.push(level);
                    report(`level ${depth + 1}: ${count} folders`);
                }
            });

            const root = levels[0][0];
            const deepest = levels[9][levels[9].length - 1];

            await time("permissions of the deepest folder (cold)", () => flpCrud.get(deepest.id));
            await time("permissions of the deepest folder (warm)", () => flpCrud.get(deepest.id));
            await time("list root-level folders with FLP", () =>
                listFolders.execute({ where: { type, parentId: ROOT_FOLDER } })
            );
            await time("list one level-9 folder's children with FLP", () =>
                listFolders.execute({ where: { type, parentId: levels[8][0].id }, limit: 10000 })
            );

            const restricted = await restrictedHandler();
            const restrictedList = restricted.container.resolve(ListFoldersUseCase);
            const visibleRoots = await time("restricted: list root's children", () =>
                restrictedList.execute({ where: { type, parentId: root.id } })
            );
            report(`restricted: root's children visible: ${visibleRoots.value?.folders.length}`);
            const page = await time("restricted: first page of all 15,000 folders", () =>
                restrictedList.execute({ where: { type }, limit: 50 })
            );
            report(`restricted: total visible: ${page.value?.meta.totalCount}`);

            /*
             * Which folders a user can access. A member of team-3 only: the catalog narrows the
             * folders to the subtrees under team-3's grants. A full-access user is the owner of every
             * folder, so all 15,000 are read and checked, as every user's were before the grants
             * index was used.
             */
            const t3 = await context.container.resolve(CreateTeam).execute({
                name: "team-3",
                slug: "team-3",
                description: "",
                roles: []
            });
            const fullRole = await context.container.resolve(CreateRoleUseCase).execute({
                name: "Full",
                slug: "full",
                description: "",
                permissions: [{ name: "*" }]
            });
            const createUser = context.container.resolve(CreateUserUseCase);
            await createUser.execute({
                id: "member",
                email: "member@webiny.local",
                displayName: "member",
                teams: [t3.value.id]
            });
            await createUser.execute({
                id: "owner",
                email: "owner@webiny.local",
                displayName: "owner",
                roles: [fullRole.value.id]
            });
            const listUserAccess = context.container.resolve(ListUserFolderAccessUseCase);
            const memberAccess = await time("user access: team member (grants index)", () =>
                listUserAccess.execute({ userId: "member", type })
            );
            report(`user access: team member's folders: ${memberAccess.value?.folders.length}`);
            const ownerAccess = await time("user access: full access (every folder)", () =>
                listUserAccess.execute({ userId: "owner", type })
            );
            report(`user access: full access folders: ${ownerAccess.value?.folders.length}`);

            await time("rename the root (catalog + 15,000 paths + search rows)", async () => {
                const result = await updateFolder.execute(root.id, { slug: "renamed" });
                if (result.isFail()) {
                    throw result.error;
                }
            });

            const after = await getFolder.execute(deepest.id);
            expect(after.value.path.startsWith(`${ROOT_FOLDER}/renamed/`)).toBe(true);
            expect((await flpCrud.get(deepest.id))?.path).toBe(after.value.path);

            await time("move a level-2 subtree to another level-2 parent", async () => {
                const result = await updateFolder.execute(levels[2][0].id, {
                    parentId: levels[1][1].id
                });
                if (result.isFail()) {
                    throw result.error;
                }
            });
        },
        60 * 60 * 1000
    );
});
