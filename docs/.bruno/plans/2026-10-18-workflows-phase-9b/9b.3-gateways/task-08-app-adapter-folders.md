### Task 8: App adapter folders (CMS and WB)

R292, R298 (the labels that need `folderExists`, Task 7), D173; Q54, A102; Review Focus 4, 10 (`00-shared.md`). The phase 9a Global Constraints and Rulings R202-R284 apply unchanged (read: no logic duplicated across the CMS and WB packages, the registration rule with root tests flag on and off, `app-workflows` never imports `app-aco` (R292), one public function per file, one named import per line, no inline object types, no nested call arguments, comments end with a period, targeted tests, the pre-commit chain, the editor-only gate).

The shared editor needs the folders of the open model for the rule folder picker and for resolving a saved folder id to its path. It cannot import `app-aco`, so each app supplies them through its editor adapter: `getFolderType(modelId)` (the folder type the rule stores and `folderExists` takes) and `listFolders(modelId)` (the folders the admin can see). Both apps read the list through the data-returning `ListFoldersGateway.execute(type)` of `@webiny/app-aco` (a permission-filtered `aco.listFolders(where: { type }, limit: 10000)`), drop the virtual root row it prepends, and build the `/A/B` title paths from `parentId`.

- **Adapter interface** (`[AWE]/WorkflowEditorAppAdapter.ts`): `AppFolder { id: string; path: string }`, `getFolderType(modelId: string | null): string`, `listFolders(modelId: string | null): Promise<AppFolder[]>`. `modelId` is the selected model row's bare `modelId` (R300), never derived from a namespace in shared code.
- **Path building, once** (`[AWE]/folders/buildAppFolders.ts`, new): `buildAppFolders(folders: FolderNode[], rootId: string): AppFolder[]` with `FolderNode { id: string; title: string; parentId: string | null }` (an ACO `FolderDto` fits it structurally, so `app-workflows` never imports `app-aco`). It drops the row whose id is `rootId`, keeps the order of the input, and builds each path from the titles through `parentId` as `/A/B` (the ACO `path` is slug-based, R292). A parent that is not in the list (a folder the admin cannot see, or the root) ends the path, so a visible child of a hidden folder is listed under its visible ancestors only; a cycle in the data ends the walk instead of looping. The two apps call this one function (R292, no logic duplicated across CMS and WB).
- **CMS** (`CmsWorkflowEditorAppAdapterImpl`): `getFolderType(modelId)` is `cms:<modelId>`; `listFolders(modelId)` is `[]` without a request for `null`, otherwise `buildAppFolders(await gateway.execute(this.getFolderType(modelId)), ROOT_FOLDER)`. A gateway failure rejects; the editor presenter turns that into the R281 banner (Task 14b).
- **WB** (`WbWorkflowEditorAppAdapterImpl`): `getFolderType()` is always `wb:page` (the `WB_PAGE_APP` constant of `@webiny/app-website-builder`; the workflows package's own `WB_PAGE_APP = "wb.page"` is the namespace, a different string) and ignores the model id; `listFolders()` builds the list of that type the same way.
- **Gateway registration** (A102): each app's `editorMounting/feature.ts` registers `ListFoldersGqlGateway` from `@webiny/app-aco/features/folders/listFolders/ListFoldersGqlGateway.js` (it needs `MainGraphQLClient` and `FolderModelProvider`, which app-aco's `AdvancedContentOrganisation` module registers in the root container). Both apps register the same implementation under the same token; in `@webiny/di` the last registration of an abstraction wins, so the two registrations are harmless (and each is gated by the workflows flag, R211). A folder-model load failure surfaces as a rejected `listFolders`.
- **Dependencies** (R292, adio): `@webiny/app-aco` moves to `dependencies` in `app-headless-cms-workflows` (it is a devDependency today) and is added to `dependencies` in `app-website-builder-workflows`. `app-workflows` gets none.
- **Fakes and fixtures:** `createFakeAppAdapter` (in `[AWET]/fakeEditorAppAdapter.ts`) gets `getFolderType` and `listFolders` mocks (default `[]`); `createAppFolder` builder in `editorFixtures.ts`; each app package gets a small `src/testing/createFolder.ts` building an ACO `FolderDto` for its tests.

**Files:**
- Modify: `packages/app-workflows/src/editor/WorkflowEditorAppAdapter.ts`
- Create: `packages/app-workflows/src/editor/folders/buildAppFolders.ts`
- Create: `packages/app-workflows/src/editor/folders/buildAppFolders.test.ts`
- Modify: `packages/app-workflows/src/editor/testing/fakeEditorAppAdapter.ts`
- Modify: `packages/app-workflows/src/editor/testing/editorFixtures.ts`
- Create: `packages/app-headless-cms-workflows/src/testing/createFolder.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapterImpl.tsx`
- Modify: `packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapterImpl.test.tsx`
- Modify: `packages/app-headless-cms-workflows/src/features/editorMounting/feature.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts`
- Modify: `packages/app-headless-cms-workflows/src/index.test.tsx`
- Modify: `packages/app-headless-cms-workflows/package.json`
- Create: `packages/app-website-builder-workflows/src/testing/createFolder.ts`
- Modify: `packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapterImpl.tsx`
- Modify: `packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapterImpl.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/features/editorMounting/feature.ts`
- Modify: `packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts`
- Modify: `packages/app-website-builder-workflows/src/index.test.tsx`
- Modify: `packages/app-website-builder-workflows/package.json`

