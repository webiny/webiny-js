import fs from "node:fs";
import path from "node:path";
import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { WorkflowsAdminApp } from "~/app.js";

const flags = vi.hoisted(() => {
    return { enabled: true };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const original = await importOriginal<typeof import("@webiny/app-admin")>();
    const RegisterFeature = () => null;
    const useFeatureFlags = () => {
        return { isEnabled: () => flags.enabled };
    };
    return { ...original, RegisterFeature, useFeatureFlags };
});

interface TreeProps {
    children?: React.ReactNode;
    feature?: { name: string };
}

interface NamedType {
    displayName?: string;
    name?: string;
}

interface TreeEntry {
    typeName: string;
    featureName: string | null;
}

const getTypeName = (type: React.ReactElement["type"]): string => {
    if (typeof type === "string") {
        return type;
    }
    if (type === React.Fragment) {
        return "Fragment";
    }
    const named = type as NamedType;
    return named.displayName || named.name || "Anonymous";
};

const collectTree = (node: React.ReactNode, entries: TreeEntry[]): void => {
    React.Children.forEach(node, child => {
        if (!React.isValidElement<TreeProps>(child)) {
            return;
        }
        const featureName = child.props.feature ? child.props.feature.name : null;
        entries.push({ typeName: getTypeName(child.type), featureName });
        collectTree(child.props.children, entries);
    });
};

const renderRoot = (): TreeEntry[] => {
    const entries: TreeEntry[] = [];
    collectTree(WorkflowsAdminApp(), entries);
    return entries;
};

const srcDir = import.meta.dirname;

const DELETED_PATHS = [
    "features/approveStep",
    "features/cancelWorkflowState",
    "features/getTargetWorkflowState",
    "features/listWorkflowStates",
    "features/rejectStep",
    "features/requestReview",
    "features/startStep",
    "features/takeOverStep",
    "presentation/workflowState",
    "presentation/workflowStateList",
    "presentation/workflowStatesWidget",
    "presentation/shared",
    "presentation/ContentReviews.tsx",
    "routes.ts",
    "domain/WorkflowStateModel.ts",
    "domain/WorkflowStateStepModel.ts",
    "domain/abstractions/WorkflowStateModel.ts",
    "domain/abstractions/WorkflowStateStepModel.ts",
    "domain/events.ts",
    "features/listWorkflows",
    "features/storeWorkflow",
    "features/deleteWorkflow",
    "features/listNotificationTypes",
    "features/feature.ts",
    "features/graphqlFields.ts",
    "presentation/workflowsEditor",
    "domain/index.ts",
    "domain/WorkflowModel.ts",
    "domain/WorkflowStepModel.ts",
    "domain/abstractions",
    "hooks/canUseWorkflows.ts"
];

const KEPT_PATHS = [
    "features/permissions",
    "presentation/permissions",
    "domain/permissionsSchema.ts",
    "editor",
    "review",
    "types.ts"
];

const OLD_CODE_PATTERN = /WorkflowState|workflowState|domain\/events|~\/routes\.js/;

const SHARED_FILES = ["app.tsx", "index.tsx", "types.ts"];

const OLD_EDITOR_API_PATTERN =
    /\bComponents\b|useCanUseWorkflows|IWorkflowApplication|\bWorkflowsFeature\b|WorkflowsEditorPresenterFeature|IGenericMeta|IGenericError|IWorkflowNotificationType|IWorkflowStep\b|IWorkflow\b/;

describe("app-workflows cleanup (R219)", () => {
    beforeEach(() => {
        flags.enabled = true;
    });

    it("registers nothing when the feature flag is off", () => {
        flags.enabled = false;

        expect(WorkflowsAdminApp()).toBeNull();
    });

    it("registers the review features and none of the old editor or review presenters", () => {
        const entries = renderRoot();
        const featureNames = entries.map(entry => entry.featureName).filter(name => name !== null);

        expect(featureNames).toContain("Workflows/ReviewServices");
        expect(featureNames).toContain("Workflows/ActiveReviewTrash");
        expect(featureNames).not.toContain("Workflows");
        expect(featureNames).not.toContain("Workflows/WorkflowsEditorPresenter");
        expect(featureNames).not.toContain("Workflows/WorkflowStatePresenter");
        expect(featureNames).not.toContain("Workflows/WorkflowStateListPresenter");
        expect(featureNames).not.toContain("Workflows/WorkflowStatesWidgetPresenter");
    });

    it("no longer mounts the global Content Reviews route, menu and widgets", () => {
        const typeNames = renderRoot().map(entry => entry.typeName);

        expect(typeNames).not.toContain("ContentReviews");
    });

    it.each(DELETED_PATHS)("%s is deleted", relativePath => {
        expect(fs.existsSync(path.join(srcDir, relativePath))).toBe(false);
    });

    it.each(KEPT_PATHS)("%s is kept for the editor (9a, 9c)", relativePath => {
        expect(fs.existsSync(path.join(srcDir, relativePath))).toBe(true);
    });

    it.each(SHARED_FILES)("%s mentions no old review code", relativePath => {
        const source = fs.readFileSync(path.join(srcDir, relativePath), "utf-8");

        expect(source).not.toMatch(OLD_CODE_PATTERN);
    });

    it.each(SHARED_FILES)("%s carries no old editor API", relativePath => {
        const source = fs.readFileSync(path.join(srcDir, relativePath), "utf-8");

        expect(source).not.toMatch(OLD_EDITOR_API_PATTERN);
    });
});
