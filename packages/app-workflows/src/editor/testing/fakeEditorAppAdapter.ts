import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { createFakeContentAdapter } from "~/editor/testing/fakeReviewContentAdapter.js";

export interface FakeEditorAppAdapter extends WorkflowEditorAppAdapter {
    init: Mock<WorkflowEditorAppAdapter["init"]>;
    renderModelIcon: Mock<WorkflowEditorAppAdapter["renderModelIcon"]>;
    getFolderType: Mock<WorkflowEditorAppAdapter["getFolderType"]>;
    listFolders: Mock<WorkflowEditorAppAdapter["listFolders"]>;
}

export const createFakeAppAdapter = (kind: WorkflowAppKind = "cms"): FakeEditorAppAdapter => {
    return {
        appKind: kind,
        panelLabel: kind === "cms" ? "Content models" : "Website Builder",
        appliesToLabel: kind === "cms" ? "Headless CMS model" : "Website Builder",
        init: vi.fn().mockResolvedValue(undefined),
        renderModelIcon: vi.fn().mockReturnValue(null),
        getFolderType: vi.fn((modelId: string | null) => {
            return kind === "cms" ? `cms:${modelId ?? ""}` : "wb:page";
        }),
        listFolders: vi.fn().mockResolvedValue([]),
        contentAdapter: createFakeContentAdapter()
    };
};
