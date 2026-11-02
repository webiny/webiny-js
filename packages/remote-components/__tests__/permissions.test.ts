import { describe, it, expect } from "vitest";
import { Container, Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetFileContentsByIdUseCase } from "@webiny/api-file-manager/features/file/GetFileContentsById/index.js";
import { RemoteComponentPermissionsFeature } from "~/api/features/permissions/feature.js";
import { GetRemoteComponentUseCase } from "~/api/features/getComponent/abstractions.js";
import { GetRemoteComponentRepository } from "~/api/features/getComponent/abstractions.js";
import { GetRemoteComponentUseCase as GetRemoteComponentUseCaseImplementation } from "~/api/features/getComponent/GetRemoteComponentUseCase.js";
import { ListRemoteComponentsUseCase } from "~/api/features/listComponents/abstractions.js";
import { ListRemoteComponentsRepository } from "~/api/features/listComponents/abstractions.js";
import { ListRemoteComponentsUseCase as ListRemoteComponentsUseCaseImplementation } from "~/api/features/listComponents/ListRemoteComponentsUseCase.js";
import { CreateRemoteComponentUseCase } from "~/api/features/createComponent/abstractions.js";
import { CreateRemoteComponentRepository } from "~/api/features/createComponent/abstractions.js";
import { CreateRemoteComponentUseCase as CreateRemoteComponentUseCaseImplementation } from "~/api/features/createComponent/CreateRemoteComponentUseCase.js";
import { UpdateRemoteComponentUseCase } from "~/api/features/updateComponent/abstractions.js";
import { UpdateRemoteComponentRepository } from "~/api/features/updateComponent/abstractions.js";
import { UpdateRemoteComponentUseCase as UpdateRemoteComponentUseCaseImplementation } from "~/api/features/updateComponent/UpdateRemoteComponentUseCase.js";
import { DeleteRemoteComponentUseCase } from "~/api/features/deleteComponent/abstractions.js";
import { DeleteRemoteComponentRepository } from "~/api/features/deleteComponent/abstractions.js";
import { DeleteRemoteComponentUseCase as DeleteRemoteComponentUseCaseImplementation } from "~/api/features/deleteComponent/DeleteRemoteComponentUseCase.js";
import { BundleRemoteComponentUseCase } from "~/api/features/bundleComponent/abstractions.js";
import { BundleRemoteComponentUseCase as BundleRemoteComponentUseCaseImplementation } from "~/api/features/bundleComponent/BundleRemoteComponentUseCase.js";
import { GenerateRemoteComponentUseCase } from "~/api/features/generateComponent/abstractions.js";
import { GenerateRemoteComponentUseCase as GenerateRemoteComponentUseCaseImplementation } from "~/api/features/generateComponent/GenerateRemoteComponentUseCase.js";
import { RefineRemoteComponentUseCase } from "~/api/features/refineComponent/abstractions.js";
import { RefineRemoteComponentUseCase as RefineRemoteComponentUseCaseImplementation } from "~/api/features/refineComponent/RefineRemoteComponentUseCase.js";
import type { RemoteComponentDto } from "~/shared/types.js";

interface PermissionLike {
    name: string;
    [key: string]: unknown;
}

const NOT_AUTHORIZED = "RemoteComponent/NotAuthorized";

const component: RemoteComponentDto = {
    id: "c1",
    name: "Custom/Badge",
    label: "Badge",
    description: "",
    aiContext: "",
    source: "",
    css: "",
    bundledJs: "",
    bundledJsSha256: "",
    bundledCss: "",
    bundledCssSha256: "",
    aiPrompt: "",
    status: "draft",
    sdkVersion: "1",
    createdOn: "2026-10-30T00:00:00.000Z",
    savedOn: "2026-10-30T00:00:00.000Z"
};

const identities = {
    anonymous: [] as PermissionLike[],
    reader: [{ name: "remoteComponents.component", rwd: "r" }],
    writer: [{ name: "remoteComponents.component", rwd: "rw" }],
    deleter: [{ name: "remoteComponents.component", rwd: "rwd" }],
    aiUser: [{ name: "remoteComponents.component", rwd: "rw", ai: true }],
    // What Website Builder's "Frontend Integration" key carries.
    frontendKey: [{ name: "remoteComponents.*", rwd: "r" }],
    otherApp: [{ name: "wb.*", rwd: "rwd" }],
    schemaFullAccess: [{ name: "remoteComponents.*" }],
    fullAccess: [{ name: "*" }]
};

const createIdentityContext = (permissions: PermissionLike[]) => {
    return {
        getIdentity: () => ({ id: "identity-1", type: "admin", displayName: "Test" }),
        hasFullAccess: async () => permissions.some(permission => permission.name === "*"),
        getPermission: async (name: string) => {
            return permissions.find(permission => permission.name === name) ?? null;
        },
        getPermissions: async (name: string) => {
            return permissions.filter(permission => permission.name === name);
        }
    } as unknown as IdentityContext.Interface;
};

