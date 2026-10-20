import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { createEditorOptions } from "~/editor/testing/createEditorOptions.js";
import { createTeamOptions } from "~/editor/testing/createTeamOptions.js";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { createEditorStepType } from "~/editor/testing/editorFixtures.js";
import { FakeStepDrawerSource } from "~/editor/testing/fakeStepDrawerSource.js";
import { findFormFieldVm } from "~/editor/testing/findFormFieldVm.js";
import { StepDrawerPresenterFeature } from "./feature.js";

const createSetup = (step: EditorStep, configure?: (source: FakeStepDrawerSource) => void) => {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    StepDrawerPresenterFeature.register(container);
    const presenter = StepDrawerPresenterFeature.resolve(container).presenter;
    const source = new FakeStepDrawerSource([step]);
    if (configure) {
        configure(source);
    }
    return { presenter, source };
};

// Task 8's People step is titled `Legal sign-off`, team `team-1`, `e-mail` ticked, id `step-1`.
const peopleStep = (overrides: Partial<EditorStep> = {}) => {
    return createReviewStep(overrides);
};

const automationStep = (settings: unknown = { url: "https://x.test", timeout: 30 }) => {
    return createAutomationStep({
        id: "step-1",
        title: "Legal sign-off",
        notificationIds: ["e-mail"],
        config: { automationId: "send-webhook", settings }
    });
};

const aiStep = (
    config: unknown = {
        instructions: "Check tone",
        model: "anthropic/claude-balanced",
        tools: ["read-fields"]
    }
) => {
    return createAiStep({
        id: "step-1",
        title: "Legal sign-off",
        notificationIds: ["e-mail"],
        config
    });
};

