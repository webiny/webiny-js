import { describe, expect, it } from "vitest";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import { SaveWorkflowSettingsUseCase } from "~/features/settings/SaveWorkflowSettings/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { GetWorkflowSettingsForEditorUseCase } from "~/features/config/GetWorkflowSettingsForEditor/index.js";
import { SaveWorkflowSettingsForEditorUseCase } from "~/features/config/SaveWorkflowSettingsForEditor/index.js";

const FUTURE = "2999-01-01T00:00:00.000Z";
const PAST = "2000-01-01T00:00:00.000Z";

/** `cms.*` is harmless: private models skip entry authorization, so only the workflows rule is tested. */
const EDITOR: SecurityPermission[] = [{ name: "workflows", editor: true }, { name: "cms.*" }];
const REASSIGNER: SecurityPermission[] = [{ name: "workflows", reassign: true }, { name: "cms.*" }];

interface EngineCalls {
    get: number;
    save: number;
}

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

const createSettingsContext = async (params: CmsTestHandlerParams = {}) => {
    const engineCalls: EngineCalls = { get: 0, save: 0 };

    class CountingGetSettings implements GetWorkflowSettingsUseCase.Interface {
        constructor(private decoratee: GetWorkflowSettingsUseCase.Interface) {}

        execute(input?: GetWorkflowSettingsUseCase.Input): GetWorkflowSettingsUseCase.Return {
            engineCalls.get++;
            return this.decoratee.execute(input);
        }
    }

    class CountingSaveSettings implements SaveWorkflowSettingsUseCase.Interface {
        constructor(private decoratee: SaveWorkflowSettingsUseCase.Interface) {}

        execute(input: SaveWorkflowSettingsUseCase.Input): SaveWorkflowSettingsUseCase.Return {
            engineCalls.save++;
            return this.decoratee.execute(input);
        }
    }

    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            container.registerDecorator(
                GetWorkflowSettingsUseCase.createDecorator({
                    decorator: CountingGetSettings,
                    dependencies: []
                })
            );
            container.registerDecorator(
                SaveWorkflowSettingsUseCase.createDecorator({
                    decorator: CountingSaveSettings,
                    dependencies: []
                })
            );
            await params.setup?.(container);
        }
    });
    const { container } = context;
    expectOk(
        await container.resolve(SaveWorkflowSettingsUseCase).execute({
            exclusions: [
                { userId: "user-a", reason: "On leave", endsOn: FUTURE },
                { userId: "user-b", endsOn: PAST }
            ]
        })
    );
    engineCalls.get = 0;
    engineCalls.save = 0;
    return {
        container,
        engineCalls,
        getForEditor: container.resolve(GetWorkflowSettingsForEditorUseCase),
        saveForEditor: container.resolve(SaveWorkflowSettingsForEditorUseCase)
    };
};

describe("Workflow settings for editors (D133, R97)", () => {
    it("reads the settings for an editor, with expired exclusions only when asked", async () => {
        const { getForEditor, engineCalls } = await createSettingsContext({ permissions: EDITOR });

        const active = expectOk(await getForEditor.execute());
        const all = expectOk(await getForEditor.execute({ includeExpired: true }));

        expect(active.exclusions.map(item => item.userId)).toEqual(["user-a"]);
        expect(all.exclusions.map(item => item.userId)).toEqual(["user-a", "user-b"]);
        expect(engineCalls.get).toBe(2);
    });

    it("allows a full-access permission set", async () => {
        const { getForEditor, saveForEditor } = await createSettingsContext({
            permissions: [{ name: "workflows.*" }, { name: "cms.*" }]
        });

        const read = await getForEditor.execute();
        const saved = await saveForEditor.execute({ exclusions: [] });

        expect(read.isOk()).toBe(true);
        expect(saved.isOk()).toBe(true);
    });

    it("saves the settings for an editor", async () => {
        const { container, saveForEditor } = await createSettingsContext({ permissions: EDITOR });

        const saved = expectOk(
            await saveForEditor.execute({ exclusions: [{ userId: "user-c", reason: "Leave" }] })
        );

        expect(saved).toEqual({ exclusions: [{ userId: "user-c", reason: "Leave" }] });
        const read = expectOk(
            await container.resolve(GetWorkflowSettingsUseCase).execute({ includeExpired: true })
        );
        expect(read).toEqual(saved);
    });

    it("returns the engine's validation error with its code and data", async () => {
        const { saveForEditor } = await createSettingsContext({ permissions: EDITOR });

        const result = await saveForEditor.execute({
            exclusions: [{ userId: "user-a" }, { userId: "user-a", endsOn: FUTURE }]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Settings/Validation");
        expect(result.error.data).toEqual({ userId: "user-a" });
    });

    it("refuses a user without editor and does not call the engine", async () => {
        const { getForEditor, saveForEditor, engineCalls } = await createSettingsContext({
            permissions: REASSIGNER
        });

        const read = await getForEditor.execute();
        const saved = await saveForEditor.execute({ exclusions: [] });

        expect(read.error.code).toBe("Workflows/NotAuthorized");
        expect(read.error.data).toEqual({ action: "view the workflow settings" });
        expect(saved.error.code).toBe("Workflows/NotAuthorized");
        expect(saved.error.data).toEqual({ action: "change the workflow settings" });
        expect(engineCalls).toEqual({ get: 0, save: 0 });
    });

    it("refuses an anonymous identity and does not call the engine", async () => {
        const { container, getForEditor, saveForEditor, engineCalls } =
            await createSettingsContext();
        const identityContext = container.resolve(IdentityContext);

        const read = await identityContext.withIdentity(new AnonymousIdentity(), () =>
            getForEditor.execute()
        );
        const saved = await identityContext.withIdentity(new AnonymousIdentity(), () =>
            saveForEditor.execute({ exclusions: [] })
        );

        expect(read.error.code).toBe("Workflows/NotAuthenticated");
        expect(saved.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual({ get: 0, save: 0 });
    });

    it("returns the lookup error when the permission check throws (R87)", async () => {
        const { getForEditor, saveForEditor, engineCalls } = await createSettingsContext({
            setup: container => {
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const read = await getForEditor.execute();
        const saved = await saveForEditor.execute({ exclusions: [] });

        expect(read.error.code).toBe("Workflows/Workflow/Lookup");
        expect(hasErrorSource(read.error) && read.error.source.message).toBe(
            "Permissions are down."
        );
        expect(saved.error.code).toBe("Workflows/Workflow/Lookup");
        expect(engineCalls).toEqual({ get: 0, save: 0 });
    });
});
