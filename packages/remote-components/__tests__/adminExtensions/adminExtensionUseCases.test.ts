import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import type { Container } from "@webiny/di";
import { useHandler } from "~tests/helpers/useHandler.js";
import { CreateAdminExtensionUseCase } from "~/api/adminExtensions/features/CreateAdminExtension/abstractions.js";
import { ListAdminExtensionsUseCase } from "~/api/adminExtensions/features/ListAdminExtensions/abstractions.js";
import { SetAdminExtensionEnabledUseCase } from "~/api/adminExtensions/features/SetAdminExtensionEnabled/abstractions.js";
import { DeleteAdminExtensionUseCase } from "~/api/adminExtensions/features/DeleteAdminExtension/abstractions.js";
import { ADMIN_EXTENSION_RUNTIME_VERSION } from "~/shared/adminExtensions/constants.js";
import { CHAR_COUNT_INPUT } from "~tests/helpers/fieldRendererFixtures.js";

const MENU_INPUT: CreateAdminExtensionUseCase.Input = {
    kind: "menu",
    name: "release-notes",
    label: "Release notes",
    source: JSON.stringify({
        label: "Release notes",
        to: "/release-notes",
        parent: "settings",
        pinnable: true
    })
};

const create = async (container: Container, input: Partial<CreateAdminExtensionUseCase.Input>) => {
    const useCase = container.resolve(CreateAdminExtensionUseCase);
    return useCase.execute({ ...MENU_INPUT, ...input });
};

const list = async (container: Container, input?: ListAdminExtensionsUseCase.Input) => {
    const useCase = container.resolve(ListAdminExtensionsUseCase);
    const result = await useCase.execute(input);
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

describe("admin extension use cases", () => {
    const handler = useHandler();

    it("creates an enabled extension stamped with the current runtime version", async () => {
        const container = await handler.container();

        const result = await create(container, {});

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            id: expect.any(String),
            kind: "menu",
            name: "release-notes",
            label: "Release notes",
            description: "",
            enabled: true,
            runtimeVersion: ADMIN_EXTENSION_RUNTIME_VERSION,
            source: MENU_INPUT.source
        });
    });

    it("refuses a second extension with the same kind and name", async () => {
        const container = await handler.container();
        await create(container, {});

        const result = await create(container, { label: "Another" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("AdminExtension/AlreadyExists");
    });

    it("allows the same name under a different kind", async () => {
        const container = await handler.container();
        await create(container, {});

        const result = await create(container, { ...CHAR_COUNT_INPUT, name: MENU_INPUT.name });

        expect(result.isOk()).toBe(true);
    });

    it.each([
        ["an unknown kind", { kind: "widget" }],
        ["a name with uppercase letters", { name: "ReleaseNotes" }],
        ["a name starting with a digit", { name: "1-notes" }],
        ["an empty label", { label: "  " }],
        ["empty source", { source: "" }]
    ])("rejects %s", async (_, input) => {
        const container = await handler.container();

        const result = await create(container, input as Partial<CreateAdminExtensionUseCase.Input>);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("AdminExtension/Validation");
    });

    it("lists extensions newest first, filtered by kind and by enabled", async () => {
        const container = await handler.container();
        await create(container, { name: "first" });
        await create(container, { name: "second" });
        const renderer = await create(container, CHAR_COUNT_INPUT);

        const all = await list(container);
        expect(all.map(item => item.name)).toEqual(["char-count", "second", "first"]);

        const menus = await list(container, { kind: "menu" });
        expect(menus.map(item => item.name)).toEqual(["second", "first"]);

        const setEnabled = container.resolve(SetAdminExtensionEnabledUseCase);
        await setEnabled.execute({ id: renderer.value.id, enabled: false });

        const enabled = await list(container, { enabled: true });
        expect(enabled.map(item => item.name)).toEqual(["second", "first"]);

        const disabled = await list(container, { enabled: false });
        expect(disabled.map(item => item.name)).toEqual(["char-count"]);
    });

    it("disables and re-enables an extension, keeping everything else", async () => {
        const container = await handler.container();
        const created = await create(container, {});
        const setEnabled = container.resolve(SetAdminExtensionEnabledUseCase);

        const disabled = await setEnabled.execute({ id: created.value.id, enabled: false });
        expect(disabled.isOk()).toBe(true);
        expect(disabled.value).toMatchObject({
            id: created.value.id,
            enabled: false,
            source: MENU_INPUT.source,
            runtimeVersion: ADMIN_EXTENSION_RUNTIME_VERSION
        });

        const enabled = await setEnabled.execute({ id: created.value.id, enabled: true });
        expect(enabled.value.enabled).toBe(true);

        const [stored] = await list(container);
        expect(stored.enabled).toBe(true);
    });

    it("deletes an extension", async () => {
        const container = await handler.container();
        const created = await create(container, {});
        const deleteUseCase = container.resolve(DeleteAdminExtensionUseCase);

        const result = await deleteUseCase.execute(created.value.id);

        expect(result.isOk()).toBe(true);
        expect(await list(container)).toEqual([]);
    });

    it("frees the name of a deleted extension", async () => {
        const container = await handler.container();
        const created = await create(container, {});
        await container.resolve(DeleteAdminExtensionUseCase).execute(created.value.id);

        const result = await create(container, {});

        expect(result.isOk()).toBe(true);
    });

    it("reports an unknown id as not found", async () => {
        const container = await handler.container();

        const disabled = await container
            .resolve(SetAdminExtensionEnabledUseCase)
            .execute({ id: "missing", enabled: false });
        const deleted = await container.resolve(DeleteAdminExtensionUseCase).execute("missing");

        expect(disabled.error.code).toBe("AdminExtension/NotFound");
        expect(deleted.error.code).toBe("AdminExtension/NotFound");
    });
});

describe("admin extension permissions", () => {
    it("refuses every operation to an identity without the permission", async () => {
        const handler = useHandler({ permissions: [{ name: "cms.*" }] });
        const container = await handler.container();

        const created = await create(container, {});
        const listed = await container.resolve(ListAdminExtensionsUseCase).execute();
        const disabled = await container
            .resolve(SetAdminExtensionEnabledUseCase)
            .execute({ id: "any", enabled: false });
        const deleted = await container.resolve(DeleteAdminExtensionUseCase).execute("any");

        for (const result of [created, listed, disabled, deleted]) {
            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("AdminExtension/NotAuthorized");
        }
    });

    it("lets a read-only identity list but not change anything", async () => {
        const handler = useHandler({
            permissions: [{ name: "adminExtensions.adminExtension", rwd: "r" }]
        });
        const container = await handler.container();

        const listed = await container.resolve(ListAdminExtensionsUseCase).execute();
        const created = await create(container, {});
        const disabled = await container
            .resolve(SetAdminExtensionEnabledUseCase)
            .execute({ id: "any", enabled: false });
        const deleted = await container.resolve(DeleteAdminExtensionUseCase).execute("any");

        expect(listed.isOk()).toBe(true);
        for (const result of [created, disabled, deleted]) {
            expect(result.error.code).toBe("AdminExtension/NotAuthorized");
        }
    });
});