describe("StepDrawerPresenter: opening (R270)", () => {
    it("is closed until a step is opened", () => {
        const { presenter } = createSetup(peopleStep());

        expect(presenter.vm.open).toBe(false);
        expect(presenter.vm.form).toBeNull();
    });

    it("opens a People step with the form loaded and not dirty", () => {
        const { presenter, source } = createSetup(peopleStep());

        presenter.open(source, "step-1");

        expect(presenter.vm.open).toBe(true);
        expect(presenter.vm.form?.isDirty).toBe(false);
        expect(presenter.vm.form?.getData()).toEqual({
            title: "Legal sign-off",
            color: "var(--color-primary-500)",
            description: "",
            teams: ["team-1"],
            notifications: ["e-mail"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("names the step type and says it cannot be changed (D91)", () => {
        const { presenter, source } = createSetup(peopleStep());

        presenter.open(source, "step-1");

        expect(presenter.vm.kind).toBe("review");
        expect(presenter.vm.typeLabel).toBe("People");
        expect(presenter.vm.subtitle).toBe("People step · the type can't be changed");
        expect(presenter.vm.title).toBe("Legal sign-off");
        expect(presenter.vm.footerText).toBe("Edits stay in this workflow until you save it.");
        expect(presenter.vm.doneLabel).toBe("Done");
        expect(presenter.vm.readOnly).toBe(false);
        expect(presenter.vm.topError).toBeNull();
        expect(presenter.vm.licenceAlert).toBeNull();
    });

    it("shows Untitled step for a blank title, live from the form", () => {
        const { presenter, source } = createSetup(peopleStep({ title: "" }));

        presenter.open(source, "step-1");
        expect(presenter.vm.title).toBe("Untitled step");

        findFormFieldVm(presenter.vm.form, "title")?.onChange("Fact check");

        expect(presenter.vm.title).toBe("Fact check");
    });

    it("shows Untitled step when the title is cleared, not the stored title", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "title")?.onChange("");

        expect(presenter.vm.title).toBe("Untitled step");
    });

    it("stays closed for a step the draft does not have", () => {
        const { presenter, source } = createSetup(peopleStep());

        presenter.open(source, "missing");

        expect(presenter.vm.open).toBe(false);
    });

    it("asks for the first team results for a People step only", () => {
        const people = createSetup(peopleStep());
        const automation = createSetup(automationStep());
        const ai = createSetup(aiStep());

        people.presenter.open(people.source, "step-1");
        automation.presenter.open(automation.source, "step-1");
        ai.presenter.open(ai.source, "step-1");

        expect(people.source.searchTeams).toHaveBeenCalledWith("");
        expect(automation.source.searchTeams).not.toHaveBeenCalled();
        expect(ai.source.searchTeams).not.toHaveBeenCalled();
    });

    it("dispose resets everything", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        presenter.dispose();

        expect(presenter.vm.open).toBe(false);
        expect(presenter.vm.form).toBeNull();
        expect(presenter.vm.topError).toBeNull();
    });

    it("a later open replaces the earlier one", () => {
        const { presenter, source } = createSetup(peopleStep({ title: "First" }));
        source.setSteps([
            peopleStep({ title: "First" }),
            peopleStep({ id: "step-2", title: "Second" })
        ]);

        presenter.open(source, "step-1");
        presenter.open(source, "step-2");

        expect(presenter.vm.title).toBe("Second");
    });

    it("provides empty options while closed", () => {
        const { presenter } = createSetup(peopleStep());

        expect(presenter.formOptions.teams.options).toEqual([]);
        expect(presenter.formOptions.transports.options).toEqual([]);
    });
});

describe("StepDrawerPresenter: People step", () => {
    it("maps the editor's team lists: the chosen teams from `known`, the results as options (R282)", () => {
        const { presenter, source } = createSetup(
            peopleStep({ config: { teams: ["team-1", "team-2", "team-9"] } })
        );

        presenter.open(source, "step-1");

        const { teams } = presenter.formOptions;
        expect(teams.selected).toEqual([
            createPickerOption({ id: "team-1", label: "Legal", icon: "group" }),
            createPickerOption({
                id: "team-2",
                label: "Editors",
                icon: "group",
                warning: "This team has no members"
            })
        ]);
        expect(teams.options.map(option => option.id)).toEqual(["team-1", "team-2"]);
        expect(teams.loading).toBe(false);
        expect(teams.failed).toBe(false);
    });

    it("keeps a picked team's label and warning in selected", () => {
        const { presenter, source } = createSetup(peopleStep({ config: { teams: [] } }));
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "teams")?.onChange(["team-2"]);

        expect(presenter.formOptions.teams.selected).toEqual([
            createPickerOption({
                id: "team-2",
                label: "Editors",
                icon: "group",
                warning: "This team has no members"
            })
        ]);
    });

    it("forwards a search and a retry to the editor, and shows its loading and failure", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        presenter.formOptions.teams.search("leg");
        presenter.formOptions.teams.retry();
        source.setTeams(createTeamOptions({ loading: true, failed: true }));

        expect(source.searchTeams).toHaveBeenCalledWith("leg");
        expect(source.retryTeams).toHaveBeenCalledTimes(1);
        expect(presenter.formOptions.teams.loading).toBe(true);
        expect(presenter.formOptions.teams.failed).toBe(true);
    });

    it("provides the transports", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        expect(presenter.formOptions.transports).toMatchObject({
            loading: false,
            failed: false,
            options: [{ id: "e-mail", title: "E-mail", description: "Sends an e-mail" }]
        });
    });

    it("shows a failed list as failed and an empty ready list as empty, and retries through the editor (R281, R284)", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        source.setOptions(createEditorOptions({ transports: { status: "failed", items: [] } }));
        expect(presenter.formOptions.transports.failed).toBe(true);

        presenter.formOptions.transports.retry();
        expect(source.retryOptions).toHaveBeenCalledTimes(1);

        source.setOptions(createEditorOptions({ transports: { status: "ready", items: [] } }));
        expect(presenter.formOptions.transports.failed).toBe(false);
        expect(presenter.formOptions.transports.options).toEqual([]);
    });

    it("shows the transports as loading while that list loads", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        source.setOptions(createEditorOptions({ transports: { status: "loading", items: [] } }));

        expect(presenter.formOptions.transports.loading).toBe(true);
    });

    it("Done writes the edited step to the editor with the People config keys and closes (R270)", async () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "title")?.onChange("Legal review");
        findFormFieldVm(presenter.vm.form, "teams")?.onChange(["team-2"]);
        await presenter.done();

        expect(source.updateStep).toHaveBeenCalledTimes(1);
        expect(source.updateStep).toHaveBeenCalledWith("step-1", {
            title: "Legal review",
            color: "var(--color-primary-500)",
            description: null,
            notificationIds: ["e-mail"],
            config: {
                teams: ["team-2"],
                assignment: { strategy: "none", allowManualPick: false, rules: [] }
            }
        });
        expect(presenter.vm.open).toBe(false);
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("Done writes nothing when the form was not edited, and closes through the editor", async () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        await presenter.done();

        expect(source.updateStep).not.toHaveBeenCalled();
        expect(presenter.vm.open).toBe(false);
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("an unfinished hex blocks Done and shows the colour error; clearing it lets Done through (R273)", async () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "color")?.onChange("#3B6");
        await presenter.done();

        expect(presenter.vm.open).toBe(true);
        expect(source.updateStep).not.toHaveBeenCalled();
        expect(source.closeStep).not.toHaveBeenCalled();
        expect(findFormFieldVm(presenter.vm.form, "color")?.validation.message).toBe(
            "Enter a hex colour, e.g. #3B6FD4."
        );

        findFormFieldVm(presenter.vm.form, "color")?.onChange("");
        await presenter.done();

        expect(presenter.vm.open).toBe(false);
        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({ color: "var(--color-primary-500)" })
        );
    });

    it("a finished custom hex reaches the draft", async () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "color")?.onChange("#3B6FD4");
        await presenter.done();

        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({ color: "#3B6FD4" })
        );
    });

    it("dismiss (the X, Escape, the scrim) applies the edits like Done and closes through the editor", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "title")?.onChange("Legal review");

        presenter.dismiss();

        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({ title: "Legal review" })
        );
        expect(source.closeStep).toHaveBeenCalledTimes(1);
        expect(presenter.vm.open).toBe(false);
    });

    it("dismiss with an unfinished hex closes and keeps the old colour (only Done is blocked)", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "title")?.onChange("Legal review");
        findFormFieldVm(presenter.vm.form, "color")?.onChange("#3B6");

        presenter.dismiss();

        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({ title: "Legal review", color: "var(--color-primary-500)" })
        );
        expect(source.closeStep).toHaveBeenCalledTimes(1);
        expect(presenter.vm.open).toBe(false);
    });

    it("dismiss writes nothing when the form was not edited", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        presenter.dismiss();

        expect(source.updateStep).not.toHaveBeenCalled();
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("close discards the edits and does not tell the editor", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "title")?.onChange("Changed");

        presenter.close();

        expect(source.updateStep).not.toHaveBeenCalled();
        expect(source.closeStep).not.toHaveBeenCalled();
        expect(presenter.vm.open).toBe(false);
    });

    it("closes and tells the editor when the step disappears while open (deleted, workflow replaced)", () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");

        source.setSteps([]);

        expect(presenter.vm.open).toBe(false);
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("opens the same step again after it closed itself", async () => {
        const { presenter, source } = createSetup(peopleStep());
        presenter.open(source, "step-1");
        await presenter.done();

        presenter.open(source, "step-1");

        expect(presenter.vm.open).toBe(true);
    });
});

