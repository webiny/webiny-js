import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { EditorStep } from "~/editor/domain/types.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import { TEAMS_OFF_STEP_MESSAGE } from "~/editor/model/teamsOffMessage.js";
import { createDrawerSetup } from "~/editor/testing/drawerPresenterKit.js";
import { createTwoRulesStep } from "~/editor/testing/drawerPresenterKit.js";
import { deletedUser } from "~/editor/testing/drawerPresenterKit.js";
import { editRules } from "~/editor/testing/drawerPresenterKit.js";
import { editTeams } from "~/editor/testing/drawerPresenterKit.js";
import { getActiveTab } from "~/editor/testing/drawerPresenterKit.js";
import { setActiveTab } from "~/editor/testing/drawerPresenterKit.js";
import { withTarget } from "~/editor/testing/drawerPresenterKit.js";
import { findFormFieldVm } from "~/editor/testing/findFormFieldVm.js";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import type { FakeStepDrawerSource } from "~/editor/testing/fakeStepDrawerSource.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createRoutingStep } from "~/editor/testing/routingStepFixtures.js";
import { createStoredRule } from "~/editor/testing/routingStepFixtures.js";

const createSetup = (step: EditorStep, configure?: (source: FakeStepDrawerSource) => void) => {
    return createDrawerSetup([step], configure);
};

const twoRules = createTwoRulesStep;

const ruleError = (ruleId: string | null, field: string, message: string): StepFieldError => {
    return { field, message, ruleId };
};

describe("StepDrawerPresenter: live rule issues (R299, Review Focus 1)", () => {
    it("shows a live error and a warning line for a deleted user target on open", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.references = deletedUser("user-1");
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.ruleIssues).toEqual([
            {
                ruleId: "r-1",
                index: 0,
                kind: "error",
                field: "target",
                message: "The assigned user was deleted."
            }
        ]);
        expect(presenter.vm.warnings).toEqual([
            { text: "Rule 1: The assigned user was deleted.", severity: "error", ruleId: "r-1" }
        ]);
    });

    it("recomputes when a reference resolves after the drawer opened", () => {
        const { presenter, source } = createSetup(twoRules());
        presenter.open(source, "step-1");
        expect(presenter.vm.ruleIssues).toEqual([]);

        source.setReferences(deletedUser("user-2"));

        expect(presenter.vm.ruleIssues.map(issue => issue.ruleId)).toEqual(["r-2"]);
        expect(presenter.vm.warnings).toEqual([
            { text: "Rule 2: The assigned user was deleted.", severity: "error", ruleId: "r-2" }
        ]);
    });

    it("recomputes when the step's teams change", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.references = createRuleReferences({
                users: [{ id: "user-1", label: "Ada Lovelace", state: "found" }],
                userTeamIds: { "user-1": ["team-9"] }
            });
        });
        presenter.open(source, "step-1");
        expect(presenter.vm.ruleIssues.map(issue => issue.message)).toEqual([
            "Ada Lovelace is no longer in the reviewing teams."
        ]);

        editTeams(presenter, ["team-1", "team-9"]);

        expect(presenter.vm.ruleIssues).toEqual([]);
        expect(presenter.vm.warnings).toEqual([]);
    });

    it("recomputes after a target edit", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.references = deletedUser("user-1");
        });
        presenter.open(source, "step-1");
        expect(presenter.vm.ruleIssues).toHaveLength(1);

        editRules(presenter, rules => {
            return rules.map(rule =>
                rule.id === "r-1" ? withTarget(rule, "team", "team-1") : rule
            );
        });

        expect(presenter.vm.ruleIssues).toEqual([]);
    });

    it("shows a deleted folder as a warning, never as an error", () => {
        const step = createRoutingStep([
            createStoredRule({
                id: "r-1",
                folder: { id: "f-1", type: "cms:article", includeDescendants: false }
            })
        ]);
        const { presenter, source } = createSetup(step, configured => {
            configured.references = createRuleReferences({
                folders: [{ id: "f-1", label: "Deleted folder", state: "deleted" }]
            });
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.ruleIssues).toEqual([
            {
                ruleId: "r-1",
                index: 0,
                kind: "warning",
                field: "folder",
                message: "The folder no longer exists."
            }
        ]);
        expect(presenter.vm.warnings).toEqual([
            { text: "Rule 1: The folder no longer exists.", severity: "warning", ruleId: "r-1" }
        ]);
    });

    it("keeps the step's own warnings, drops its stale rule lines and adds the live ones", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.warnings = [
                { text: "Legal has no members.", severity: "warning" },
                { text: "Rule 1: A stale line.", severity: "warning", ruleId: "r-1" }
            ];
            configured.references = deletedUser("user-2");
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.warnings).toEqual([
            { text: "Legal has no members.", severity: "warning" },
            { text: "Rule 2: The assigned user was deleted.", severity: "error", ruleId: "r-2" }
        ]);
    });
});

