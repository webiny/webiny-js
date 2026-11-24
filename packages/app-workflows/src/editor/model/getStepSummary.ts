import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { AiTool } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { readAiConfig } from "./readAiConfig.js";
import { readAutomationConfig } from "./readAutomationConfig.js";
import { getAssignmentSummary } from "./getAssignmentSummary.js";
import { getReviewTeamNames } from "./getReviewTeamNames.js";
import { readReviewConfig } from "./readReviewConfig.js";
import type { StepContext } from "./StepContext.js";

function getReviewSummary(step: EditorStep, context: StepContext): string {
    // Team names do not resolve while teams are off, so a step of an unavailable review row has none.
    if (!context.reviewAvailable) {
        return "";
    }
    const config = readReviewConfig(step.config);
    if (config.teams.length === 0) {
        return "";
    }

    const parts = [getReviewTeamNames(step, context).join(" + ")];
    const assignment = getAssignmentSummary(step);
    if (assignment !== "") {
        parts.push(assignment);
    }

    return parts.join(" · ");
}

function getAutomationSummary(step: EditorStep, context: StepContext): string {
    const config = readAutomationConfig(step.config);
    const definition = context.automations.find(item => item.id === config.automationId);
    return definition ? definition.name : config.automationId;
}

function anyToolChangesContent(chosen: string[], listed: AiTool[] | null): boolean {
    if (listed === null) {
        return false;
    }
    return chosen.some(name => {
        return listed.some(tool => tool.name === name && tool.changesContent);
    });
}

function getAiSummary(step: EditorStep, context: StepContext): string {
    const config = readAiConfig(step.config);
    const count = config.tools.length;
    const tools = `${count} ${count === 1 ? "tool" : "tools"}`;
    const changes = anyToolChangesContent(config.tools, context.aiTools);
    const suffix = changes ? " · can change content" : "";
    if (config.model === "") {
        return `No model chosen · ${tools}${suffix}`;
    }
    const models = context.aiModels;
    const model = models === null ? undefined : models.find(item => item.id === config.model);
    const name = model ? model.name : config.model;
    const retired = models !== null && models.length > 0 && model === undefined;
    if (retired) {
        return `${name} (no longer offered) · ${tools}${suffix}`;
    }
    return `${name} · ${tools}${suffix}`;
}

/*
 * The summary line of a step card (R272-R275, R308): People `{Teams joined with +} · {Team
 * pool|Round-robin|Least-loaded}[ · n routing rule(s)][ · requester can pick]`, Automation
 * `{Automation}`, AI `{Model} · n tool(s)[ · can change content]`. Empty for a type the editor has
 * no form for and for a People step while teams are off. Pure.
 */
export const getStepSummary = (step: EditorStep, context: StepContext): string => {
    if (step.type === StepTypeId.Review) {
        return getReviewSummary(step, context);
    }
    if (step.type === StepTypeId.Automation) {
        return getAutomationSummary(step, context);
    }
    if (step.type === StepTypeId.Ai) {
        return getAiSummary(step, context);
    }
    return "";
};