**Interfaces:**
- Consumes (verified with codegraph and the source): `ListFoldersGateway` (token and `Interface { execute: (type: string) => Promise<FolderDto[]> }`, `@webiny/app-aco/features/folders/listFolders/abstractions.js`), `ListFoldersGqlGateway` (`@webiny/app-aco/features/folders/listFolders/ListFoldersGqlGateway.js`; its dependencies are `MainGraphQLClient` and `FolderModelProvider`; it returns `[RootFolder.create(), ...data]` and throws `Error(message)` when the query returns no data), `FolderModelProvider` (`@webiny/app-aco/features/folders/abstractions.js`), `FolderDto` (`@webiny/app-aco/domain/folder/FolderDto.js`: `id`, `title`, `parentId: string | null`, `type`, ...), `RootFolder.create()` (`@webiny/app-aco/domain/folder/RootFolder.js`; id `ROOT_FOLDER`), `ROOT_FOLDER = "root"` (`@webiny/app-aco/constants.js`), `WB_PAGE_APP = "wb:page"` (`@webiny/app-website-builder/constants.js`), the existing adapters and their tests, `createFakeContentAdapter` (`fakeEditorAppAdapter.ts`). verify: the deep paths `@webiny/app-aco/domain/folder/FolderDto.js` and `.../RootFolder.js` resolve like the `features/...` paths other packages already import (same `"./*"` export); if they do not in the vitest alias setup, build the fixture folders as object literals typed `FolderDto` from the package root (`@webiny/app-aco`) instead.
- Produces (matches the contract): `AppFolder { id: string; path: string }`, `WorkflowEditorAppAdapter.getFolderType(modelId: string | null): string`, `WorkflowEditorAppAdapter.listFolders(modelId: string | null): Promise<AppFolder[]>`, `buildAppFolders`, `FolderNode`, the CMS and WB implementations, the `ListFoldersGqlGateway` registrations. Consumed by Tasks 14b (`app.listFolders(getModelId())`, `getFolderType`), 14 (`folderExists` with the rule folder's own type) and 19b (the folder picker options).

**Test runner note:** admin packages, `yarn test <path>` only. Type check of the co-located tests is `yarn build -p <package> --no-cache` (R243), and `yarn check:test:types -p app-workflows` for the package that has a `__tests__` folder.

- [ ] **Step 1: Write the failing tests**

Modify `packages/app-workflows/src/editor/testing/editorFixtures.ts`: a folder builder for later tasks and the fake.

Before:

```ts
import type { AiModel } from "~/editor/domain/types.js";
```

After:

```ts
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
import type { AiModel } from "~/editor/domain/types.js";
```

Before:

```ts
export const createAiModel = (overrides: Partial<AiModel> = {}): AiModel => {
```

After:

```ts
export const createAppFolder = (overrides: Partial<AppFolder> = {}): AppFolder => {
    return { id: "folder-1", path: "/Campaigns", ...overrides };
};

export const createAiModel = (overrides: Partial<AiModel> = {}): AiModel => {
```

Create `packages/app-workflows/src/editor/folders/buildAppFolders.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { buildAppFolders } from "./buildAppFolders.js";
import type { FolderNode } from "./buildAppFolders.js";

const ROOT = "root";

const folder = (id: string, title: string, parentId: string | null): FolderNode => {
    return { id, title, parentId };
};

describe("buildAppFolders", () => {
    it("drops the root row", () => {
        const result = buildAppFolders([folder(ROOT, "Home", "0"), folder("a", "A", ROOT)], ROOT);

        expect(result).toEqual([{ id: "a", path: "/A" }]);
    });

    it("builds the path of a nested folder from the titles through the parent ids", () => {
        const result = buildAppFolders(
            [
                folder(ROOT, "Home", "0"),
                folder("a", "Campaigns", ROOT),
                folder("b", "Spring", "a"),
                folder("c", "Banners", "b")
            ],
            ROOT
        );

        expect(result).toEqual([
            { id: "a", path: "/Campaigns" },
            { id: "b", path: "/Campaigns/Spring" },
            { id: "c", path: "/Campaigns/Spring/Banners" }
        ]);
    });

    it("builds the path whatever the order of the list", () => {
        const result = buildAppFolders(
            [folder("c", "Banners", "b"), folder("b", "Spring", "a"), folder("a", "Campaigns", ROOT)],
            ROOT
        );

        expect(result).toEqual([
            { id: "c", path: "/Campaigns/Spring/Banners" },
            { id: "b", path: "/Campaigns/Spring" },
            { id: "a", path: "/Campaigns" }
        ]);
    });

    it("treats a top-level folder whose parent is null or the root as top level", () => {
        const result = buildAppFolders(
            [folder("a", "A", null), folder("b", "B", ROOT)],
            ROOT
        );

        expect(result).toEqual([
            { id: "a", path: "/A" },
            { id: "b", path: "/B" }
        ]);
    });

    it("ends the path at a parent the admin cannot see", () => {
        // The permission-filtered list has no folder `hidden`; its visible child is listed from its own title up.
        const result = buildAppFolders(
            [folder(ROOT, "Home", "0"), folder("child", "Public", "hidden"), folder("a", "A", ROOT)],
            ROOT
        );

        expect(result).toEqual([
            { id: "child", path: "/Public" },
            { id: "a", path: "/A" }
        ]);
    });

    it("keeps two folders with the same title as two entries", () => {
        const result = buildAppFolders(
            [folder("a", "Archive", ROOT), folder("b", "Archive", "a")],
            ROOT
        );

        expect(result).toEqual([
            { id: "a", path: "/Archive" },
            { id: "b", path: "/Archive/Archive" }
        ]);
    });

    it("ends the walk on a cycle in the data", () => {
        const result = buildAppFolders([folder("a", "A", "b"), folder("b", "B", "a")], ROOT);

        expect(result).toEqual([
            { id: "a", path: "/B/A" },
            { id: "b", path: "/A/B" }
        ]);
    });

    it("answers an empty list for an empty list and for only the root", () => {
        expect(buildAppFolders([], ROOT)).toEqual([]);
        expect(buildAppFolders([folder(ROOT, "Home", "0")], ROOT)).toEqual([]);
    });
});
```

Modify `packages/app-workflows/src/editor/testing/fakeEditorAppAdapter.ts`.

Before:

```ts
export interface FakeEditorAppAdapter extends WorkflowEditorAppAdapter {
    init: Mock<WorkflowEditorAppAdapter["init"]>;
    renderModelIcon: Mock<WorkflowEditorAppAdapter["renderModelIcon"]>;
}
```

After:

```ts
export interface FakeEditorAppAdapter extends WorkflowEditorAppAdapter {
    init: Mock<WorkflowEditorAppAdapter["init"]>;
    renderModelIcon: Mock<WorkflowEditorAppAdapter["renderModelIcon"]>;
    getFolderType: Mock<WorkflowEditorAppAdapter["getFolderType"]>;
    listFolders: Mock<WorkflowEditorAppAdapter["listFolders"]>;
}
```

Before:

```ts
        renderModelIcon: vi.fn().mockReturnValue(null),
        contentAdapter: createFakeContentAdapter()
    };
```

After:

```ts
        renderModelIcon: vi.fn().mockReturnValue(null),
        getFolderType: vi.fn((modelId: string | null) => {
            return kind === "cms" ? `cms:${modelId ?? ""}` : "wb:page";
        }),
        listFolders: vi.fn().mockResolvedValue([]),
        contentAdapter: createFakeContentAdapter()
    };
```

Create `packages/app-headless-cms-workflows/src/testing/createFolder.ts` (a pure builder, no vitest):

```ts
import type { FolderDto } from "@webiny/app-aco/domain/folder/FolderDto.js";
import { RootFolder } from "@webiny/app-aco/domain/folder/RootFolder.js";

/*
 * An ACO folder as `ListFoldersGateway` returns it: the root folder's shape with this folder's
 * id, title and parent.
 */
export const createFolder = (id: string, title: string, parentId: string | null): FolderDto => {
    return {
        ...RootFolder.create(),
        id,
        title,
        slug: title.toLowerCase(),
        type: "cms:article",
        parentId,
        path: `/${title.toLowerCase()}`
    };
};
```

Modify `packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapterImpl.test.tsx`.

Before:

```ts
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter.js";
import { MODEL } from "~/testing/models.js";
```

After:

```ts
import { ROOT_FOLDER } from "@webiny/app-aco/constants.js";
import { ListFoldersGateway } from "@webiny/app-aco/features/folders/listFolders/abstractions.js";
import { RootFolder } from "@webiny/app-aco/domain/folder/RootFolder.js";
import type { FolderDto } from "@webiny/app-aco/domain/folder/FolderDto.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter.js";
import { createFolder } from "~/testing/createFolder.js";
import { MODEL } from "~/testing/models.js";
```

Before:

```ts
const createAdapter = (models: CmsModel[]) => {
```

After:

```ts
const createAdapter = (models: CmsModel[], folders: FolderDto[] = []) => {
```

Before:

```ts
    container.registerInstance(CmsReviewContentAdapter, contentAdapter);
    container.register(CmsWorkflowEditorAppAdapter);
    const adapter = container.resolve(AdapterAbstraction);

    return { adapter, execute };
};
```

After:

```ts
    // Mirrors the gateway of app-aco: the virtual root row comes first.
    const rootFolder = RootFolder.create();
    const listFoldersExecute = vi
        .fn<ListFoldersGateway.Interface["execute"]>()
        .mockResolvedValue([rootFolder, ...folders]);
    container.registerInstance(ListFoldersGateway, { execute: listFoldersExecute });
    container.registerInstance(CmsReviewContentAdapter, contentAdapter);
    container.register(CmsWorkflowEditorAppAdapter);
    const adapter = container.resolve(AdapterAbstraction);

    return { adapter, execute, listFoldersExecute };
};
```

Before:

```ts
    it("renders nothing for a model without an icon", async () => {
        const { adapter } = createAdapter([createModel("article", "Article", "")]);
        await adapter.init();

        const node = adapter.renderModelIcon("article");

        expect(node).toBeNull();
    });
});
```

After:

```ts
    it("renders nothing for a model without an icon", async () => {
        const { adapter } = createAdapter([createModel("article", "Article", "")]);
        await adapter.init();

        const node = adapter.renderModelIcon("article");

        expect(node).toBeNull();
    });

    describe("folders (R292)", () => {
        it("names the folder type of a model cms:<modelId>", () => {
            const { adapter } = createAdapter([]);

            expect(adapter.getFolderType("article")).toBe("cms:article");
            expect(adapter.getFolderType("author")).toBe("cms:author");
        });

        it("lists the folders with the type of the model, root excluded, and the title paths", async () => {
            const { adapter, listFoldersExecute } = createAdapter(
                [],
                [
                    createFolder("folder-a", "Campaigns", ROOT_FOLDER),
                    createFolder("folder-b", "Spring", "folder-a"),
                    createFolder("folder-c", "Press", ROOT_FOLDER)
                ]
            );

            const folders = await adapter.listFolders("article");

            expect(listFoldersExecute).toHaveBeenCalledTimes(1);
            expect(listFoldersExecute).toHaveBeenCalledWith("cms:article");
            expect(folders).toEqual([
                { id: "folder-a", path: "/Campaigns" },
                { id: "folder-b", path: "/Campaigns/Spring" },
                { id: "folder-c", path: "/Press" }
            ]);
        });

        it("asks for the folders of the model it is given each time", async () => {
            const { adapter, listFoldersExecute } = createAdapter([]);

            await adapter.listFolders("article");
            await adapter.listFolders("author");

            expect(listFoldersExecute.mock.calls).toEqual([["cms:article"], ["cms:author"]]);
        });

        it("passes a permission-filtered list through: a child of a hidden folder starts at its own title", async () => {
            const { adapter, listFoldersExecute } = createAdapter(
                [],
                [createFolder("folder-b", "Spring", "folder-hidden")]
            );

            const folders = await adapter.listFolders("article");

            expect(folders).toEqual([{ id: "folder-b", path: "/Spring" }]);
            expect(listFoldersExecute).toHaveBeenCalledTimes(1);
        });

        it("lists nothing and sends no request without a model", async () => {
            const { adapter, listFoldersExecute } = createAdapter([]);

            const folders = await adapter.listFolders(null);

            expect(folders).toEqual([]);
            expect(listFoldersExecute).not.toHaveBeenCalled();
        });

        it("rejects when the folders cannot be loaded", async () => {
            const { adapter, listFoldersExecute } = createAdapter([]);
            const failure = new Error("Could not fetch folders");
            listFoldersExecute.mockRejectedValue(failure);

            await expect(adapter.listFolders("article")).rejects.toBe(failure);
        });
    });
});
```

Modify `packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts`.

Before:

```ts
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
```

After:

```ts
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { FolderModelProvider } from "@webiny/app-aco/features/folders/abstractions.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
```

Before:

```ts
import { CmsWorkflowEditorUseCases } from "~/features/editorGateway/CmsWorkflowEditorUseCases.js";
import { CmsWorkflowEditorAppAdapter } from "./CmsWorkflowEditorAppAdapter.js";
```

After:

```ts
import { CmsWorkflowEditorUseCases } from "~/features/editorGateway/CmsWorkflowEditorUseCases.js";
import { createFolder } from "~/testing/createFolder.js";
import { CmsWorkflowEditorAppAdapter } from "./CmsWorkflowEditorAppAdapter.js";
```

Before:

```ts
const createContainer = () => {
    const reviewUseCases = createFakeUseCases();
    const container = new Container();
```

After:

```ts
const createContainer = () => {
    const reviewUseCases = createFakeUseCases();
    const client = { execute: vi.fn() };
    const folderModelProvider = {
        getModel: vi.fn().mockRejectedValue(new Error("The folder model is not needed here.")),
        getGraphQLSelection: vi.fn().mockResolvedValue("{ id title parentId }")
    };
    const container = new Container();
    container.registerInstance(MainGraphQLClient, client);
    container.registerInstance(FolderModelProvider, folderModelProvider);
```

Before:

```ts
    return { container, reviewUseCases };
};
```

After:

```ts
    return { container, reviewUseCases, client };
};
```

Before:

```ts
    it("registers the adapter as a singleton", () => {
```

After:

```ts
    it("registers the app-aco folder gateway so the adapter lists the folders of the model", async () => {
        const { container, client } = createContainer();
        client.execute.mockResolvedValue({
            aco: {
                listFolders: {
                    data: [
                        createFolder("folder-a", "Campaigns", "root"),
                        createFolder("folder-b", "Spring", "folder-a")
                    ],
                    error: null
                }
            }
        });
        const { app } = CmsWorkflowEditorMountingFeature.resolve(container);

        const folders = await app.listFolders("article");

        expect(folders).toEqual([
            { id: "folder-a", path: "/Campaigns" },
            { id: "folder-b", path: "/Campaigns/Spring" }
        ]);
        expect(client.execute).toHaveBeenCalledTimes(1);
        expect(client.execute.mock.calls[0][0].variables).toEqual({
            type: "cms:article",
            limit: 10000
        });
    });

    it("rejects when the folder query returns no data", async () => {
        const { container, client } = createContainer();
        client.execute.mockResolvedValue({
            aco: { listFolders: { data: null, error: { message: "Not allowed." } } }
        });
        const { app } = CmsWorkflowEditorMountingFeature.resolve(container);

        await expect(app.listFolders("article")).rejects.toThrow("Not allowed.");
    });

    it("registers the adapter as a singleton", () => {
```

Modify `packages/app-headless-cms-workflows/src/index.test.tsx` (the gated root).

Before:

```ts
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { AppReviewRowProvider }
```

After:

```ts
import { FolderModelProvider } from "@webiny/app-aco/features/folders/abstractions.js";
import { ListFoldersGateway } from "@webiny/app-aco/features/folders/listFolders/abstractions.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { AppReviewRowProvider }
```

Before:

```ts
import { CmsWorkflowEditorAppAdapter } from "~/features/editorMounting/CmsWorkflowEditorAppAdapter.js";
import { CmsWorkflows } from "./index.js";
```

After:

```ts
import { CmsWorkflowEditorAppAdapter } from "~/features/editorMounting/CmsWorkflowEditorAppAdapter.js";
import { createFolder } from "~/testing/createFolder.js";
import { CmsWorkflows } from "./index.js";
```

Before:

```ts
        container.registerInstance(Notifications, {
            error: vi.fn()
        } as unknown as Notifications.Interface);
        return container;
```

After:

```ts
        container.registerInstance(Notifications, {
            error: vi.fn()
        } as unknown as Notifications.Interface);
        // app-aco's module registers the folder model provider in the real admin.
        container.registerInstance(FolderModelProvider, {
            getModel: vi.fn().mockRejectedValue(new Error("The folder model is not needed here.")),
            getGraphQLSelection: vi.fn().mockResolvedValue("{ id title parentId }")
        });
        return container;
```

Before:

```ts
    it("registers neither the workflow editor use cases nor the CMS editor adapter with the flag off", () => {
```

After:

```ts
    it("lists the folders of a model through the CMS editor adapter with the flag on", async () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockResolvedValue({
            aco: {
                listFolders: {
                    data: [createFolder("folder-a", "Campaigns", "root")],
                    error: null
                }
            }
        });

        const adapter = container.resolve(CmsWorkflowEditorAppAdapter);
        const folders = await adapter.listFolders("article");

        expect(adapter.getFolderType("article")).toBe("cms:article");
        expect(folders).toEqual([{ id: "folder-a", path: "/Campaigns" }]);
        expect(container.resolve(ListFoldersGateway)).toBeDefined();
    });

    it("registers no folder gateway with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(ListFoldersGateway)).toThrow("No registration found");
    });

    it("registers neither the workflow editor use cases nor the CMS editor adapter with the flag off", () => {
```

Create `packages/app-website-builder-workflows/src/testing/createFolder.ts`:

```ts
import type { FolderDto } from "@webiny/app-aco/domain/folder/FolderDto.js";
import { RootFolder } from "@webiny/app-aco/domain/folder/RootFolder.js";

/*
 * An ACO folder as `ListFoldersGateway` returns it: the root folder's shape with this folder's
 * id, title and parent.
 */
export const createFolder = (id: string, title: string, parentId: string | null): FolderDto => {
    return {
        ...RootFolder.create(),
        id,
        title,
        slug: title.toLowerCase(),
        type: "wb:page",
        parentId,
        path: `/${title.toLowerCase()}`
    };
};
```

Modify `packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapterImpl.test.tsx`.

Before:

```ts
import { Container } from "@webiny/di";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter.js";
```

After:

```ts
import { Container } from "@webiny/di";
import { ROOT_FOLDER } from "@webiny/app-aco/constants.js";
import type { FolderDto } from "@webiny/app-aco/domain/folder/FolderDto.js";
import { RootFolder } from "@webiny/app-aco/domain/folder/RootFolder.js";
import { ListFoldersGateway } from "@webiny/app-aco/features/folders/listFolders/abstractions.js";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter.js";
import { createFolder } from "~/testing/createFolder.js";
```

Before:

```ts
const createAdapter = () => {
    const container = new Container();
    container.registerInstance(WbReviewContentAdapter, contentAdapter);
    container.register(WbWorkflowEditorAppAdapter);

    return container.resolve(AdapterAbstraction);
};
```

After:

```ts
const createAdapterWithGateway = (folders: FolderDto[] = []) => {
    const container = new Container();
    // Mirrors the gateway of app-aco: the virtual root row comes first.
    const rootFolder = RootFolder.create();
    const listFoldersExecute = vi
        .fn<ListFoldersGateway.Interface["execute"]>()
        .mockResolvedValue([rootFolder, ...folders]);
    container.registerInstance(ListFoldersGateway, { execute: listFoldersExecute });
    container.registerInstance(WbReviewContentAdapter, contentAdapter);
    container.register(WbWorkflowEditorAppAdapter);
    const adapter = container.resolve(AdapterAbstraction);

    return { adapter, listFoldersExecute };
};

const createAdapter = () => {
    return createAdapterWithGateway().adapter;
};
```

Also add `import { vi } from "vitest";` after the `it` import: Before:

```ts
import { it } from "vitest";
import { Container } from "@webiny/di";
```

After:

```ts
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
```

Before (the last test of the file):

```ts
        expect(node.props.label).toBe("Pages");
    });
});
```

After:

```ts
        expect(node.props.label).toBe("Pages");
    });

    describe("folders (R292)", () => {
        it("names the page folder type wb:page whatever the model id", () => {
            const adapter = createAdapter();

            expect(adapter.getFolderType(null)).toBe("wb:page");
            expect(adapter.getFolderType("page")).toBe("wb:page");
            expect(adapter.getFolderType("anything")).toBe("wb:page");
        });

        it("lists the page folders with the type wb:page, root excluded, and the title paths", async () => {
            const { adapter, listFoldersExecute } = createAdapterWithGateway([
                createFolder("folder-a", "Landing pages", ROOT_FOLDER),
                createFolder("folder-b", "Autumn", "folder-a"),
                createFolder("folder-c", "Blog", ROOT_FOLDER)
            ]);

            const folders = await adapter.listFolders("page");

            expect(listFoldersExecute).toHaveBeenCalledTimes(1);
            expect(listFoldersExecute).toHaveBeenCalledWith("wb:page");
            expect(folders).toEqual([
                { id: "folder-a", path: "/Landing pages" },
                { id: "folder-b", path: "/Landing pages/Autumn" },
                { id: "folder-c", path: "/Blog" }
            ]);
        });

        it("ignores the model id, also null", async () => {
            const { adapter, listFoldersExecute } = createAdapterWithGateway();

            await adapter.listFolders(null);
            await adapter.listFolders("anything");

            expect(listFoldersExecute.mock.calls).toEqual([["wb:page"], ["wb:page"]]);
        });

        it("passes a permission-filtered list through: a child of a hidden folder starts at its own title", async () => {
            const { adapter } = createAdapterWithGateway([
                createFolder("folder-b", "Autumn", "folder-hidden")
            ]);

            const folders = await adapter.listFolders("page");

            expect(folders).toEqual([{ id: "folder-b", path: "/Autumn" }]);
        });

        it("rejects when the folders cannot be loaded", async () => {
            const { adapter, listFoldersExecute } = createAdapterWithGateway();
            const failure = new Error("Could not fetch folders");
            listFoldersExecute.mockRejectedValue(failure);

            await expect(adapter.listFolders("page")).rejects.toBe(failure);
        });
    });
});
```

Modify `packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts`.

Before:

```ts
import { Container } from "@webiny/di";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
```

After:

```ts
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { FolderModelProvider } from "@webiny/app-aco/features/folders/abstractions.js";
import { createFakeContentAdapter } from "@webiny/app-workflows/editor/testing/fakeEditorAppAdapter.js";
```

Before:

```ts
import { WbWorkflowEditorUseCases } from "~/features/editorGateway/WbWorkflowEditorUseCases.js";
import { WbWorkflowEditorAppAdapter } from "./WbWorkflowEditorAppAdapter.js";
```

After:

```ts
import { WbWorkflowEditorUseCases } from "~/features/editorGateway/WbWorkflowEditorUseCases.js";
import { createFolder } from "~/testing/createFolder.js";
import { WbWorkflowEditorAppAdapter } from "./WbWorkflowEditorAppAdapter.js";
```

Before:

```ts
const createContainer = () => {
    const reviewUseCases = createFakeUseCases();
    const container = new Container();
```

After:

```ts
const createContainer = () => {
    const reviewUseCases = createFakeUseCases();
    const client = { execute: vi.fn() };
    const folderModelProvider = {
        getModel: vi.fn().mockRejectedValue(new Error("The folder model is not needed here.")),
        getGraphQLSelection: vi.fn().mockResolvedValue("{ id title parentId }")
    };
    const container = new Container();
    container.registerInstance(MainGraphQLClient, client);
    container.registerInstance(FolderModelProvider, folderModelProvider);
```

Before:

```ts
    return { container, reviewUseCases };
};
```

After:

```ts
    return { container, reviewUseCases, client };
};
```

Add `import { vi } from "vitest";` to this file: Before:

```ts
import { it } from "vitest";
import { Container } from "@webiny/di";
```

After:

```ts
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
```

Before:

```ts
    it("registers the adapter as a singleton", () => {
```

After:

```ts
    it("registers the app-aco folder gateway so the adapter lists the page folders", async () => {
        const { container, client } = createContainer();
        client.execute.mockResolvedValue({
            aco: {
                listFolders: {
                    data: [
                        createFolder("folder-a", "Landing pages", "root"),
                        createFolder("folder-b", "Autumn", "folder-a")
                    ],
                    error: null
                }
            }
        });
        const { app } = WbWorkflowEditorMountingFeature.resolve(container);

        const folders = await app.listFolders("page");

        expect(folders).toEqual([
            { id: "folder-a", path: "/Landing pages" },
            { id: "folder-b", path: "/Landing pages/Autumn" }
        ]);
        expect(client.execute).toHaveBeenCalledTimes(1);
        expect(client.execute.mock.calls[0][0].variables).toEqual({
            type: "wb:page",
            limit: 10000
        });
    });

    it("rejects when the folder query returns no data", async () => {
        const { container, client } = createContainer();
        client.execute.mockResolvedValue({
            aco: { listFolders: { data: null, error: { message: "Not allowed." } } }
        });
        const { app } = WbWorkflowEditorMountingFeature.resolve(container);

        await expect(app.listFolders("page")).rejects.toThrow("Not allowed.");
    });

    it("registers the adapter as a singleton", () => {
```

Modify `packages/app-website-builder-workflows/src/index.test.tsx` (the gated root).

Before:

```ts
import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { AppReviewRowProvider }
```

After:

```ts
import { FolderModelProvider } from "@webiny/app-aco/features/folders/abstractions.js";
import { ListFoldersGateway } from "@webiny/app-aco/features/folders/listFolders/abstractions.js";
import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { AppReviewRowProvider }
```

Before:

```ts
import { WbWorkflowEditorAppAdapter } from "~/features/editorMounting/WbWorkflowEditorAppAdapter.js";
import { WebsiteBuilderWorkflows } from "./index.js";
```

After:

```ts
import { WbWorkflowEditorAppAdapter } from "~/features/editorMounting/WbWorkflowEditorAppAdapter.js";
import { createFolder } from "~/testing/createFolder.js";
import { WebsiteBuilderWorkflows } from "./index.js";
```

Before:

```ts
        container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
        return container;
    };
```

After:

```ts
        container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
        // app-aco's module registers the folder model provider in the real admin.
        container.registerInstance(FolderModelProvider, {
            getModel: vi.fn().mockRejectedValue(new Error("The folder model is not needed here.")),
            getGraphQLSelection: vi.fn().mockResolvedValue("{ id title parentId }")
        });
        return container;
    };
```

Before:

```ts
    it("registers neither the workflow editor use cases nor the WB editor adapter with the flag off", () => {
```

After:

```ts
    it("lists the page folders through the WB editor adapter with the flag on", async () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockResolvedValue({
            aco: {
                listFolders: {
                    data: [createFolder("folder-a", "Landing pages", "root")],
                    error: null
                }
            }
        });

        const adapter = container.resolve(WbWorkflowEditorAppAdapter);
        const folders = await adapter.listFolders("page");

        expect(adapter.getFolderType("page")).toBe("wb:page");
        expect(folders).toEqual([{ id: "folder-a", path: "/Landing pages" }]);
        expect(container.resolve(ListFoldersGateway)).toBeDefined();
    });

    it("registers no folder gateway with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(ListFoldersGateway)).toThrow("No registration found");
    });

    it("registers neither the workflow editor use cases nor the WB editor adapter with the flag off", () => {
```

- [ ] **Step 2: Run the new tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/folders/buildAppFolders.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapterImpl.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapterImpl.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
```

Expected: FAIL. `buildAppFolders.test.ts` cannot resolve `./buildAppFolders.js`; the adapter tests fail with `adapter.getFolderType is not a function` and `adapter.listFolders is not a function`; the feature and root tests fail because `app.listFolders` does not exist and `ListFoldersGateway` has no registration (`No registration found for ListFoldersGateway`).

- [ ] **Step 3: Implementation**

Modify `packages/app-workflows/src/editor/WorkflowEditorAppAdapter.ts`.

Before:

```ts
/*
 * What the shared editor needs from one app besides the editor use cases (R202): the panel label,
 * the wording of the header, the one-time setup, the model icon and the content adapter that links
 * a blocking review to its content. The app package implements it (Tasks 20, 21) and passes it to
 * the view as a prop. `app-workflows` has no icon library, so the app renders the icon.
 */
export interface WorkflowEditorAppAdapter {
```

After:

```ts
// A folder the admin can see, with the readable path of the rule folder picker (R292).
export interface AppFolder {
    id: string;
    // The titles through the parents, `/A/B`; the root folder is not listed.
    path: string;
}

/*
 * What the shared editor needs from one app besides the editor use cases (R202): the panel label,
 * the wording of the header, the one-time setup, the model icon, the folders of a model and the
 * content adapter that links a blocking review to its content. The app package implements it
 * (Tasks 20, 21) and passes it to the view as a prop. `app-workflows` has no icon library and no
 * dependency on `app-aco`, so the app renders the icon and lists the folders (R292).
 */
export interface WorkflowEditorAppAdapter {
```

Before:

```ts
    // The icon of a model row by its `modelId`; null for none.
    renderModelIcon(modelId: string): ReactNode;
    contentAdapter: IReviewContentAdapter;
}
```

After:

```ts
    // The icon of a model row by its `modelId`; null for none.
    renderModelIcon(modelId: string): ReactNode;
    // The folder type a rule stores and `folderExists` takes: `cms:<modelId>` or `wb:page` (R292).
    getFolderType(modelId: string | null): string;
    // The folders of that type the admin can see (the ACO list is permission-filtered), root
    // excluded. Rejects when the list cannot be loaded.
    listFolders(modelId: string | null): Promise<AppFolder[]>;
    contentAdapter: IReviewContentAdapter;
}
```

Create `packages/app-workflows/src/editor/folders/buildAppFolders.ts`:

```ts
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";

// What the path needs of a folder; an ACO `FolderDto` fits it, so no `app-aco` import (R292).
export interface FolderNode {
    id: string;
    title: string;
    parentId: string | null;
}

const buildPath = (folder: FolderNode, byId: ReadonlyMap<string, FolderNode>): string => {
    const titles: string[] = [folder.title];
    const visited = new Set<string>([folder.id]);
    let parentId = folder.parentId;

    while (parentId !== null) {
        const parent = byId.get(parentId);
        // A parent that is not listed (hidden from the admin, or the root) ends the path.
        if (!parent || visited.has(parent.id)) {
            break;
        }
        titles.unshift(parent.title);
        visited.add(parent.id);
        parentId = parent.parentId;
    }

    return `/${titles.join("/")}`;
};

/*
 * The folders of an app as the rule folder picker lists them: the root row (`rootId`) dropped, the
 * order of the input kept and each path built from the titles through `parentId` as `/A/B`.
 */
export const buildAppFolders = (folders: FolderNode[], rootId: string): AppFolder[] => {
    const listed = folders.filter(folder => folder.id !== rootId);
    const byId = new Map<string, FolderNode>();
    for (const folder of listed) {
        byId.set(folder.id, folder);
    }

    return listed.map(folder => {
        return { id: folder.id, path: buildPath(folder, byId) };
    });
};
```

Modify `packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapterImpl.tsx`.

Before:

```ts
import { Icon } from "@webiny/admin-ui";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
```

After:

```ts
import { Icon } from "@webiny/admin-ui";
import { ROOT_FOLDER } from "@webiny/app-aco/constants.js";
import { ListFoldersGateway } from "@webiny/app-aco/features/folders/listFolders/abstractions.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
```

Before:

```ts
import { normalizeIcon } from "@webiny/app-headless-cms/utils/normalizeIcon.js";
import { CmsReviewContentAdapter }
```

After:

```ts
import { normalizeIcon } from "@webiny/app-headless-cms/utils/normalizeIcon.js";
import type { AppFolder } from "@webiny/app-workflows/editor/WorkflowEditorAppAdapter.js";
import { buildAppFolders } from "@webiny/app-workflows/editor/folders/buildAppFolders.js";
import { CmsReviewContentAdapter }
```

Before:

```ts
 * `ListModelsUseCase` fills the cache once and serves it afterwards.
 */
```

After:

```ts
 * `ListModelsUseCase` fills the cache once and serves it afterwards. The folders of a model are the
 * ACO folders of type `cms:<modelId>` the admin can see (R292).
 */
```

Before:

```ts
        public readonly contentAdapter: CmsReviewContentAdapter.Interface
    ) {}
