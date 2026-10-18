import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { WorkflowEditorConfig } from "./WorkflowEditorConfig.js";

interface FieldRendererStubProps {
    name: string;
}

interface PassthroughStubProps {
    children?: React.ReactNode;
}

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const react = await import("react");
    const FieldRenderer = (props: FieldRendererStubProps) => {
        return react.createElement("div", {
            "data-testid": "field-renderer",
            "data-name": props.name
        });
    };
    const Passthrough = (props: PassthroughStubProps) => {
        return react.createElement(react.Fragment, null, props.children);
    };
    return { ...actual, AdminConfig: Object.assign(Passthrough, { Form: { FieldRenderer } }) };
});

describe("WorkflowEditorConfig", () => {
    afterEach(() => {
        cleanup();
    });

    it("registers the colour, teams, transport, automation, AI model, AI tools, user, folder, strategy and routing rules renderers", () => {
        render(<WorkflowEditorConfig />);

        const names = screen.getAllByTestId("field-renderer").map(element => {
            return element.getAttribute("data-name");
        });

        expect(names).toEqual([
            "workflowStepColour",
            "workflowTeamsPicker",
            "workflowTransports",
            "workflowAutomationCards",
            "workflowAiModel",
            "workflowAiTools",
            "workflowUserPicker",
            "workflowFolderPicker",
            "workflowAssignmentStrategy",
            "workflowRoutingRules"
        ]);
    });
});
