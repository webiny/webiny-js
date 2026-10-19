import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import type { ListUsersParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createCidExclusion } from "~/settings/testing/exclusionFixtures.js";
import { EXCLUSIONS_NOW } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createExclusionsPageSetup } from "~/settings/testing/exclusionsPageSetup.js";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";

const MANAGE = { canManage: true, timeZone: ZAGREB };

const NAMES: Record<string, string> = {
    "user-ana": "Ana Kovač",
    "user-ben": "Aaron Babić",
    "user-cid": "Cid Horvat"
};

// Answers an ids lookup: a known id with its name, `user-gone` as missing, anything else as `Name {id}`.
const answerLookup = async (params: ListUsersParams): Promise<WorkflowUserList> => {
    const ids = params.ids ?? [];
    const found = ids.filter(id => id !== "user-gone");
    const users = found.map(id => {
        const displayName = NAMES[id] ?? `Name ${id}`;
        return createWorkflowUserSummary({ id, displayName, teamIds: [] });
    });
    const missingIds = ids.filter(id => id === "user-gone");
    return { users, missingIds };
};

const createMany = (count: number): WorkflowExclusion[] => {
    const list: WorkflowExclusion[] = [];
    for (let index = 0; index < count; index += 1) {
        const userId = `user-${String(index).padStart(3, "0")}`;
        list.push(createExclusion({ userId, reason: null, endsOn: null }));
    }
    return list;
};

const notAuthorized = (): GraphQLOperationError => {
    return new GraphQLOperationError({
        message: "Not authorized.",
        code: SettingsErrorCode.NotAuthorized
    });
};

