import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createEditorOptions } from "~/editor/testing/createEditorOptions.js";
import { createDrawerSetup } from "~/editor/testing/drawerPresenterKit.js";
import { createTwoRulesStep } from "~/editor/testing/drawerPresenterKit.js";
import { editAssignment } from "~/editor/testing/drawerPresenterKit.js";
import { editTeams } from "~/editor/testing/drawerPresenterKit.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createListedUser } from "~/editor/testing/routingStepFixtures.js";

const ADA = createListedUser("user-1", "Ada Lovelace", ["team-1"]);

describe("StepDrawerPresenter: the source-backed form options (controller ruling)", () => {
    it("hands over the step's teams and strategy as the form holds them now", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()]);
        presenter.open(source, "step-1");

        expect(presenter.formOptions.assignment).toEqual({
            stepTeamIds: ["team-1"],
            strategy: "none"
        });

        editTeams(presenter, ["team-1", "team-2"]);
        editAssignment(presenter, { strategy: "roundRobin" });

        expect(presenter.formOptions.assignment).toEqual({
            stepTeamIds: ["team-1", "team-2"],
            strategy: "roundRobin"
        });
    });

    it("fills the user and member slices from the source and binds their callbacks", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()], configured => {
            configured.users = { items: [ADA], selected: [ADA], loading: true, failed: false };
            configured.members = { items: [ADA], selected: [], loading: false, failed: true };
        });
        presenter.open(source, "step-1");

        const { users, targetMembers } = presenter.formOptions;
        users.searchUsers("ad");
        users.retry();
        targetMembers.searchTargetMembers(["team-1"], "gra");
        targetMembers.retry();

        expect(users).toMatchObject({
            items: [ADA],
            selected: [ADA],
            loading: true,
            failed: false
        });
        expect(targetMembers).toMatchObject({ items: [ADA], loading: false, failed: true });
        expect(source.searchUsers).toHaveBeenCalledWith("ad");
        expect(source.retryUsers).toHaveBeenCalledTimes(1);
        expect(source.searchTargetMembers).toHaveBeenCalledWith(["team-1"], "gra");
        expect(source.retryTargetMembers).toHaveBeenCalledWith(["team-1"]);
    });

    it("fills the folder slice with the list, the folder type and a retry that reloads", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()], configured => {
            configured.folders = {
                items: [{ id: "f-1", path: "/News" }],
                loading: false,
                failed: true
            };
            configured.folderType = "cms:article";
        });
        presenter.open(source, "step-1");

        const { folders } = presenter.formOptions;
        folders.retry();

        expect(folders).toMatchObject({
            items: [{ id: "f-1", path: "/News" }],
            loading: false,
            failed: true,
            folderType: "cms:article"
        });
        expect(source.retryReferences).toHaveBeenCalledTimes(1);
    });

    it("fills the references slice with the maps, the status and the retry", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()], configured => {
            configured.references = createRuleReferences({
                users: [{ id: "user-1", label: "Ada Lovelace", state: "found" }],
                userTeamIds: { "user-1": ["team-1"] }
            });
            configured.referencesStatus = { loading: true, failed: false };
        });
        presenter.open(source, "step-1");

        const { references } = presenter.formOptions;
        references.retry();

        expect(references.users.get("user-1")?.label).toBe("Ada Lovelace");
        expect(references.userTeamIds.get("user-1")).toEqual(["team-1"]);
        expect(references.loading).toBe(true);
        expect(references.failed).toBe(false);
        expect(source.retryReferences).toHaveBeenCalledTimes(1);
    });

    it("reacts to a reference that resolves while the drawer is open", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()]);
        presenter.open(source, "step-1");
        expect(presenter.formOptions.references.users.size).toBe(0);

        source.setReferences(
            createRuleReferences({
                users: [{ id: "user-2", label: "Grace Hopper", state: "found" }]
            })
        );

        expect(presenter.formOptions.references.users.get("user-2")?.label).toBe("Grace Hopper");
    });

    it("keeps the defaults for the slices the drawer view fills later", () => {
        const { presenter, source } = createDrawerSetup([createTwoRulesStep()]);
        presenter.open(source, "step-1");

        const { ruleErrors, ruleIssues, testRouting } = presenter.formOptions;

        expect(ruleErrors.items).toEqual([]);
        expect(ruleIssues.items).toEqual([]);
        expect(testRouting.vm.status).toBe("idle");
    });
});

describe("StepDrawerPresenter: the Automation user hint", () => {
    const userAutomation = () => {
        return createAutomationDefinition({
            id: "notify-owner",
            name: "Notify owner",
            models: ["*"],
            settingsSchema: {
                type: "object",
                properties: { owner: { type: "string", title: "Owner", ui: "user" } }
            }
        });
    };

    it("asks for the first user results when the automation has a user setting", () => {
        const { presenter, source } = createDrawerSetup(
            [
                createAutomationStep({
                    id: "step-1",
                    config: { automationId: "notify-owner", settings: { owner: "user-1" } }
                })
            ],
            configured => {
                configured.options = createEditorOptions({
                    automations: { status: "ready", items: [userAutomation()] }
                });
            }
        );

        presenter.open(source, "step-1");

        expect(source.searchUsers).toHaveBeenCalledWith("");
    });

    it("asks for no users when the automation has no user setting", () => {
        const { presenter, source } = createDrawerSetup(
            [createAutomationStep({ id: "step-1" })],
            configured => {
                configured.options = createEditorOptions({
                    automations: {
                        status: "ready",
                        items: [createAutomationDefinition({ id: "send-webhook" })]
                    }
                });
            }
        );

        presenter.open(source, "step-1");

        expect(source.searchUsers).not.toHaveBeenCalled();
    });
});
