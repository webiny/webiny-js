import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { Route } from "@webiny/app/features/router/Route.js";
import { createFakeAppAdapter } from "~/editor/testing/fakeEditorAppAdapter.js";
import { WorkflowEditorRouteView } from "./WorkflowEditorRouteView.js";

interface ViewProps {
    initialModelId?: string;
}

const hoisted = vi.hoisted(() => {
    return { params: {} as Record<string, unknown>, views: [] as unknown[] };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return { ...actual, useRoute: () => ({ route: { params: hoisted.params } }) };
});

vi.mock("~/editor/presentation/editor/components/WorkflowEditorView.js", () => {
    return {
        WorkflowEditorView: (props: ViewProps) => {
            hoisted.views.push(props);
            return null;
        }
    };
});

const route = new Route({ name: "Test/Workflows", path: "/test/workflows" });
const app = createFakeAppAdapter("cms");

const mount = (params: Record<string, unknown>): ViewProps => {
    hoisted.params = params;
    hoisted.views = [];
    render(<WorkflowEditorRouteView route={route} app={app} breadcrumbName="cms.workflows" />);
    return hoisted.views[hoisted.views.length - 1] as ViewProps;
};

describe("WorkflowEditorRouteView", () => {
    it("gives the view the modelId of the route as the model to open first", () => {
        expect(mount({ modelId: "article" }).initialModelId).toBe("article");
    });

    it("gives the view no model when the route has no modelId", () => {
        expect(mount({}).initialModelId).toBeUndefined();
    });
});
