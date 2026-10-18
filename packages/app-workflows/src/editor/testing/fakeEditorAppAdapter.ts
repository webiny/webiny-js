import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowEditorAppKind } from "~/editor/model/getStepTypeOptions.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import type { ReviewContentRef } from "~/review/content/IReviewContentAdapter.js";

export interface FakeEditorAppAdapter extends WorkflowEditorAppAdapter {
    init: Mock<WorkflowEditorAppAdapter["init"]>;
    renderModelIcon: Mock<WorkflowEditorAppAdapter["renderModelIcon"]>;
    getFolderType: Mock<WorkflowEditorAppAdapter["getFolderType"]>;
    listFolders: Mock<WorkflowEditorAppAdapter["listFolders"]>;
}

export const createFakeContentAdapter = (): IReviewContentAdapter => {
    return {
        canHandle: vi.fn().mockReturnValue(true),
        getContentUrl: vi.fn((ref: ReviewContentRef) => {
            return `/content/${ref.targetId}/${ref.targetRevisionId}`;
        }),
        getContentTypeLabel: vi.fn().mockReturnValue(null)
    };
};

export const createFakeAppAdapter = (kind: WorkflowEditorAppKind = "cms"): FakeEditorAppAdapter => {
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
