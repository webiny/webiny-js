import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { buildExclusionRowVm } from "~/settings/presentation/exclusionsPage/buildExclusionRowVm.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createCidExclusion } from "~/settings/testing/exclusionFixtures.js";
import { EXCLUSIONS_NOW } from "~/settings/testing/exclusionFixtures.js";
import { NEW_YORK } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createExclusionsPageSetup } from "~/settings/testing/exclusionsPageSetup.js";
import type { ExclusionsPageSetup } from "~/settings/testing/exclusionsPageSetup.js";

const EVERYONE = "Everyone in reviewing teams can be assigned automatically.";

const createReadyPage = async (
    exclusions: WorkflowExclusion[],
    timeZone = ZAGREB
): Promise<ExclusionsPageSetup> => {
    const setup = createExclusionsPageSetup(exclusions);
    await setup.presenter.init({ canManage: true, timeZone });
    return setup;
};

const NAMES: Record<string, string> = {
    "user-ana": "Ana Kovač",
    "user-ben": "Ben Babić"
};

// Answers an ids lookup the server's way: a named id is found, every other id is missing.
const answerLookup = async (params: ListWorkflowUsersUseCase.Params): Promise<WorkflowUserList> => {
    const ids = params.ids ?? [];
    const found = ids.filter(id => NAMES[id] !== undefined);
    const users = found.map(id => {
        return createWorkflowUserSummary({ id, displayName: NAMES[id], teamIds: [] });
    });
    const missingIds = ids.filter(id => NAMES[id] === undefined);
    return { users, missingIds };
};

// A loaded page whose name lookup finds Ana and Ben and reports every other user as deleted.
const createNamedPage = async (exclusions: WorkflowExclusion[]): Promise<ExclusionsPageSetup> => {
    const setup = createExclusionsPageSetup(exclusions);
    setup.listWorkflowUsers.execute.mockImplementation(answerLookup);
    await setup.presenter.init({ canManage: true, timeZone: ZAGREB });
    return setup;
};

const createThree = (): WorkflowExclusion[] => {
    return [createCidExclusion(), createAnaExclusion(), createBenExclusion()];
};