```

After:

```ts
        public readonly contentAdapter: CmsReviewContentAdapter.Interface,
        private listFoldersGateway: ListFoldersGateway.Interface
    ) {}
```

Before:

```ts
        return (
            <Icon
                icon={<FontAwesomeIcon icon={icon} />}
                label={model.name}
                size="sm"
                className="text-neutral-strong"
            />
        );
    }
}
```

After:

```ts
        return (
            <Icon
                icon={<FontAwesomeIcon icon={icon} />}
                label={model.name}
                size="sm"
                className="text-neutral-strong"
            />
        );
    }

    getFolderType(modelId: string | null): string {
        return `cms:${modelId ?? ""}`;
    }

    async listFolders(modelId: string | null): Promise<AppFolder[]> {
        // Without a model there is no folder type to ask for.
        if (modelId === null) {
            return [];
        }

        const type = this.getFolderType(modelId);
        const folders = await this.listFoldersGateway.execute(type);

        return buildAppFolders(folders, ROOT_FOLDER);
    }
}
```

Before:

```ts
    dependencies: [ListModelsUseCase, ModelsCache, CmsReviewContentAdapter]
```

After:

```ts
    dependencies: [ListModelsUseCase, ModelsCache, CmsReviewContentAdapter, ListFoldersGateway]
