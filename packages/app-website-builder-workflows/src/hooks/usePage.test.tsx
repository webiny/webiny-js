import React from "react";
import { renderHook } from "@testing-library/react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { PageDtoMapper } from "@webiny/app-website-builder/domain/Page/index.js";
import { PageProvider } from "@webiny/app-website-builder/presentation/pages/PageList/hooks/usePage.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";
import "~/types.js";
import { usePage } from "./usePage.js";

interface ChildrenProps {
    children: React.ReactNode;
}

const WORKFLOW: SystemWorkflowValue = {
    workflowId: "workflow-1",
    reviewState: ReviewState.Approved,
    stepId: "step-2",
    stepName: "Legal",
    stepState: StepState.Approved
};

const createWrapper = (system: Page["system"]) => {
    const page = Page.create({ id: "page-1#0001", entryId: "page-1", system });
    const dto = PageDtoMapper.toDTO(page);

    return function PageWrapper({ children }: ChildrenProps) {
        return <PageProvider page={dto}>{children}</PageProvider>;
    };
};

describe("usePage", () => {
    it("exposes system.workflow as page.workflow", () => {
        const wrapper = createWrapper({ workflow: WORKFLOW });

        const { result } = renderHook(() => usePage(), { wrapper });

        expect(result.current.page.workflow).toEqual(WORKFLOW);
    });

    it("is null when the page has no workflow", () => {
        const wrapper = createWrapper(null);

        const { result } = renderHook(() => usePage(), { wrapper });

        expect(result.current.page.workflow).toBeNull();
    });
});
