import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { CmsWorkflows } from "~/index.js";

vi.mock("@webiny/app-admin", async importOriginal => {
    const original = await importOriginal<typeof import("@webiny/app-admin")>();
    const RegisterFeature = () => null;
    const useFeatureFlags = () => {
        return { isEnabled: () => true };
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
    collectTree(CmsWorkflows(), entries);
    return entries;
};

describe("CmsWorkflows root", () => {
    it("mounts the workflow editor route and registers its mounting feature", () => {
        const entries = renderRoot();
        const typeNames = entries.map(entry => entry.typeName);
        const featureNames = entries.map(entry => entry.featureName).filter(name => name !== null);

        expect(typeNames).toContain("CmsWorkflowEditor");
        expect(featureNames).toContain("CmsWorkflows/EditorMounting");
        // The feature that gates Publish in the revisions drawer.
        expect(featureNames).toContain("CmsWorkflows");
    });
});
