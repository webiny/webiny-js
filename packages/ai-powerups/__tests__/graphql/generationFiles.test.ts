import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { WbPermissions } from "@webiny/api-website-builder/features/permissions/abstractions.js";
import { FileManagerAppFeature } from "@webiny/api-file-manager";
import { CreateFileUseCase } from "@webiny/api-file-manager/features/file/CreateFile/index.js";
import { ListFilesUseCase } from "@webiny/api-file-manager/features/file/ListFiles/index.js";
import { QueueWbGeneratePageContentUseCase } from "~/api/features/QueueWbGeneratePageContent/abstractions.js";
import { QueueWbGeneratePageContentFeature } from "~/api/features/QueueWbGeneratePageContent/feature.js";
import { QueueCmsGenerateEntryContentUseCase } from "~/api/features/QueueCmsGenerateEntryContent/abstractions.js";
import { QueueCmsGenerateEntryContentFeature } from "~/api/features/QueueCmsGenerateEntryContent/feature.js";
import {
    FakeTaskService,
    resetFakeTasks,
    triggeredTasks
} from "~tests/__helpers/FakeTaskService.js";
import { registerFakeSecurity } from "~tests/__helpers/FakeSecurity.js";
import { registerFakeListFiles } from "~tests/__helpers/FakeListFiles.js";
import type { FakeListFilesOptions } from "~tests/__helpers/FakeListFiles.js";

const setup = (options: FakeListFilesOptions = {}) => {
    const container = new Container();
    registerFakeSecurity(container);
    const listFiles = registerFakeListFiles(container, options);

    container.registerInstance(FeatureFlags, {
        get: () => ({ isEnabled: () => true })
    } as unknown as FeatureFlags.Interface);
    container.registerInstance(GetModelUseCase, {
        execute: async (modelId: string) => Result.ok({ modelId, isPrivate: false, fields: [] })
    } as unknown as GetModelUseCase.Interface);
    container.registerInstance(AccessControl, {
        canAccessEntry: async () => true
    } as unknown as AccessControl.Interface);

    container.register(FakeTaskService);
    QueueWbGeneratePageContentFeature.register(container);
    QueueCmsGenerateEntryContentFeature.register(container);

    return { container, listFiles };
};

const generatePage = async (container: Container, additionalFileIds?: string[] | null) => {
    return container.resolve(QueueWbGeneratePageContentUseCase).execute({
        prompt: "A landing page",
        components: [],
        tools: [],
        additionalFileIds
    });
};

const generateEntry = async (container: Container, additionalFileIds?: string[] | null) => {
    return container.resolve(QueueCmsGenerateEntryContentUseCase).execute({
        prompt: "An article",
        modelId: "article",
        additionalFileIds
    });
};

const generators = [
    { name: "generatePageContent", generate: generatePage },
    { name: "generateEntryContent", generate: generateEntry }
];

beforeEach(() => {
    resetFakeTasks();
});

describe("AI Power-Ups generation additional files", () => {
    describe.each(generators)("$name", ({ generate }) => {
        it("lists nothing without additional files", async () => {
            const { container, listFiles } = setup();

            const result = await generate(container, []);

            expect(result.isOk()).toBe(true);
            expect(listFiles.calls).toHaveLength(0);
            expect(triggeredTasks[0].input).toMatchObject({ additionalFileIds: null });
        });

        it("passes on only the files the caller can list, in the requested order", async () => {
            const { container, listFiles } = setup({ readableIds: ["file-a", "file-c"] });

            const result = await generate(container, ["file-c", "file-b", "file-a", "file-c"]);

            expect(result.isOk()).toBe(true);
            // One list call, as the caller, with the deduplicated ids.
            expect(listFiles.calls).toEqual([
                { where: { entryId_in: ["file-c", "file-b", "file-a"] }, limit: 3 }
            ]);
            expect(triggeredTasks).toHaveLength(1);
            expect(triggeredTasks[0].input).toMatchObject({
                additionalFileIds: ["file-c", "file-a"]
            });
        });

        it("queues the task without additional files when listing files fails", async () => {
            const { container } = setup({ readableIds: null });

            const result = await generate(container, ["file-a"]);

            expect(result.isOk()).toBe(true);
            expect(triggeredTasks).toHaveLength(1);
            expect(triggeredTasks[0].input).toMatchObject({ additionalFileIds: null });
        });

        it("reads every requested file, without a limit", async () => {
            const { container, listFiles } = setup();
            const ids = Array.from({ length: 25 }, (_, i) => `file-${i}`);

            await generate(container, ids);

            expect(listFiles.calls[0].limit).toBe(25);
            expect(listFiles.calls[0].where).toEqual({ entryId_in: ids });
            expect(triggeredTasks[0].input).toMatchObject({ additionalFileIds: ids });
        });
    });

    describe("with the File Manager storage", () => {
        const FILE_IDS = ["file-a", "file-b", "file-c"];

        const createContext = async (permissions?: SecurityPermission[]) => {
            const handler = createCmsTestHandler({
                permissions,
                setup: container => {
                    FileManagerAppFeature.register(container);
                    container.register(FakeTaskService);
                    container.registerInstance(WbPermissions, {
                        canEdit: async () => true
                    } as unknown as WbPermissions.Interface);
                    QueueWbGeneratePageContentFeature.register(container);
                }
            });
            const { container } = await handler.getContext<{ container: Container }>();
            return container;
        };

        const createFiles = async (container: Container) => {
            for (const id of FILE_IDS) {
                const result = await container.resolve(CreateFileUseCase).execute({
                    id,
                    key: `${id}/notes.txt`,
                    name: `${id}.txt`,
                    size: 100,
                    type: "text/plain"
                });
                expect(result.isOk()).toBe(true);
            }
        };

        it("matches File Manager file ids with `entryId_in`, not `id_in`", async () => {
            const container = await createContext();
            await createFiles(container);
            const listFiles = container.resolve(ListFilesUseCase);

            const byEntryId = await listFiles.execute({
                where: { entryId_in: ["file-c", "file-a", "file-x"] },
                limit: 3
            });
            const byId = await listFiles.execute({
                where: { id_in: ["file-c", "file-a"] },
                limit: 2
            });

            expect(byEntryId.value.items.map(file => file.id).sort()).toEqual(["file-a", "file-c"]);
            expect(byId.value.items).toHaveLength(0);
        });

        it("passes on the stored files the caller asked for", async () => {
            const container = await createContext();
            await createFiles(container);

            const result = await generatePage(container, ["file-c", "file-x", "file-a"]);

            expect(result.isOk()).toBe(true);
            expect(triggeredTasks[0].input).toMatchObject({
                additionalFileIds: ["file-c", "file-a"]
            });
        });

        it("passes on no files when the caller can't read files", async () => {
            await createFiles(await createContext());
            const container = await createContext([{ name: "wb.*" }]);

            const result = await generatePage(container, ["file-a"]);

            expect(result.isOk()).toBe(true);
            expect(triggeredTasks[0].input).toMatchObject({ additionalFileIds: null });
        });
    });
});
