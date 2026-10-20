import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createFakeEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import type { FakeWorkflowEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import { WorkflowEditorToasts } from "~/editor/toasts/abstractions.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { ExclusionUserName } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { RemoveExclusionDialogPresenter } from "~/settings/presentation/removeDialog/abstractions.js";
import { RemoveExclusionDialogPresenterFeature } from "~/settings/presentation/removeDialog/feature.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createCidExclusion } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createFakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";
import type { FakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";
import { UpdateWorkflowSettingsUseCase } from "~/settings/useCases/updateWorkflowSettings/abstractions.js";

const TRANSPORT_ALERT = "The server did not respond, so nothing was changed. Try again.";

const BEN_NAME: ExclusionUserName = { userId: "user-ben", label: "Ben Babić", state: "found" };

interface FakeUpdateWorkflowSettingsUseCase {
    execute: Mock<UpdateWorkflowSettingsUseCase.Interface["execute"]>;
}

interface RemoveSetup {
    presenter: RemoveExclusionDialogPresenter.Interface;
    updateWorkflowSettings: FakeUpdateWorkflowSettingsUseCase;
    toasts: FakeWorkflowEditorToasts;
}

// The server returns the saved record (A108); the fake answers the list it was sent.
const echoSettings = (settings: WorkflowSettings): Promise<WorkflowSettings> => {
    return Promise.resolve(settings);
};

/*
 * A Remove dialog presenter over one fake per injected use case (R355). The container holds
 * exactly the presenter's R352 dependencies, so resolving it proves it needs nothing else.
 */
const createRemoveSetup = (): RemoveSetup => {
    const updateWorkflowSettings: FakeUpdateWorkflowSettingsUseCase = {
        execute: vi.fn(echoSettings)
    };
    const toasts = createFakeEditorToasts();
    const container = new Container();
    container.registerInstance(UpdateWorkflowSettingsUseCase, updateWorkflowSettings);
    container.registerInstance(WorkflowEditorToasts, toasts);
    RemoveExclusionDialogPresenterFeature.register(container);
    const presenter = container.resolve(RemoveExclusionDialogPresenter);
    return { presenter, updateWorkflowSettings, toasts };
};

const openRemove = (
    setup: RemoveSetup,
    userId: string,
    names: ExclusionUserName[] = [BEN_NAME]
): FakeExclusionsSource => {
    const source = createFakeExclusionsSource({
        exclusions: [createAnaExclusion(), createBenExclusion(), createCidExclusion()],
        timeZone: ZAGREB,
        names
    });
    setup.presenter.init({ source, userId });
    return source;
};

describe("RemoveExclusionDialogPresenter (R318, R326, R327)", () => {
    let setup: RemoveSetup;

    beforeEach(() => {
        setup = createRemoveSetup();
    });

    it("resolves over UpdateWorkflowSettingsUseCase and the toasts only (R352)", () => {
        expect(setup.presenter).toBeDefined();
        expect(setup.updateWorkflowSettings.execute).not.toHaveBeenCalled();
    });

    it("asks to remove the named user", () => {
        openRemove(setup, "user-ben");

        expect(setup.presenter.vm).toEqual({
            title: "Remove exclusion?",
            body: "Ben Babić can be assigned automatically again. Nothing changes for work they already hold.",
            alert: null,
            removing: false
        });
    });

    it("names an unresolved user by the raw id", () => {
        openRemove(setup, "user-cid", []);

        expect(setup.presenter.vm.body).toBe(
            "user-cid can be assigned automatically again. Nothing changes for work they already hold."
        );
    });

    it("explains that removing a deleted user's entry changes nothing else (QBZ-91)", () => {
        openRemove(setup, "user-ben", [
            { userId: "user-ben", label: "Deleted user", state: "deleted" }
        ]);

        expect(setup.presenter.vm.body).toBe(
            "This user no longer exists, so removing the entry changes nothing else."
        );
    });

    it("sends the list without the entry and every other entry unchanged, in order (R318)", async () => {
        openRemove(setup, "user-ben");

        await setup.presenter.confirm();

        expect(setup.updateWorkflowSettings.execute).toHaveBeenCalledTimes(1);
        expect(setup.updateWorkflowSettings.execute).toHaveBeenCalledWith({
            exclusions: [createAnaExclusion(), createCidExclusion()]
        });
    });

    it("removes a deleted user's entry (Q64)", async () => {
        openRemove(setup, "user-ben", [
            { userId: "user-ben", label: "Deleted user", state: "deleted" }
        ]);

        await setup.presenter.confirm();

        expect(setup.updateWorkflowSettings.execute).toHaveBeenCalledWith({
            exclusions: [createAnaExclusion(), createCidExclusion()]
        });
    });

    it("hands the saved record to the page, toasts Exclusion removed and closes (R327)", async () => {
        const source = openRemove(setup, "user-ben");
        const saved = { exclusions: [createAnaExclusion(), createCidExclusion()] };
        setup.updateWorkflowSettings.execute.mockResolvedValueOnce(saved);

        await setup.presenter.confirm();

        expect(source.applySaved).toHaveBeenCalledWith({
            settings: saved,
            change: "remove",
            user: null
        });
        expect(source.closeDialog).toHaveBeenCalledTimes(1);
        expect(setup.toasts.success).toHaveBeenCalledWith("Exclusion removed");
        expect(setup.presenter.vm.removing).toBe(false);
    });

    it("closes on Cancel", () => {
        const source = openRemove(setup, "user-ben");

        setup.presenter.cancel();

        expect(source.closeDialog).toHaveBeenCalledTimes(1);
        expect(setup.updateWorkflowSettings.execute).not.toHaveBeenCalled();
    });
});

describe("RemoveExclusionDialogPresenter: failures (R325, QBZ-74, Review Focus 7)", () => {
    let setup: RemoveSetup;

    beforeEach(() => {
        setup = createRemoveSetup();
    });

    it("shows the transport alert and keeps the row", async () => {
        const source = openRemove(setup, "user-ben");
        setup.updateWorkflowSettings.execute.mockRejectedValueOnce(new Error("Network down."));

        await setup.presenter.confirm();

        expect(setup.presenter.vm.alert).toBe(TRANSPORT_ALERT);
        expect(setup.presenter.vm.removing).toBe(false);
        expect(source.applySaved).not.toHaveBeenCalled();
        expect(source.closeDialog).not.toHaveBeenCalled();
        expect(setup.toasts.success).not.toHaveBeenCalled();
        expect(setup.toasts.error).not.toHaveBeenCalled();
    });

    it("shows the server's message for a server error (Q68.2)", async () => {
        openRemove(setup, "user-ben");
        const error = new GraphQLOperationError({
            message: "Could not save the workflow settings.",
            code: SettingsErrorCode.Persistence
        });
        setup.updateWorkflowSettings.execute.mockRejectedValueOnce(error);

        await setup.presenter.confirm();

        expect(setup.presenter.vm.alert).toBe(
            "Could not save: Could not save the workflow settings."
        );
    });

    it("clears the alert with the next confirm", async () => {
        openRemove(setup, "user-ben");
        setup.updateWorkflowSettings.execute.mockRejectedValueOnce(new Error("Network down."));
        await setup.presenter.confirm();

        const pending = createDeferred<WorkflowSettings>();
        setup.updateWorkflowSettings.execute.mockReturnValueOnce(pending.promise);
        const confirm = setup.presenter.confirm();

        expect(setup.presenter.vm.alert).toBeNull();
        expect(setup.presenter.vm.removing).toBe(true);
        pending.resolve({ exclusions: [createAnaExclusion(), createCidExclusion()] });
        await confirm;
    });

    it("ignores a second confirm while removing", async () => {
        openRemove(setup, "user-ben");
        const pending = createDeferred<WorkflowSettings>();
        setup.updateWorkflowSettings.execute.mockReturnValueOnce(pending.promise);

        const first = setup.presenter.confirm();
        const second = setup.presenter.confirm();

        expect(setup.updateWorkflowSettings.execute).toHaveBeenCalledTimes(1);
        pending.resolve({ exclusions: [createAnaExclusion(), createCidExclusion()] });
        await Promise.all([first, second]);
        expect(setup.toasts.success).toHaveBeenCalledTimes(1);
    });

    it("ignores Cancel, Close and Escape while removing", async () => {
        const source = openRemove(setup, "user-ben");
        const pending = createDeferred<WorkflowSettings>();
        setup.updateWorkflowSettings.execute.mockReturnValueOnce(pending.promise);
        const confirm = setup.presenter.confirm();

        setup.presenter.cancel();

        expect(source.closeDialog).not.toHaveBeenCalled();
        pending.reject(new Error("Network down."));
        await confirm;

        setup.presenter.cancel();
        expect(source.closeDialog).toHaveBeenCalledTimes(1);
    });

    it("touches nothing when a remove settles after dispose", async () => {
        const source = openRemove(setup, "user-ben");
        const pending = createDeferred<WorkflowSettings>();
        setup.updateWorkflowSettings.execute.mockReturnValueOnce(pending.promise);
        const confirm = setup.presenter.confirm();

        setup.presenter.dispose();
        pending.resolve({ exclusions: [createAnaExclusion(), createCidExclusion()] });
        await confirm;

        expect(source.applySaved).not.toHaveBeenCalled();
        expect(source.closeDialog).not.toHaveBeenCalled();
        expect(setup.toasts.success).not.toHaveBeenCalled();
        expect(setup.presenter.vm.removing).toBe(false);
    });
});
