import { createEmptyRuleReferences } from "~/editor/model/rules/createEmptyRuleReferences.js";
import type { StepFormOptions } from "./StepFormOptions.js";

const noop = (): void => undefined;

// The options of a closed drawer, and the defaults of the tests: every list loaded and empty.
export const createEmptyStepFormOptions = (): StepFormOptions => {
    return {
        teams: {
            loading: false,
            failed: false,
            retry: noop,
            options: [],
            selected: [],
            search: noop
        },
        transports: { loading: false, failed: false, retry: noop, options: [] },
        automations: {
            loading: false,
            failed: false,
            retry: noop,
            options: [],
            emptyText: "No automations are available for this model.",
            warning: null,
            settingsWarning: null,
            select: noop
        },
        aiModels: {
            loading: false,
            failed: false,
            retry: noop,
            options: [],
            selected: null,
            empty: false,
            search: noop
        },
        aiTools: { loading: false, failed: false, retry: noop, options: [] },
        assignment: { stepTeamIds: [], strategy: null },
        users: {
            loading: false,
            failed: false,
            retry: noop,
            items: [],
            selected: [],
            searchUsers: noop
        },
        targetMembers: {
            loading: false,
            failed: false,
            retry: noop,
            items: [],
            selected: [],
            searchTargetMembers: noop
        },
        folders: { loading: false, failed: false, retry: noop, items: [], folderType: "" },
        references: { loading: false, failed: false, retry: noop, ...createEmptyRuleReferences() },
        ruleErrors: { items: [], clearRuleError: noop },
        ruleIssues: { items: [] },
        testRouting: {
            vm: {
                requesterId: null,
                folderId: null,
                canRun: false,
                hint: null,
                buttonLabel: "Test routing",
                status: "idle",
                stale: false,
                result: null,
                errorMessage: null
            },
            setTestRequester: noop,
            setTestFolder: noop,
            runTest: noop
        }
    };
};