const setup = (permissions: PermissionLike[]) => {
    const calls = {
        get: [] as string[],
        list: 0,
        create: [] as unknown[],
        update: [] as { id: string; values: Record<string, any> }[],
        delete: [] as string[]
    };

    const container = new Container();
    container.registerInstance(IdentityContext, createIdentityContext(permissions));
    RemoteComponentPermissionsFeature.register(container);

    container.registerInstance(GetRemoteComponentRepository, {
        execute: async (id: string) => {
            calls.get.push(id);
            return Result.ok(component);
        }
    });
    container.registerInstance(ListRemoteComponentsRepository, {
        execute: async () => {
            calls.list++;
            return Result.ok({ items: [component], meta: { cursor: null, hasMoreItems: false } });
        }
    } as unknown as ListRemoteComponentsRepository.Interface);
    container.registerInstance(CreateRemoteComponentRepository, {
        execute: async (input: unknown) => {
            calls.create.push(input);
            return Result.ok(component);
        }
    } as unknown as CreateRemoteComponentRepository.Interface);
    container.registerInstance(UpdateRemoteComponentRepository, {
        execute: async (id: string, values: Record<string, any>) => {
            calls.update.push({ id, values });
            return Result.ok(component);
        }
    } as unknown as UpdateRemoteComponentRepository.Interface);
    container.registerInstance(DeleteRemoteComponentRepository, {
        execute: async (id: string) => {
            calls.delete.push(id);
            return Result.ok(true);
        }
    });
    container.registerInstance(Ai, {} as Ai.Interface);
    container.registerInstance(
        GetFileContentsByIdUseCase,
        {} as GetFileContentsByIdUseCase.Interface
    );

    container.register(GetRemoteComponentUseCaseImplementation);
    container.register(ListRemoteComponentsUseCaseImplementation);
    container.register(CreateRemoteComponentUseCaseImplementation);
    container.register(UpdateRemoteComponentUseCaseImplementation);
    container.register(DeleteRemoteComponentUseCaseImplementation);
    container.register(BundleRemoteComponentUseCaseImplementation);
    container.register(GenerateRemoteComponentUseCaseImplementation);
    container.register(RefineRemoteComponentUseCaseImplementation);

    const run = {
        get: () => container.resolve(GetRemoteComponentUseCase).execute("c1"),
        list: () => container.resolve(ListRemoteComponentsUseCase).execute(),
        create: () =>
            container
                .resolve(CreateRemoteComponentUseCase)
                .execute({ name: "Custom/Badge", label: "Badge", source: "x" }),
        update: () =>
            container.resolve(UpdateRemoteComponentUseCase).execute("c1", { bundledJs: "x" }),
        delete: () => container.resolve(DeleteRemoteComponentUseCase).execute("c1"),
        bundle: () => container.resolve(BundleRemoteComponentUseCase).execute("c1"),
        generate: () => container.resolve(GenerateRemoteComponentUseCase).execute({ prompt: "x" }),
        refine: () =>
            container
                .resolve(RefineRemoteComponentUseCase)
                .execute({ currentSource: "", currentCss: "", feedback: "x" })
    };

    return { run, calls };
};

type Operation = keyof ReturnType<typeof setup>["run"];

const errorCode = (result: Result<unknown, { code?: string }>) => {
    if (result.isOk()) {
        return null;
    }
    return result.error.code ?? "unknown";
};

const isRefused = async (permissions: PermissionLike[], operation: Operation) => {
    const { run } = setup(permissions);
    const result = await run[operation]();
    return errorCode(result as Result<unknown, { code?: string }>) === NOT_AUTHORIZED;
};

const ALL: Operation[] = [
    "get",
    "list",
    "create",
    "update",
    "delete",
    "bundle",
    "generate",
    "refine"
];

const allowedFor: Record<keyof typeof identities, Operation[]> = {
    anonymous: [],
    reader: ["get", "list"],
    writer: ["get", "list", "create", "update", "bundle"],
    deleter: ["get", "list", "create", "update", "delete", "bundle"],
    aiUser: ["get", "list", "create", "update", "bundle", "generate", "refine"],
    frontendKey: ["get", "list"],
    otherApp: [],
    schemaFullAccess: ALL,
    fullAccess: ALL
};

describe("remote component permissions", () => {
    for (const [name, permissions] of Object.entries(identities)) {
        const allowed = allowedFor[name as keyof typeof identities];

        for (const operation of ALL) {
            const expected = allowed.includes(operation) ? "allows" : "refuses";

            it(`${name} ${expected} ${operation}`, async () => {
                const refused = await isRefused(permissions, operation);
                expect(refused).toBe(!allowed.includes(operation));
            });
        }
    }

    it("doesn't reach storage when it refuses", async () => {
        const { run, calls } = setup(identities.anonymous);

        await run.get();
        await run.list();
        await run.create();
        await run.update();
        await run.delete();
        await run.bundle();

        expect(calls).toEqual({ get: [], list: 0, create: [], update: [], delete: [] });
    });
});

describe("remote component use cases with full access", () => {
    it("passes create input to the repository unchanged", async () => {
        const { run, calls } = setup(identities.fullAccess);

        const result = await run.create();

        expect(result.isOk()).toBe(true);
        expect(calls.create).toEqual([{ name: "Custom/Badge", label: "Badge", source: "x" }]);
    });

    it("writes the bundled fields on update", async () => {
        const { run, calls } = setup(identities.fullAccess);

        const result = await run.update();

        expect(result.isOk()).toBe(true);
        expect(calls.update).toEqual([{ id: "c1", values: { bundledJs: "x" } }]);
    });

    it("returns the repository's answers for get, list and delete", async () => {
        const { run, calls } = setup(identities.fullAccess);

        const get = await run.get();
        const list = await run.list();
        const deleted = await run.delete();

        expect(get.isOk() && get.value).toEqual(component);
        expect(list.isOk() && list.value.items).toEqual([component]);
        expect(deleted.isOk() && deleted.value).toBe(true);
        expect(calls).toMatchObject({ get: ["c1"], list: 1, delete: ["c1"] });
    });

    it("bundles past the check and reports the missing source", async () => {
        const { run } = setup(identities.fullAccess);

        const result = await run.bundle();

        expect(errorCode(result as Result<unknown, { code?: string }>)).toBe(
            "RemoteComponent/BundleError"
        );
    });
});