describe("StepDrawerPresenter: Automation step (R274, QBZ-13, QBZ-14)", () => {
    it("builds the settings form from the definition and lists the cards", () => {
        const { presenter, source } = createSetup(automationStep());

        presenter.open(source, "step-1");

        expect(presenter.vm.typeLabel).toBe("Automation");
        expect(presenter.vm.form?.getData().automationId).toBe("send-webhook");
        expect(findFormFieldVm(presenter.vm.form, "settings.url")?.value).toBe("https://x.test");
        expect(presenter.formOptions.automations.options.map(card => card.id)).toEqual([
            "send-webhook",
            "post-to-slack"
        ]);
        expect(presenter.formOptions.automations.warning).toBeNull();
        expect(presenter.formOptions.automations.emptyText).toBe(
            "No automations are available for this model."
        );
    });

    it("lists only the automations covering the workflow's model, and words the empty text for pages (D35, R269)", () => {
        const { presenter, source } = createSetup(automationStep(), configured => {
            configured.namespace = "wb.page";
        });

        presenter.open(source, "step-1");

        expect(presenter.formOptions.automations.options.map(card => card.id)).toEqual([
            "send-webhook"
        ]);
        expect(presenter.formOptions.automations.emptyText).toBe(
            "No automations are available for pages."
        );
    });

    it("warns that the stored automation no longer exists and builds no settings form", () => {
        const { presenter, source } = createSetup(automationStep(), configured => {
            configured.options = createEditorOptions({
                automations: { status: "ready", items: [] }
            });
        });

        presenter.open(source, "step-1");

        expect(presenter.formOptions.automations.warning).toBe(
            "The automation “send-webhook” no longer exists."
        );
        expect(findFormFieldVm(presenter.vm.form, "settings")).toBeNull();
    });

    it("warns that saved settings no longer validate, only until they are edited (QBZ-13)", () => {
        const { presenter, source } = createSetup(automationStep({ timeout: 500 }));
        presenter.open(source, "step-1");

        expect(
            presenter.formOptions.automations.settingsWarning?.startsWith(
                "Saved settings no longer validate: "
            )
        ).toBe(true);

        findFormFieldVm(presenter.vm.form, "settings.url")?.onChange("https://x.test");

        expect(presenter.formOptions.automations.settingsWarning).toBeNull();
    });

    it("shows the cards as loading, and as failed when the automations failed", () => {
        const { presenter, source } = createSetup(automationStep(), configured => {
            configured.options = createEditorOptions({
                automations: { status: "loading", items: [] }
            });
        });
        presenter.open(source, "step-1");

        expect(presenter.formOptions.automations.loading).toBe(true);
        expect(presenter.formOptions.automations.warning).toBeNull();

        source.setOptions(createEditorOptions({ automations: { status: "failed", items: [] } }));

        expect(presenter.formOptions.automations.failed).toBe(true);

        presenter.formOptions.automations.retry();
        expect(source.retryOptions).toHaveBeenCalledTimes(1);
    });

    it("rebuilds the form with the settings when the definitions arrive after it opened", () => {
        const { presenter, source } = createSetup(automationStep(), configured => {
            configured.options = createEditorOptions({
                automations: { status: "loading", items: [] }
            });
        });
        presenter.open(source, "step-1");
        expect(findFormFieldVm(presenter.vm.form, "settings")).toBeNull();
        findFormFieldVm(presenter.vm.form, "title")?.onChange("Notify");

        source.setOptions(createEditorOptions());

        expect(findFormFieldVm(presenter.vm.form, "settings.url")?.value).toBe("https://x.test");
        expect(findFormFieldVm(presenter.vm.form, "title")?.value).toBe("Notify");
    });

    it("switches at once when no settings were entered", () => {
        const { presenter, source } = createSetup(automationStep({}));
        presenter.open(source, "step-1");

        presenter.formOptions.automations.select("post-to-slack");

        expect(presenter.vm.switchConfirmation).toBeNull();
        expect(presenter.vm.form?.getData().automationId).toBe("post-to-slack");
        expect(findFormFieldVm(presenter.vm.form, "settings")).toBeNull();
    });

    it("asks before switching away from entered settings (QBZ-14)", () => {
        const { presenter, source } = createSetup(automationStep());
        presenter.open(source, "step-1");

        presenter.formOptions.automations.select("post-to-slack");

        expect(presenter.vm.switchConfirmation).toEqual({
            title: "Switch to “Post to Slack”?",
            body: "The settings for Send webhook are cleared. The change applies when you save the workflow.",
            cancelLabel: "Cancel",
            confirmLabel: "Switch automation"
        });
        expect(presenter.vm.form?.getData().automationId).toBe("send-webhook");
    });

    it("also asks after settings were typed into a step that had none", () => {
        const { presenter, source } = createSetup(automationStep({}));
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "settings.url")?.onChange("https://x.test");

        presenter.formOptions.automations.select("post-to-slack");

        expect(presenter.vm.switchConfirmation).not.toBeNull();
    });

    it("selecting the current automation does nothing", () => {
        const { presenter, source } = createSetup(automationStep());
        presenter.open(source, "step-1");

        presenter.formOptions.automations.select("send-webhook");

        expect(presenter.vm.switchConfirmation).toBeNull();
    });

    it("cancel keeps the automation and its settings", () => {
        const { presenter, source } = createSetup(automationStep());
        presenter.open(source, "step-1");
        presenter.formOptions.automations.select("post-to-slack");

        presenter.cancelSwitch();

        expect(presenter.vm.switchConfirmation).toBeNull();
        expect(presenter.vm.form?.getData().automationId).toBe("send-webhook");
        expect(findFormFieldVm(presenter.vm.form, "settings.url")?.value).toBe("https://x.test");
    });

    it("confirm switches, clears the settings and keeps the common fields", async () => {
        const { presenter, source } = createSetup(automationStep());
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "title")?.onChange("Notify");
        presenter.formOptions.automations.select("post-to-slack");

        presenter.confirmSwitch();

        expect(presenter.vm.switchConfirmation).toBeNull();
        expect(presenter.vm.form?.getData().automationId).toBe("post-to-slack");
        expect(findFormFieldVm(presenter.vm.form, "title")?.value).toBe("Notify");

        await presenter.done();

        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({
                title: "Notify",
                config: { automationId: "post-to-slack", settings: {} }
            })
        );
    });

    it("Done writes the Automation config with the edited settings (Review Focus 3)", async () => {
        const { presenter, source } = createSetup(automationStep({ url: "https://x.test" }));
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "settings.url")?.onChange("https://y.test");
        await presenter.done();

        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({
                config: { automationId: "send-webhook", settings: { url: "https://y.test" } }
            })
        );
    });
});