```

Modify `packages/app-headless-cms-workflows/src/features/editorMounting/feature.ts`.

Before:

```ts
import { createFeature } from "@webiny/feature/admin";
import { CmsReviewUseCases }
```

After:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListFoldersGqlGateway } from "@webiny/app-aco/features/folders/listFolders/ListFoldersGqlGateway.js";
import { CmsReviewUseCases }
```

Before:

```ts
    register(container) {
        container.register(CmsWorkflowEditorAppAdapter).inSingletonScope();
    },
```

After:

```ts
    register(container) {
        // The adapter lists the model's folders through app-aco's gateway (R292). The Website
        // Builder registers the same implementation; the last registration wins and they are alike.
        container.register(ListFoldersGqlGateway);
        container.register(CmsWorkflowEditorAppAdapter).inSingletonScope();
    },
```

Modify `packages/app-headless-cms-workflows/package.json`.

Before:

```json
    "@webiny/app": "0.0.0",
    "@webiny/app-admin": "0.0.0",
    "@webiny/app-headless-cms": "0.0.0",
```

After:

```json
    "@webiny/app": "0.0.0",
    "@webiny/app-aco": "0.0.0",
    "@webiny/app-admin": "0.0.0",
    "@webiny/app-headless-cms": "0.0.0",
```

