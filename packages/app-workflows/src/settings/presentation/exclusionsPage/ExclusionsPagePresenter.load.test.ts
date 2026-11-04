import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { EXCLUSIONS_NOW } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createExclusionsPageSetup } from "~/settings/testing/exclusionsPageSetup.js";

const MANAGE = { canManage: true, timeZone: ZAGREB };

describe("ExclusionsPagePresenter: load and gate (R317, R322, R329)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("loads nothing and shows no access without the editor permission", async () => {
        const { presenter, getWorkflowSettings, listWorkflowUsers } = createExclusionsPageSetup([
            createAnaExclusion()
        ]);

        await presenter.init({ canManage: false, timeZone: ZAGREB });

        expect(getWorkflowSettings.execute).not.toHaveBeenCalled();
        expect(listWorkflowUsers.execute).not.toHaveBeenCalled();
        expect(presenter.vm.status).toBe("noAccess");
        expect(presenter.vm.canAdd).toBe(false);
        expect(presenter.vm.rows).toEqual([]);
        expect(presenter.vm.empty).toBeNull();
    });

    it("does not load on reload without the editor permission", async () => {
        const { presenter, getWorkflowSettings } = createExclusionsPageSetup();
        await presenter.init({ canManage: false, timeZone: ZAGREB });

        await presenter.reload();

        expect(getWorkflowSettings.execute).not.toHaveBeenCalled();
        expect(presenter.vm.status).toBe("noAccess");
    });

    it("is loading until the settings arrive, then ready", async () => {
        const { presenter, getWorkflowSettings } = createExclusionsPageSetup();
        const pending = createDeferred<WorkflowSettings>();
        getWorkflowSettings.execute.mockReturnValueOnce(pending.promise);

        const init = presenter.init(MANAGE);

        expect(presenter.vm.status).toBe("loading");
        expect(presenter.vm.canAdd).toBe(false);
        expect(presenter.vm.rows).toEqual([]);
        expect(presenter.vm.empty).toBeNull();

        pending.resolve({ exclusions: [createAnaExclusion()] });
        await init;

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.canAdd).toBe(true);
        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-ana"]);
    });

    it("asks the use case once, which always includes expired entries (Task 3)", async () => {
        const { presenter, getWorkflowSettings } = createExclusionsPageSetup();

        await presenter.init(MANAGE);

        expect(getWorkflowSettings.execute).toHaveBeenCalledTimes(1);
        expect(getWorkflowSettings.execute).toHaveBeenCalledWith();
    });

    it("shows the load error for a transport failure and loads again on reload", async () => {
        const { presenter, getWorkflowSettings } = createExclusionsPageSetup([
            createAnaExclusion()
        ]);
        getWorkflowSettings.execute.mockRejectedValueOnce(new Error("Network down."));

        await presenter.init(MANAGE);

        expect(presenter.vm.status).toBe("failed");
        expect(presenter.vm.canAdd).toBe(false);
        expect(presenter.vm.rows).toEqual([]);
        expect(presenter.vm.empty).toBeNull();

        await presenter.reload();

        expect(getWorkflowSettings.execute).toHaveBeenCalledTimes(2);
        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-ana"]);
    });

    it("shows the same load error for a server error (Copy gap 3)", async () => {
        const { presenter, getWorkflowSettings } = createExclusionsPageSetup();
        const error = new GraphQLOperationError({
            message: "Could not read the settings.",
            code: "Workflows/Settings/Persistence"
        });
        getWorkflowSettings.execute.mockRejectedValueOnce(error);

        await presenter.init(MANAGE);

        expect(presenter.vm.status).toBe("failed");
    });

    it("shows no access when the server answers NotAuthorized (Q68.4)", async () => {
        const { presenter, getWorkflowSettings } = createExclusionsPageSetup();
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: SettingsErrorCode.NotAuthorized
        });
        getWorkflowSettings.execute.mockRejectedValueOnce(error);

        await presenter.init(MANAGE);

        expect(presenter.vm.status).toBe("noAccess");
        expect(presenter.vm.canAdd).toBe(false);
    });

    it("drops the answer of an older load after a reload", async () => {
        const { presenter, getWorkflowSettings } = createExclusionsPageSetup();
        const first = createDeferred<WorkflowSettings>();
        getWorkflowSettings.execute.mockReturnValueOnce(first.promise);
        getWorkflowSettings.execute.mockResolvedValueOnce({ exclusions: [createBenExclusion()] });

        const init = presenter.init(MANAGE);
        await presenter.reload();
        first.resolve({ exclusions: [createAnaExclusion()] });
        await init;

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-ben"]);
    });

    it("resets on dispose and ignores a load that settles afterwards", async () => {
        const { presenter, getWorkflowSettings } = createExclusionsPageSetup();
        const pending = createDeferred<WorkflowSettings>();
        getWorkflowSettings.execute.mockReturnValueOnce(pending.promise);

        const init = presenter.init(MANAGE);
        presenter.dispose();
        pending.resolve({ exclusions: [createAnaExclusion()] });
        await init;

        expect(presenter.vm.status).toBe("loading");
        expect(presenter.vm.canAdd).toBe(false);
        expect(presenter.vm.rows).toEqual([]);
        expect(presenter.getExclusions()).toEqual([]);
        expect(presenter.getTimeZone()).toBe("UTC");
    });
});