describe("StepDrawerPresenter: namespace and team settings (R284)", () => {
    it("lists no automation but the stored one when no model is open, and words the empty text for the model", () => {
        const { presenter, source } = createSetup(automationStep(), configured => {
            configured.namespace = null;
        });

        presenter.open(source, "step-1");

        expect(presenter.formOptions.automations.options.map(card => card.id)).toEqual([
            "send-webhook"
        ]);
        expect(presenter.formOptions.automations.emptyText).toBe(
            "No automations are available for this model."
        );
    });

    const teamAutomation = () => {
        return createAutomationDefinition({
            id: "notify-team",
            name: "Notify team",
            models: ["*"],
            settingsSchema: {
                type: "object",
                properties: { owner: { type: "string", title: "Owner", ui: "team" } }
            }
        });
    };

    it("asks for the first team results for an automation with a team setting, and selects the stored team", () => {
        const { presenter, source } = createSetup(
            createAutomationStep({
                id: "step-1",
                config: { automationId: "notify-team", settings: { owner: "team-2" } }
            }),
            configured => {
                configured.options = createEditorOptions({
                    automations: { status: "ready", items: [teamAutomation()] }
                });
            }
        );

        presenter.open(source, "step-1");

        expect(source.searchTeams).toHaveBeenCalledWith("");
        expect(presenter.formOptions.teams.selected.map(team => team.id)).toEqual(["team-2"]);
        expect(presenter.formOptions.teams.options.map(team => team.id)).toEqual([
            "team-1",
            "team-2"
        ]);
    });

    it("does not ask for teams for an automation without a team setting", () => {
        const { presenter, source } = createSetup(automationStep());

        presenter.open(source, "step-1");

        expect(source.searchTeams).not.toHaveBeenCalled();
    });
});