Before:

```json
    "@types/react": "18.3.31",
    "@webiny/app-aco": "0.0.0",
    "@webiny/build-tools": "0.0.0",
```

After:

```json
    "@types/react": "18.3.31",
    "@webiny/build-tools": "0.0.0",
```

Modify `packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapterImpl.tsx`.

Before:

```ts
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as PagesIcon } from "@webiny/icons/web.svg";
import { WbReviewContentAdapter }
```

After:

```ts
import { Icon } from "@webiny/admin-ui";
import { ROOT_FOLDER } from "@webiny/app-aco/constants.js";
import { ListFoldersGateway } from "@webiny/app-aco/features/folders/listFolders/abstractions.js";
import { WB_PAGE_APP as WB_PAGE_FOLDER_TYPE } from "@webiny/app-website-builder/constants.js";
import type { AppFolder } from "@webiny/app-workflows/editor/WorkflowEditorAppAdapter.js";
import { buildAppFolders } from "@webiny/app-workflows/editor/folders/buildAppFolders.js";
import { ReactComponent as PagesIcon } from "@webiny/icons/web.svg";
import { WbReviewContentAdapter }
```

Before:

```ts
 * The Website Builder knowledge of the shared editor view (R280): one model, Pages, so there is no
 * list to load and one fixed icon.
 */
```

