import fs from "node:fs";
import path from "node:path";
import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { WebsiteBuilderWorkflows } from "~/index.js";

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
    collectTree(WebsiteBuilderWorkflows(), entries);
    return entries;
};

const srcDir = import.meta.dirname;

const DELETED_PATHS = [
    "Components/PagesList/PagesListContentReviews.tsx",
    "Components/OptionItem",
    "Components/PageEditor/PageFormWorkflowState.tsx",
    "Components/PageEditor/PageFormWorkflowStateTooltip.tsx",
    "Components/PageEditor/PageFormWorkflowStatePublishButton.tsx",
    "Components/PageEditor/ToggleEditorMode.tsx",
    "presentation/page/PageGet/WorkflowStatesGetPageGraphQLFieldSelection.ts",
    "presentation/page/PageList/WorkflowStateListPagesFieldSelection.ts",
    "Components/PageWorkflows"
];

const KEPT_PATHS = [
    "Routes/WebsiteBuilderWorkflowsMenu.tsx",
    "features/editorMounting",
    "Components/PageEditor/PageEditorConfig.tsx",
    "Components/PageEditor/PageEditorTopBar.tsx",
    "Components/PageEditor/PageEditorLayout.tsx",
    "Components/PageEditor/PageEditorAutoSave.tsx",
    "hooks/usePage.ts"
];

const OLD_COMPONENTS = ["ListOpenInNewWindow"];

// The route constant `WorkflowStateList` keeps its name (R206), so it is allowed.
const OLD_CODE_PATTERN = /WorkflowState(?!List\b)|workflowState|domain\/events/;

const SHARED_FILES = [
    "index.tsx",
    "types.ts",
    "Components/index.ts",
    "Components/PagesList/PagesList.tsx",
    "presentation/page/PageGet/feature.ts",
    "presentation/page/PageList/feature.ts"
];

describe("app-website-builder-workflows cleanup (R219)", () => {
    beforeEach(() => {
        flags.enabled = true;
    });

    it("registers nothing when the feature flag is off", () => {
        flags.enabled = false;

        expect(WebsiteBuilderWorkflows()).toBeNull();
    });

    it("keeps the editor menu, registers its mounting feature and mounts no old component", () => {
        const entries = renderRoot();
        const typeNames = entries.map(entry => entry.typeName);
        const featureNames = entries.map(entry => entry.featureName).filter(name => name !== null);

        expect(typeNames).toContain("WebsiteBuilderWorkflowsMenu");
        expect(featureNames).toContain("WebsiteBuilderWorkflows/EditorMounting");
        expect(typeNames).toContain("PageEditorConfig");
        for (const oldName of OLD_COMPONENTS) {
            expect(typeNames).not.toContain(oldName);
        }
    });

    it.each(DELETED_PATHS)("%s is deleted", relativePath => {
        expect(fs.existsSync(path.join(srcDir, relativePath))).toBe(false);
    });

    it.each(KEPT_PATHS)("%s is kept (the editor mount or the page editor)", relativePath => {
        expect(fs.existsSync(path.join(srcDir, relativePath))).toBe(true);
    });

    it.each(SHARED_FILES)("%s mentions no old review code", relativePath => {
        const source = fs.readFileSync(path.join(srcDir, relativePath), "utf-8");

        expect(source).not.toMatch(OLD_CODE_PATTERN);
    });
});