describe("StepDrawerPresenter: AI step (R275, QBZ-8, QBZ-47, QBZ-89)", () => {
    it("provides the models and tools the editor loaded, with the stored model selected", () => {
        const { presenter, source } = createSetup(aiStep());

        presenter.open(source, "step-1");

        expect(presenter.vm.typeLabel).toBe("AI");
        expect(presenter.vm.readOnly).toBe(false);
        expect(presenter.vm.licenceAlert).toBeNull();
        expect(presenter.formOptions.aiModels.options.map(option => option.id)).toEqual([
            "anthropic/claude-balanced",
            "openai/gpt-fast"
        ]);
        expect(presenter.formOptions.aiModels.selected?.label).toBe("Claude Balanced");
        expect(presenter.formOptions.aiTools.options).toEqual([
            {
                name: "read-fields",
                title: "Read fields",
                description: "Reads every field of the revision.",
                changesContent: false
            },
            {
                name: "update-fields",
                title: "Update fields",
                description: "Edits field values in the revision.",
                changesContent: true
            }
        ]);
    });

    it("searches the models locally", () => {
        const { presenter, source } = createSetup(aiStep());
        presenter.open(source, "step-1");

        presenter.formOptions.aiModels.search("gpt");

        expect(presenter.formOptions.aiModels.options.map(option => option.id)).toEqual([
            "openai/gpt-fast"
        ]);
    });

    it("shows a model the list no longer offers as retired, not as an error (QBZ-8)", () => {
        const { presenter, source } = createSetup(
            aiStep({ instructions: "x", model: "anthropic/gone", tools: [] })
        );

        presenter.open(source, "step-1");

        expect(presenter.formOptions.aiModels.selected?.label).toBe(
            "anthropic/gone (no longer offered)"
        );
        expect(presenter.formOptions.aiModels.selected?.warning).toContain("is no longer offered");
        expect(presenter.formOptions.aiModels.failed).toBe(false);
    });

    it("shows an empty model list (QBZ-89)", () => {
        const { presenter, source } = createSetup(
            aiStep({ instructions: "", tools: [] }),
            configured => {
                configured.options = createEditorOptions({
                    aiModels: { status: "ready", items: [] }
                });
            }
        );

        presenter.open(source, "step-1");

        expect(presenter.formOptions.aiModels.empty).toBe(true);
    });

    it("shows a failed model list with the stored model, and retries through the editor (QBZ-89)", () => {
        const { presenter, source } = createSetup(aiStep(), configured => {
            configured.options = createEditorOptions({
                aiModels: { status: "failed", items: [] },
                aiTools: { status: "failed", items: [] }
            });
        });
        presenter.open(source, "step-1");

        expect(presenter.formOptions.aiModels.failed).toBe(true);
        expect(presenter.formOptions.aiTools.failed).toBe(true);
        expect(presenter.formOptions.aiModels.selected).toEqual(
            createPickerOption({
                id: "anthropic/claude-balanced",
                label: "anthropic/claude-balanced"
            })
        );

        presenter.formOptions.aiModels.retry();

        expect(source.retryOptions).toHaveBeenCalledTimes(1);
    });

    it("is read-only without the licence: the alert shows, the fields are disabled (QBZ-47)", () => {
        const { presenter, source } = createSetup(aiStep(), configured => {
            configured.readOnly = true;
            configured.options = createEditorOptions({
                aiModels: { status: "ready", items: [] },
                aiTools: { status: "ready", items: [] }
            });
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.readOnly).toBe(true);
        expect(presenter.vm.licenceAlert).toEqual({
            title: "AI Power-Ups licence missing",
            text: "This step is read-only. Reviews that reach it fail; they can be restarted once the licence is back."
        });
        expect(findFormFieldVm(presenter.vm.form, "title")?.disabled).toBe(true);
        expect(findFormFieldVm(presenter.vm.form, "instructions")?.disabled).toBe(true);
        expect(presenter.formOptions.aiModels.failed).toBe(false);
        expect(presenter.formOptions.aiModels.empty).toBe(false);
        expect(presenter.formOptions.aiModels.selected?.warning).toBeNull();
    });

    it("Done on a read-only step closes without writing", async () => {
        const { presenter, source } = createSetup(aiStep(), configured => {
            configured.readOnly = true;
        });
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "title")?.onChange("Changed");

        await presenter.done();

        expect(source.updateStep).not.toHaveBeenCalled();
        expect(presenter.vm.open).toBe(false);
        expect(source.closeStep).toHaveBeenCalledTimes(1);
    });

    it("rebuilds the form read-only when the step types arrive and the licence is missing", () => {
        const { presenter, source } = createSetup(aiStep());
        presenter.open(source, "step-1");
        expect(findFormFieldVm(presenter.vm.form, "instructions")?.disabled).toBe(false);

        source.setReadOnly(true);

        expect(presenter.vm.readOnly).toBe(true);
        expect(findFormFieldVm(presenter.vm.form, "instructions")?.disabled).toBe(true);
    });

    it("Done writes exactly instructions, model and tools, keeping tool names the list does not offer (Review Focus 3)", async () => {
        const { presenter, source } = createSetup(
            aiStep({
                instructions: "Check tone",
                model: "anthropic/claude-balanced",
                tools: ["gone"]
            })
        );
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "instructions")?.onChange("Check tone and links");
        findFormFieldVm(presenter.vm.form, "model")?.onChange("openai/gpt-fast");
        await presenter.done();

        expect(source.updateStep).toHaveBeenCalledWith(
            "step-1",
            expect.objectContaining({
                config: {
                    instructions: "Check tone and links",
                    model: "openai/gpt-fast",
                    tools: ["gone"]
                }
            })
        );
        expect(presenter.vm.open).toBe(false);
    });
});