After:

```ts
 * The Website Builder knowledge of the shared editor view (R280): one model, Pages, so there is no
 * list to load and one fixed icon. The folders are the page folders, type `wb:page`, whatever the
 * model id (R292).
 */
```

Before:

```ts
    constructor(public readonly contentAdapter: WbReviewContentAdapter.Interface) {}
```

After:

```ts
    constructor(
        public readonly contentAdapter: WbReviewContentAdapter.Interface,
        private listFoldersGateway: ListFoldersGateway.Interface
    ) {}
```

Before:

```ts
        return (
            <Icon icon={<PagesIcon />} label="Pages" size="sm" className="text-neutral-strong" />
        );
    }
}
```

After:

```ts
        return (
            <Icon icon={<PagesIcon />} label="Pages" size="sm" className="text-neutral-strong" />
        );
    }

    getFolderType(): string {
        return WB_PAGE_FOLDER_TYPE;
    }

    async listFolders(): Promise<AppFolder[]> {
        const type = this.getFolderType();
        const folders = await this.listFoldersGateway.execute(type);

        return buildAppFolders(folders, ROOT_FOLDER);
    }
}
```

Before:

```ts
    dependencies: [WbReviewContentAdapter]
```

After:

```ts
    dependencies: [WbReviewContentAdapter, ListFoldersGateway]
```

