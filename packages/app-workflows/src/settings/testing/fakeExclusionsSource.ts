import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import type { ExclusionUserName } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";

export interface FakeExclusionsSourceOptions {
    exclusions?: WorkflowExclusion[];
    // Default `Europe/Zagreb`.
    timeZone?: string;
    // The names the page knows; any other id is unknown and labelled with the id.
    names?: ExclusionUserName[];
}

export interface FakeExclusionsSource extends ExclusionsSource {
    getExclusions: Mock<ExclusionsSource["getExclusions"]>;
    getTimeZone: Mock<ExclusionsSource["getTimeZone"]>;
    getUserName: Mock<ExclusionsSource["getUserName"]>;
    applySaved: Mock<ExclusionsSource["applySaved"]>;
    openRemove: Mock<ExclusionsSource["openRemove"]>;
    closeDialog: Mock<ExclusionsSource["closeDialog"]>;
}

// A page as the dialogs see it: a fixed list, zone and names, and recorded writes.
export const createFakeExclusionsSource = (
    options: FakeExclusionsSourceOptions = {}
): FakeExclusionsSource => {
    const exclusions = options.exclusions ?? [];
    const timeZone = options.timeZone ?? "Europe/Zagreb";
    const names = new Map<string, ExclusionUserName>();
    const knownNames = options.names ?? [];
    for (const name of knownNames) {
        names.set(name.userId, name);
    }

    const getUserName = (userId: string): ExclusionUserName => {
        const known = names.get(userId);
        if (known !== undefined) {
            return known;
        }
        return { userId, label: userId, state: "unknown" };
    };

    return {
        getExclusions: vi.fn(() => exclusions),
        getTimeZone: vi.fn(() => timeZone),
        getUserName: vi.fn(getUserName),
        applySaved: vi.fn(),
        openRemove: vi.fn(),
        closeDialog: vi.fn()
    };
};