describe("StepDrawerPresenter: unknown step type (R269, R270)", () => {
    const customStep = () => {
        return createReviewStep({ type: "custom-check", config: { anything: 1 } });
    };

    it("shows the type by the server title, builds no form and closes on Done without writing", async () => {
        const { presenter, source } = createSetup(customStep(), configured => {
            configured.readOnly = true;
            configured.options = createEditorOptions({
                stepTypes: {
                    status: "ready",
                    items: [
                        ...createStepTypes(),
                        createEditorStepType({ type: "custom-check", title: "Custom check" })
                    ]
                }
            });
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.kind).toBe("unknown");
        expect(presenter.vm.typeLabel).toBe("Custom check");
        expect(presenter.vm.subtitle).toBe("Custom check step · the type can't be changed");
        expect(presenter.vm.form).toBeNull();
        expect(presenter.vm.readOnly).toBe(true);
        expect(presenter.vm.licenceAlert).toBeNull();

        await presenter.done();

        expect(source.updateStep).not.toHaveBeenCalled();
        expect(presenter.vm.open).toBe(false);
    });

    it("falls back to the type id when the server does not list it", () => {
        const { presenter, source } = createSetup(customStep(), configured => {
            configured.readOnly = true;
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.typeLabel).toBe("custom-check");
    });
});

describe("StepDrawerPresenter: step errors and edits (Q41, QBZ-11, QBZ-13)", () => {
    it("marks and focuses the form field the error names", () => {
        const { presenter, source } = createSetup(peopleStep(), configured => {
            configured.errors = [
                { field: "title", message: "The title is not allowed.", ruleId: null }
            ];
        });

        presenter.open(source, "step-1");

        const title = findFormFieldVm(presenter.vm.form, "title");
        expect(title?.validation).toEqual({ isValid: false, message: "The title is not allowed." });
        expect(title?.focusRequested).toBe(true);
        expect(presenter.vm.topError).toBeNull();
    });

    it("marks the teams field for config.teams, a client-side message alike", () => {
        const { presenter, source } = createSetup(
            peopleStep({ config: { teams: [] } }),
            configured => {
                configured.errors = [
                    {
                        field: "config.teams",
                        message: "Choose at least one reviewing team.",
                        ruleId: null
                    }
                ];
            }
        );

        presenter.open(source, "step-1");

        expect(findFormFieldVm(presenter.vm.form, "teams")?.validation.message).toBe(
            "Choose at least one reviewing team."
        );
    });

    it("marks a setting for config.settings.<path>", () => {
        const { presenter, source } = createSetup(automationStep(), configured => {
            configured.errors = [
                { field: "config.settings.url", message: "URL must use https.", ruleId: null }
            ];
        });

        presenter.open(source, "step-1");

        expect(findFormFieldVm(presenter.vm.form, "settings.url")?.validation.message).toBe(
            "URL must use https."
        );
    });

    it("shows the message at the top for a field with no form field", () => {
        const { presenter, source } = createSetup(peopleStep(), configured => {
            configured.errors = [
                {
                    field: "config.assignment",
                    message: "Rule 1: the user was deleted.",
                    ruleId: null
                }
            ];
        });

        presenter.open(source, "step-1");

        expect(presenter.vm.topError).toBe("Rule 1: the user was deleted.");
    });

    it("shows the message at the top for an empty field, for config.settings and for a form field that is missing", () => {
        for (const field of ["", "config.settings", "config.model"]) {
            const { presenter, source } = createSetup(peopleStep(), configured => {
                configured.errors = [{ field, message: "Something is wrong.", ruleId: null }];
            });

            presenter.open(source, "step-1");

            expect(presenter.vm.topError).toBe("Something is wrong.");
        }
    });

    it("marks every field it can and shows the first message with no field at the top", () => {
        const { presenter, source } = createSetup(
            peopleStep({ title: "", config: { teams: [] } }),
            configured => {
                configured.errors = [
                    { field: "title", message: "Enter a title for this step.", ruleId: null },
                    { field: "config.assignment", message: "Rule 1 is wrong.", ruleId: null },
                    {
                        field: "config.teams",
                        message: "Choose at least one reviewing team.",
                        ruleId: null
                    },
                    { field: "id", message: "Duplicate id.", ruleId: null }
                ];
            }
        );

        presenter.open(source, "step-1");

        expect(findFormFieldVm(presenter.vm.form, "title")?.validation.message).toBe(
            "Enter a title for this step."
        );
        expect(findFormFieldVm(presenter.vm.form, "teams")?.validation.message).toBe(
            "Choose at least one reviewing team."
        );
        expect(presenter.vm.topError).toBe("Rule 1 is wrong.");
    });

    it("marks the teams field for a zod path under config.teams (R267)", () => {
        const { presenter, source } = createSetup(peopleStep(), configured => {
            configured.errors = [
                { field: "config.teams.0", message: "Team is not valid.", ruleId: null }
            ];
        });

        presenter.open(source, "step-1");

        expect(findFormFieldVm(presenter.vm.form, "teams")?.validation.message).toBe(
            "Team is not valid."
        );
    });

    it("shows no error on open when the step has none (QBZ-13)", () => {
        const { presenter, source } = createSetup(peopleStep({ title: "", config: { teams: [] } }));

        presenter.open(source, "step-1");

        expect(findFormFieldVm(presenter.vm.form, "title")?.validation.isValid).not.toBe(false);
        expect(presenter.vm.topError).toBeNull();
    });

    it("the first edit clears the top message", () => {
        const { presenter, source } = createSetup(peopleStep(), configured => {
            configured.errors = [{ field: "", message: "Something is wrong.", ruleId: null }];
        });
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "title")?.onChange("A");

        expect(presenter.vm.topError).toBeNull();
    });

    it("editing a field replaces its error with the next validation", async () => {
        const { presenter, source } = createSetup(peopleStep(), configured => {
            configured.errors = [
                { field: "title", message: "The title is not allowed.", ruleId: null }
            ];
        });
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "title")?.onChange("Legal review");

        await vi.waitFor(() => {
            expect(findFormFieldVm(presenter.vm.form, "title")?.validation.isValid).toBe(true);
        });
    });

    it("editing the AI tools clears a server error on config.tools (R276)", () => {
        const { presenter, source } = createSetup(aiStep(), configured => {
            configured.errors = [{ field: "config.tools", message: "Unknown tool.", ruleId: null }];
        });
        presenter.open(source, "step-1");
        expect(findFormFieldVm(presenter.vm.form, "tools")?.validation.message).toBe(
            "Unknown tool."
        );

        findFormFieldVm(presenter.vm.form, "tools")?.onChange(["update-fields"]);

        expect(findFormFieldVm(presenter.vm.form, "tools")?.validation.isValid).not.toBe(false);
        expect(findFormFieldVm(presenter.vm.form, "tools")?.validation.message).toBeUndefined();
    });

    it("editing Notify via clears a server error on notifications (R276)", () => {
        const { presenter, source } = createSetup(peopleStep(), configured => {
            configured.errors = [
                { field: "notifications", message: "Unknown transport.", ruleId: null }
            ];
        });
        presenter.open(source, "step-1");
        expect(findFormFieldVm(presenter.vm.form, "notifications")?.validation.message).toBe(
            "Unknown transport."
        );

        findFormFieldVm(presenter.vm.form, "notifications")?.onChange([]);

        expect(
            findFormFieldVm(presenter.vm.form, "notifications")?.validation.message
        ).toBeUndefined();
    });

    it("leaves an error on a field that was not edited", () => {
        const { presenter, source } = createSetup(peopleStep(), configured => {
            configured.errors = [
                { field: "notifications", message: "Unknown transport.", ruleId: null }
            ];
        });
        presenter.open(source, "step-1");

        findFormFieldVm(presenter.vm.form, "description")?.onChange("Notes");

        expect(findFormFieldVm(presenter.vm.form, "notifications")?.validation.message).toBe(
            "Unknown transport."
        );
    });
});