Modify `packages/app-website-builder-workflows/src/features/editorMounting/feature.ts`.

Before:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WbReviewUseCases }
```

After:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListFoldersGqlGateway } from "@webiny/app-aco/features/folders/listFolders/ListFoldersGqlGateway.js";
import { WbReviewUseCases }
```

Before:

```ts
    register(container) {
        container.register(WbWorkflowEditorAppAdapter).inSingletonScope();
    },
```

After:

```ts
    register(container) {
        // The adapter lists the page folders through app-aco's gateway (R292). The CMS registers
        // the same implementation; the last registration wins and they are alike.
        container.register(ListFoldersGqlGateway);
        container.register(WbWorkflowEditorAppAdapter).inSingletonScope();
    },
```

Modify `packages/app-website-builder-workflows/package.json`.

Before:

```json
    "@webiny/app": "0.0.0",
    "@webiny/app-admin": "0.0.0",
    "@webiny/app-website-builder": "0.0.0",
```

After:

```json
    "@webiny/app": "0.0.0",
    "@webiny/app-aco": "0.0.0",
    "@webiny/app-admin": "0.0.0",
    "@webiny/app-website-builder": "0.0.0",
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/folders/buildAppFolders.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapterImpl.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapterImpl.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn install > /dev/null 2>&1
yarn test packages/app-workflows/src/editor 2>&1 | tail -40
yarn test packages/app-headless-cms-workflows/src/features 2>&1 | tail -40
yarn test packages/app-website-builder-workflows/src/features 2>&1 | tail -40
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass, no TypeScript errors in the three packages. Objects typed `WorkflowEditorAppAdapter` that are not built by `createFakeAppAdapter` (`fakeViewApp.tsx` and the `as unknown as WorkflowEditorAppAdapter` literal in `WorkflowEditorView.test.tsx`) are partial casts and keep compiling; any other literal the build flags (`grep -rn "appliesToLabel" packages/*/src`) gets the two methods.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): let each app list its folders through the editor adapter" -m "The editor app adapter gets getFolderType and listFolders. The CMS lists the ACO folders of type cms:<modelId> and Website Builder the wb:page folders, both through the app-aco list gateway, without the root row and with title paths built by one shared function. app-workflows does not depend on app-aco." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Fake file name:** the contract says `[AWET]/createFakeAppAdapter.ts`; the real file is `[AWET]/fakeEditorAppAdapter.ts` (it exports `createFakeAppAdapter` and `createFakeContentAdapter`), so that file is modified. `createAppFolder` is added to `editorFixtures.ts`.
- **Extra shared file:** `[AWE]/folders/buildAppFolders.ts` (and its test) is new, not in the contract's file list: the title-path logic must exist once, not in both app adapters, and it can live in `app-workflows` because it takes plain `{ id, title, parentId }` nodes (R292 forbids only the `app-aco` import). Its `rootId` argument is how the apps pass `ROOT_FOLDER` without `app-workflows` knowing it.
- **`getFolderType(null)` and `listFolders(null)` in the CMS:** the contract types `modelId` as `string | null` but gives no meaning to `null` for the CMS. `listFolders(null)` returns `[]` without a request and `getFolderType(null)` returns `cms:` (never used for a request); `null` only happens before a model row is selected, when no picker is shown. The WB ignores the argument as the contract says.
- **WB folder type constant:** imported from `@webiny/app-website-builder/constants.js` (`WB_PAGE_APP = "wb:page"`), aliased as `WB_PAGE_FOLDER_TYPE`; the workflows package's own `WB_PAGE_APP = "wb.page"` is the namespace and is not used here.
- **Duplicate gateway registration:** both packages register `ListFoldersGqlGateway` in the one root container; `@webiny/di` resolves the last registration of an abstraction, both are the same class, and each registration is behind its package's flag, so neither flag alone breaks the other. A test in each package asserts the registration with the flag on and its absence with the flag off.
- **Fixture builders:** `src/testing/createFolder.ts` exists once per app package (an ACO `FolderDto` builder over `RootFolder.create()`); `app-workflows` cannot host it without importing `app-aco`.
- **Test-only registrations:** the existing feature and root tests now register `MainGraphQLClient` and a `FolderModelProvider` fake because resolving the adapter resolves the real `ListFoldersGqlGateway`, which depends on both (in the admin, app-aco's `AdvancedContentOrganisation` registers the provider). If `AdvancedContentOrganisation` is not mounted in some admin, the first `listFolders` rejects with `No registration found for FolderModel` and the editor shows the folder-list banner (Task 14b).
- Size: large (one shared function, two adapters, two feature files, two package.json files, six modified test files).

## Review fixes (sub-phase review)

- The two adapter tests no longer pass `RootFolder.create()` straight into `mockResolvedValue`; the root row is a named `const` first (no nested call arguments).
- Verified: `ROOT_FOLDER` is re-exported by `@webiny/app-aco/constants.js` (from `@webiny/shared-aco`), `ListFoldersGqlGateway` sends `{ type, limit: 10000 }` and throws `Error(error.message)` for no data, `@webiny/di` resolves the last registration (the duplicate registration claim holds), the `FolderModelProvider` fake matches `IFolderModelProvider`, every Before hunk matches the current files, CMS folder type `cms:${modelId}` matches app-headless-cms's own use, and package.json hunks match.