describe("StepDrawerPresenter: rule errors of a save (R303, Review Focus 3)", () => {
    it("marks the rule the server names, opens on the Assignment tab and shows the tab's error", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError(
                    "r-2",
                    "config.assignment.rules.target",
                    "The target user is not a member of the step's teams."
                )
            ];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.ruleErrors).toEqual([
            {
                ruleId: "r-2",
                field: "target",
                message: "The target user is not a member of the step's teams."
            }
        ]);
        expect(presenter.vm.errorTab).toBe("assignment");
        expect(getActiveTab(presenter)).toBe("assignment");
        expect(presenter.vm.topError).toBeNull();
    });

    it("names the rule field a schema failure belongs to", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.conditions.folder.id", "Required.")
            ];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.ruleErrors).toEqual([
            { ruleId: "r-1", field: "folder", message: "Required." }
        ]);
    });

    it("shows a card-level rule error on the target field of its rule", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [ruleError("r-1", "config.assignment.rules", "Invalid rule.")];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.ruleErrors).toEqual([
            { ruleId: "r-1", field: "target", message: "Invalid rule." }
        ]);
    });

    it("shows an error at the top when its rule is gone or the server named none", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError("r-gone", "config.assignment.rules.target", "The rule was removed."),
                ruleError(null, "config.assignment.rules.target.id", "Required.")
            ];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.ruleErrors).toEqual([]);
        expect(presenter.vm.topError).toBe("The rule was removed.");
    });

    it("marks the assignment form fields the server names", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError(null, "config.assignment.strategy", "Unknown strategy.")
            ];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.errorTab).toBe("assignment");
        expect(findFormFieldVm(presenter.vm.form, "assignment.strategy")?.validation.message).toBe(
            "Unknown strategy."
        );
    });

    it("clears only the error of the rule whose field was edited", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.target", "First is wrong."),
                ruleError("r-2", "config.assignment.rules.target", "Second is wrong.")
            ];
        });
        presenter.open(source, "step-1");

        editRules(presenter, rules => {
            return rules.map(rule =>
                rule.id === "r-1" ? withTarget(rule, "team", "team-1") : rule
            );
        });

        expect(presenter.vm.ruleErrors).toEqual([
            { ruleId: "r-2", field: "target", message: "Second is wrong." }
        ]);
        expect(presenter.vm.errorTab).toBe("assignment");
    });

    it("clears the error of a rule that was removed, and the tab's error with the last one", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError("r-2", "config.assignment.rules.target", "Second is wrong.")
            ];
        });
        presenter.open(source, "step-1");
        expect(presenter.vm.errorTab).toBe("assignment");

        editRules(presenter, rules => rules.filter(rule => rule.id !== "r-2"));

        expect(presenter.vm.ruleErrors).toEqual([]);
        expect(presenter.vm.errorTab).toBeNull();
        expect(findFormFieldVm(presenter.vm.form, "assignment.rules")?.validation.isValid).not.toBe(
            false
        );
    });

    it("keeps an error when another field of the same rule that it does not name is edited", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.target", "First is wrong.")
            ];
        });
        presenter.open(source, "step-1");

        editRules(presenter, rules => {
            return rules.map(rule =>
                rule.id === "r-1" ? { ...rule, requesterUserId: "user-7" } : rule
            );
        });

        expect(presenter.vm.ruleErrors).toHaveLength(1);
    });

    it("clears a rule's errors on request", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.target", "First is wrong."),
                ruleError("r-2", "config.assignment.rules.target", "Second is wrong.")
            ];
        });
        presenter.open(source, "step-1");

        presenter.clearRuleError("r-1");

        expect(presenter.vm.ruleErrors.map(error => error.ruleId)).toEqual(["r-2"]);
    });

    it("lets a server error replace the live message of the same rule and field, never doubling it", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.references = deletedUser("user-1");
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.target", "Server says the user left.")
            ];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.ruleErrors).toEqual([
            { ruleId: "r-1", field: "target", message: "Server says the user left." }
        ]);
        expect(presenter.vm.ruleIssues).toEqual([]);
        expect(presenter.vm.warnings).toEqual([
            { text: "Rule 1: Server says the user left.", severity: "error", ruleId: "r-1" }
        ]);
    });

    it("shows the live message again once the server error is cleared", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.references = deletedUser("user-1");
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.target", "Server says the user left.")
            ];
        });
        presenter.open(source, "step-1");

        presenter.clearRuleError("r-1");

        expect(presenter.vm.ruleErrors).toEqual([]);
        expect(presenter.vm.ruleIssues.map(issue => issue.message)).toEqual([
            "The assigned user was deleted."
        ]);
    });
});