describe("StepDrawerPresenter: rebuilds keep what was typed", () => {
    it("a read-only change keeps the typed automation values, dirty state and errors", () => {
        const { presenter, source } = createSetup(automationStep(), configured => {
            configured.errors = [
                { field: "config.settings.url", message: "URL must use https.", ruleId: null }
            ];
        });
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "title")?.onChange("Typed title");
        findFormFieldVm(presenter.vm.form, "settings.timeout")?.onChange(45);

        source.setReadOnly(true);

        expect(findFormFieldVm(presenter.vm.form, "title")?.value).toBe("Typed title");
        expect(findFormFieldVm(presenter.vm.form, "settings.timeout")?.value).toBe(45);
        expect(presenter.vm.form?.isDirty).toBe(true);
        expect(findFormFieldVm(presenter.vm.form, "settings.url")?.validation.message).toBe(
            "URL must use https."
        );
    });

    it("a read-only change keeps the typed AI values", () => {
        const { presenter, source } = createSetup(aiStep());
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "instructions")?.onChange("Typed instructions");

        source.setReadOnly(true);

        expect(findFormFieldVm(presenter.vm.form, "instructions")?.value).toBe(
            "Typed instructions"
        );
        expect(presenter.vm.form?.isDirty).toBe(true);
    });

    it("a new automations list (retry) keeps the typed settings (M2)", () => {
        const { presenter, source } = createSetup(automationStep());
        presenter.open(source, "step-1");
        findFormFieldVm(presenter.vm.form, "settings.url")?.onChange("https://typed.test");

        source.setOptions(createEditorOptions());

        expect(findFormFieldVm(presenter.vm.form, "settings.url")?.value).toBe(
            "https://typed.test"
        );
        expect(presenter.vm.form?.isDirty).toBe(true);
    });
});

describe("StepDrawerPresenter: marks after an automation switch", () => {
    it("drops the marks of settings fields the new form lacks, without throwing on the next edit", () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const { presenter, source } = createSetup(automationStep(), configured => {
            configured.errors = [
                { field: "config.settings.url", message: "URL must use https.", ruleId: null },
                { field: "notifications", message: "Unknown transport.", ruleId: null }
            ];
        });
        presenter.open(source, "step-1");
        presenter.formOptions.automations.select("post-to-slack");
        presenter.confirmSwitch();

        findFormFieldVm(presenter.vm.form, "title")?.onChange("Edited");

        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