describe("ExclusionsPagePresenter: user names (R321, Review Focus 4)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("looks the names up by id after the load and sorts the rows by them", async () => {
        const { presenter, config } = createExclusionsPageSetup([
            createAnaExclusion(),
            createBenExclusion()
        ]);
        config.listUsers.mockImplementation(answerLookup);

        await presenter.init(MANAGE);

        expect(config.listUsers).toHaveBeenCalledTimes(1);
        expect(config.listUsers).toHaveBeenCalledWith({
            search: null,
            ids: ["user-ana", "user-ben"],
            teamIds: null,
            limit: null
        });
        // Sorted by name, not by id (Q66).
        expect(presenter.vm.rows.map(row => row.label)).toEqual(["Aaron Babić", "Ana Kovač"]);
        expect(presenter.vm.rows[0].editLabel).toBe("Edit exclusion for Aaron Babić");
        expect(presenter.vm.namesFailed).toBe(false);
    });

    it("asks in chunks of at most 200 ids and merges the answers", async () => {
        const { presenter, config } = createExclusionsPageSetup(createMany(450));
        config.listUsers.mockImplementation(answerLookup);

        await presenter.init(MANAGE);

        expect(config.listUsers).toHaveBeenCalledTimes(3);
        const sizes = config.listUsers.mock.calls.map(call => call[0].ids?.length);
        expect(sizes).toEqual([200, 200, 50]);
        expect(presenter.vm.rows).toHaveLength(450);
        expect(presenter.vm.rows[0].label).toBe("Name user-000");
        expect(presenter.vm.rows[449].label).toBe("Name user-449");
    });

    it("shows a missing id as Deleted user with the sub line, and its raw id in the filter", async () => {
        const gone = createExclusion({ userId: "user-gone", reason: null, endsOn: null });
        const { presenter, config } = createExclusionsPageSetup([gone]);
        config.listUsers.mockImplementation(answerLookup);

        await presenter.init(MANAGE);

        const [row] = presenter.vm.rows;
        expect(row.label).toBe("Deleted user");
        expect(row.muted).toBe(true);
        expect(row.subLine).toBe("This user no longer exists");
        const [option] = presenter.vm.filter.options;
        expect(option.label).toBe("Deleted user");
        expect(option.description).toBe("user-gone");
        expect(option.icon).toBe("person_off");
        expect(option.muted).toBe(true);
        expect(presenter.getUserName("user-gone").state).toBe("deleted");
    });

    it("shows the banner and the raw ids when the lookup fails", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        config.listUsers.mockRejectedValueOnce(new Error("Network down."));

        await presenter.init(MANAGE);

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.namesFailed).toBe(true);
        expect(presenter.vm.rows.map(row => row.label)).toEqual(["user-ana"]);
    });

    it("retries only the ids that are still unresolved", async () => {
        const { presenter, config } = createExclusionsPageSetup(createMany(250));
        config.listUsers.mockImplementationOnce(answerLookup);
        config.listUsers.mockRejectedValueOnce(new Error("Network down."));

        await presenter.init(MANAGE);

        expect(presenter.vm.namesFailed).toBe(true);
        config.listUsers.mockImplementation(answerLookup);

        await presenter.retryNames();

        expect(config.listUsers).toHaveBeenCalledTimes(3);
        const retried = config.listUsers.mock.calls[2][0].ids ?? [];
        expect(retried).toHaveLength(50);
        expect(retried[0]).toBe("user-200");
        expect(presenter.vm.namesFailed).toBe(false);
        expect(presenter.vm.rows[249].label).toBe("Name user-249");
    });

    it("does not retry before a list is loaded", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);

        await presenter.retryNames();

        expect(config.listUsers).not.toHaveBeenCalled();
    });

    it("switches to no access when the lookup answers NotAuthorized (Q68.4)", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        config.listUsers.mockRejectedValueOnce(notAuthorized());

        await presenter.init(MANAGE);

        expect(presenter.vm.status).toBe("noAccess");
        expect(presenter.vm.canAdd).toBe(false);
        expect(presenter.vm.rows).toEqual([]);
    });

    it("drops the answer of a lookup that a reload superseded", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        const first = createDeferred<WorkflowUserList>();
        config.listUsers.mockReturnValueOnce(first.promise);
        config.listUsers.mockImplementation(answerLookup);

        const init = presenter.init(MANAGE);
        await vi.waitFor(() => expect(config.listUsers).toHaveBeenCalledTimes(1));
        await presenter.reload();
        const stale = createWorkflowUserSummary({ id: "user-ana", displayName: "Stale Name" });
        first.resolve({ users: [stale], missingIds: [] });
        await init;

        expect(config.listUsers).toHaveBeenCalledTimes(2);
        expect(presenter.vm.rows.map(row => row.label)).toEqual(["Ana Kovač"]);
    });

    it("drops the answer of a lookup that a newer save superseded", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        const first = createDeferred<WorkflowUserList>();
        config.listUsers.mockReturnValueOnce(first.promise);
        config.listUsers.mockImplementation(answerLookup);

        const init = presenter.init(MANAGE);
        await vi.waitFor(() => expect(config.listUsers).toHaveBeenCalledTimes(1));
        presenter.applySaved({
            settings: { exclusions: [createAnaExclusion(), createCidExclusion()] },
            change: "edit",
            user: null
        });
        await vi.waitFor(() => expect(presenter.getUserName("user-cid").label).toBe("Cid Horvat"));
        const stale = createWorkflowUserSummary({ id: "user-ana", displayName: "Stale Name" });
        first.resolve({ users: [stale], missingIds: [] });
        await init;

        expect(presenter.getUserName("user-ana").label).toBe("Ana Kovač");
    });

    it("never looks up the user picked in the Add dialog", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        config.listUsers.mockImplementation(answerLookup);
        await presenter.init(MANAGE);
        const dan = createWorkflowUserSummary({ id: "user-dan", displayName: "Dan Novak" });

        presenter.applySaved({
            settings: {
                exclusions: [
                    createAnaExclusion(),
                    createExclusion({ userId: "user-dan", reason: null, endsOn: null })
                ]
            },
            change: "add",
            user: dan
        });
        await Promise.resolve();

        expect(config.listUsers).toHaveBeenCalledTimes(1);
        expect(presenter.vm.rows.map(row => row.label)).toEqual(["Ana Kovač", "Dan Novak"]);
    });

    it("looks up only the new ids a saved record brings", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        config.listUsers.mockImplementation(answerLookup);
        await presenter.init(MANAGE);

        presenter.applySaved({
            settings: { exclusions: [createAnaExclusion(), createCidExclusion()] },
            change: "edit",
            user: null
        });

        await vi.waitFor(() => expect(config.listUsers).toHaveBeenCalledTimes(2));
        expect(config.listUsers.mock.calls[1][0].ids).toEqual(["user-cid"]);
    });

    it("does not refresh known names on a reload", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        config.listUsers.mockImplementation(answerLookup);
        await presenter.init(MANAGE);

        await presenter.reload();

        expect(config.listUsers).toHaveBeenCalledTimes(1);
        expect(presenter.vm.namesFailed).toBe(false);
    });

    it("drops a pending lookup on dispose", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        const pending = createDeferred<WorkflowUserList>();
        config.listUsers.mockReturnValueOnce(pending.promise);

        const init = presenter.init(MANAGE);
        await vi.waitFor(() => expect(config.listUsers).toHaveBeenCalledTimes(1));
        presenter.dispose();
        const ana = createWorkflowUserSummary({ id: "user-ana", displayName: "Ana Kovač" });
        pending.resolve({ users: [ana], missingIds: [] });
        await init;

        expect(presenter.getUserName("user-ana").state).toBe("unknown");
    });
});