describe("StepDrawerPresenter: tabs (R302)", () => {
    it("shows the tab of an error that is not open and activates it on request", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.target", "First is wrong.")
            ];
        });
        presenter.open(source, "step-1");
        setActiveTab(presenter, "general");
        expect(getActiveTab(presenter)).toBe("general");
        expect(presenter.vm.errorTab).toBe("assignment");

        presenter.showErrorTab();

        expect(getActiveTab(presenter)).toBe("assignment");
    });

    it("opens on the General tab for a General error and names it", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.errors = [{ field: "title", message: "Enter a title.", ruleId: null }];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.errorTab).toBe("general");
        expect(getActiveTab(presenter)).toBe("general");
    });

    it("has no error tab for a step without errors", () => {
        const { presenter, source } = createSetup(twoRules());

        presenter.open(source, "step-1");

        expect(presenter.vm.errorTab).toBeNull();
    });

    it("still focuses the colour on the General tab when Done is blocked by a bad hex", async () => {
        const { presenter, source } = createSetup(twoRules());
        presenter.open(source, "step-1");
        setActiveTab(presenter, "assignment");
        const form = presenter.vm.form;
        form?.setData({ ...form.getData(), color: "#12" }, { dirty: true });

        await presenter.done();

        expect(source.closeStep).not.toHaveBeenCalled();
        expect(getActiveTab(presenter)).toBe("general");
    });
});

describe("StepDrawerPresenter: Done applies the assignment (R293)", () => {
    it("writes the edited rules through getPeopleStepPatch", async () => {
        const { presenter, source } = createSetup(twoRules());
        presenter.open(source, "step-1");

        editRules(presenter, rules => {
            return rules.map(rule =>
                rule.id === "r-1" ? withTarget(rule, "user", "user-5") : rule
            );
        });
        await presenter.done();

        expect(source.updateStep).toHaveBeenCalledTimes(1);
        const patch = source.updateStep.mock.calls[0][1];
        expect(patch.config).toMatchObject({
            teams: ["team-1"],
            assignment: {
                strategy: "none",
                allowManualPick: false,
                rules: [
                    { id: "r-1", target: { type: "user", id: "user-5" } },
                    { id: "r-2", target: { type: "user", id: "user-2" } }
                ]
            }
        });
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("does not block Done on a rule error (R304)", async () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.references = deletedUser("user-1");
        });
        presenter.open(source, "step-1");
        editRules(presenter, rules => rules.slice(0, 1));

        await presenter.done();

        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });
});