describe("ExclusionsPagePresenter: rows (R322, R323)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("offers the Active, Expired and All tabs and starts on Active", async () => {
        const { presenter } = await createReadyPage(createThree());

        expect(presenter.vm.tab).toBe("active");
        expect(presenter.vm.tabs).toEqual([
            { id: "active", label: "Active" },
            { id: "expired", label: "Expired" },
            { id: "all", label: "All" }
        ]);
    });

    it("shows the active entries on Active, sorted by label", async () => {
        const { presenter } = await createReadyPage(createThree());

        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-ana", "user-ben"]);
    });

    it("shows the expired entries on Expired and every entry on All", async () => {
        const { presenter } = await createReadyPage(createThree());

        presenter.setTab("expired");
        expect(presenter.vm.tab).toBe("expired");
        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-cid"]);

        presenter.setTab("all");
        expect(presenter.vm.rows.map(row => row.userId)).toEqual([
            "user-ana",
            "user-ben",
            "user-cid"
        ]);
    });

    it("builds render-ready rows: name, reason, until and status", async () => {
        const { presenter } = await createNamedPage(createThree());
        presenter.setTab("all");

        const [ana, ben, cid] = presenter.vm.rows;

        expect(ana).toEqual({
            userId: "user-ana",
            label: "Ana Kovač",
            muted: false,
            subLine: null,
            reason: "On leave",
            reasonMuted: false,
            untilLabel: "End of 20 Oct 2026",
            untilTitle: "Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)",
            status: "active",
            statusLabel: "Active",
            editLabel: "Edit exclusion for Ana Kovač",
            removeLabel: "Remove exclusion for Ana Kovač"
        });
        expect(ben.reason).toBe("No reason given");
        expect(ben.reasonMuted).toBe(true);
        expect(ben.untilLabel).toBe("Until removed");
        expect(ben.untilTitle).toBe("Until removed");
        expect(cid.status).toBe("expired");
        expect(cid.statusLabel).toBe("Expired");
        expect(cid.untilLabel).toBe("End of 10 Oct 2026");
    });

    it("shows the end in the viewer's zone (D110, QBZ-95)", async () => {
        const { presenter } = await createReadyPage(createThree(), NEW_YORK);

        const ana = presenter.vm.rows.find(row => row.userId === "user-ana");

        expect(ana?.untilLabel).toBe("20 Oct 2026, 17:59");
    });

    it("is active until the instant its end passes (endsOn > now)", async () => {
        const { presenter } = await createReadyPage([createAnaExclusion()]);

        vi.setSystemTime(Date.parse("2026-10-20T21:59:59.998Z"));
        expect(presenter.vm.rows.map(row => row.status)).toEqual(["active"]);

        vi.setSystemTime(Date.parse("2026-10-20T21:59:59.999Z"));
        expect(presenter.vm.rows).toEqual([]);
        presenter.setTab("expired");
        expect(presenter.vm.rows.map(row => row.statusLabel)).toEqual(["Expired"]);
    });

    it("sorts by the name once one is known (Q66)", async () => {
        const { presenter } = await createReadyPage(createThree());
        const zed = createWorkflowUserSummary({ id: "user-zed", displayName: "Aaron Zec" });
        const exclusions = [...createThree(), { userId: "user-zed", reason: null, endsOn: null }];

        presenter.applySaved({ settings: { exclusions }, change: "add", user: zed });

        expect(presenter.vm.rows.map(row => row.label)).toEqual([
            "Aaron Zec",
            "user-ana",
            "user-ben"
        ]);
    });

    it("applies the user filter after the tab", async () => {
        const { presenter } = await createReadyPage(createThree());

        presenter.setUserFilter("user-ana");
        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-ana"]);

        presenter.setTab("expired");
        expect(presenter.vm.rows).toEqual([]);

        presenter.setUserFilter(null);
        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-cid"]);
    });

    it("lists the users in the list as filter options, the raw id under a deleted user (R332)", async () => {
        const { presenter } = await createNamedPage(createThree());

        expect(presenter.vm.filter).toEqual({
            value: null,
            selected: null,
            options: [
                {
                    id: "user-ana",
                    label: "Ana Kovač",
                    description: null,
                    warning: null,
                    muted: false,
                    disabled: false,
                    icon: "person",
                    note: null
                },
                {
                    id: "user-ben",
                    label: "Ben Babić",
                    description: null,
                    warning: null,
                    muted: false,
                    disabled: false,
                    icon: "person",
                    note: null
                },
                {
                    id: "user-cid",
                    label: "Deleted user",
                    description: "user-cid",
                    warning: null,
                    muted: true,
                    disabled: false,
                    icon: "person_off",
                    note: null
                }
            ]
        });
    });

    it("gives a found user's option no description", async () => {
        const { presenter } = await createReadyPage(createThree());
        const ana = createWorkflowUserSummary({ id: "user-ana", displayName: "Ana Kovač" });

        presenter.applySaved({
            settings: { exclusions: createThree() },
            change: "edit",
            user: ana
        });

        const option = presenter.vm.filter.options.find(item => item.id === "user-ana");
        expect(option?.label).toBe("Ana Kovač");
        expect(option?.description).toBeNull();
    });

    it("narrows the filter options by the search and shows the chosen user", async () => {
        const { presenter } = await createReadyPage(createThree());

        presenter.searchUserFilter("BEN");
        expect(presenter.vm.filter.options.map(option => option.id)).toEqual(["user-ben"]);

        presenter.setUserFilter("user-ben");
        expect(presenter.vm.filter.value).toBe("user-ben");
        expect(presenter.vm.filter.selected?.id).toBe("user-ben");
        // Choosing clears the search, so every user is listed again.
        expect(presenter.vm.filter.options).toHaveLength(3);
    });

    it("has no empty state while rows show", async () => {
        const { presenter } = await createReadyPage(createThree());

        expect(presenter.vm.empty).toBeNull();
    });

    it("shows `No exclusions` with Add for an empty list", async () => {
        const { presenter } = await createReadyPage([]);

        expect(presenter.vm.empty).toEqual({
            title: "No exclusions",
            text: EVERYONE,
            showAdd: true
        });
    });

    it("shows `No expired exclusions` without Add on an empty Expired tab", async () => {
        const { presenter } = await createReadyPage([createAnaExclusion()]);

        presenter.setTab("expired");

        expect(presenter.vm.empty).toEqual({
            title: "No expired exclusions",
            text: "Exclusions move here after their end date.",
            showAdd: false
        });
    });

    it("shows `No active exclusions` with Add on an empty Active tab", async () => {
        const { presenter } = await createReadyPage([createCidExclusion()]);

        expect(presenter.vm.empty).toEqual({
            title: "No active exclusions",
            text: EVERYONE,
            showAdd: true
        });
    });

    it("shows `No exclusions for this user` without Add when a user filter empties the tab", async () => {
        const { presenter } = await createReadyPage([createCidExclusion()]);

        presenter.setUserFilter("user-cid");

        expect(presenter.vm.empty).toEqual({
            title: "No exclusions for this user",
            text: EVERYONE,
            showAdd: false
        });
    });
});

describe("buildExclusionRowVm (R323, QBZ-91)", () => {
    it("mutes a deleted user's row and adds the sub line", () => {
        const row = buildExclusionRowVm(
            createAnaExclusion(),
            { userId: "user-ana", label: "Deleted user", state: "deleted" },
            EXCLUSIONS_NOW,
            ZAGREB
        );

        expect(row.label).toBe("Deleted user");
        expect(row.muted).toBe(true);
        expect(row.subLine).toBe("This user no longer exists");
        expect(row.editLabel).toBe("Edit exclusion for Deleted user");
        expect(row.removeLabel).toBe("Remove exclusion for Deleted user");
    });

    it("names a found user", () => {
        const row = buildExclusionRowVm(
            createBenExclusion(),
            { userId: "user-ben", label: "Ben Babić", state: "found" },
            EXCLUSIONS_NOW,
            ZAGREB
        );

        expect(row.label).toBe("Ben Babić");
        expect(row.muted).toBe(false);
        expect(row.subLine).toBeNull();
        expect(row.editLabel).toBe("Edit exclusion for Ben Babić");
    });
});