describe("StepDrawerPresenter: searches of a People step", () => {
    it("asks for the first users and the members of the step's teams, again when the teams change", () => {
        const { presenter, source } = createSetup(twoRules());

        presenter.open(source, "step-1");

        expect(source.searchUsers).toHaveBeenCalledWith("");
        expect(source.searchTargetMembers).toHaveBeenCalledWith(["team-1"], "");

        editTeams(presenter, ["team-1", "team-2"]);

        expect(source.searchTargetMembers).toHaveBeenLastCalledWith(["team-1", "team-2"], "");
    });

    it("asks for neither users nor members for an Automation or AI step", () => {
        const automation = createSetup(createAutomationStep({ id: "step-1" }));
        const ai = createSetup(createAiStep({ id: "step-1" }));

        automation.presenter.open(automation.source, "step-1");
        ai.presenter.open(ai.source, "step-1");

        expect(automation.source.searchUsers).not.toHaveBeenCalled();
        expect(automation.source.searchTargetMembers).not.toHaveBeenCalled();
        expect(ai.source.searchUsers).not.toHaveBeenCalled();
        expect(ai.source.searchTargetMembers).not.toHaveBeenCalled();
    });
});

describe("StepDrawerPresenter: a People step while teams are off (R290, R309, Review Focus 5)", () => {
    const openReadOnly = () => {
        return createSetup(twoRules(), configured => {
            configured.readOnly = true;
            configured.references = deletedUser("user-1");
            configured.warnings = [{ text: TEAMS_OFF_STEP_MESSAGE, severity: "warning" }];
            configured.errors = [
                ruleError("r-1", "config.assignment.rules.target", "The rule is odd.")
            ];
        });
    };

    it("shows the notice, is read-only and has no tabs, rule issues or rule errors", () => {
        const { presenter, source } = openReadOnly();

        presenter.open(source, "step-1");

        expect(presenter.vm.readOnly).toBe(true);
        expect(presenter.vm.notice).toBe(TEAMS_OFF_STEP_MESSAGE);
        expect(presenter.vm.ruleIssues).toEqual([]);
        expect(presenter.vm.ruleErrors).toEqual([]);
        expect(presenter.vm.warnings).toEqual([]);
        expect(getActiveTab(presenter)).toBeNull();
    });

    it("never points at the Assignment tab (final wave 3)", () => {
        const { presenter, source } = createSetup(twoRules(), configured => {
            configured.readOnly = true;
            configured.errors = [ruleError(null, "config.assignment.strategy", "Pick a strategy.")];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.errorTab).toBeNull();
    });

    it("asks for no teams, users or members", () => {
        const { presenter, source } = openReadOnly();

        presenter.open(source, "step-1");

        expect(source.searchTeams).not.toHaveBeenCalled();
        expect(source.searchUsers).not.toHaveBeenCalled();
        expect(source.searchTargetMembers).not.toHaveBeenCalled();
    });

    it("closes on Done without writing the step", async () => {
        const { presenter, source } = openReadOnly();
        presenter.open(source, "step-1");

        await presenter.done();

        expect(source.updateStep).not.toHaveBeenCalled();
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });
});

describe("StepDrawerPresenter: Automation and AI steps are unaffected (Review Focus 5)", () => {
    it("has no notice, tab error, rule issues or rule errors", () => {
        const automation = createSetup(createAutomationStep({ id: "step-1" }), configured => {
            configured.warnings = [
                { text: "The automation “x” no longer exists.", severity: "warning" }
            ];
        });
        const ai = createSetup(createAiStep({ id: "step-1" }));

        automation.presenter.open(automation.source, "step-1");
        ai.presenter.open(ai.source, "step-1");

        for (const { presenter } of [automation, ai]) {
            expect(presenter.vm.notice).toBeNull();
            expect(presenter.vm.errorTab).toBeNull();
            expect(presenter.vm.ruleIssues).toEqual([]);
            expect(presenter.vm.ruleErrors).toEqual([]);
        }
        expect(automation.presenter.vm.warnings).toEqual([
            { text: "The automation “x” no longer exists.", severity: "warning" }
        ]);
    });
});
