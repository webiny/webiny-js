import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import { AdminConfigPlugin } from "@webiny/app-admin/config/AdminConfig.js";
import { AdminWithConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { useAdminConfig } from "@webiny/app-admin/config/AdminConfig.js";
import { PermissionValueProvider } from "@webiny/app-admin";
import type { Permission } from "@webiny/app-admin";
import { CompositionProvider } from "@webiny/react-composition";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { SecurityPermissions } from "./SecurityPermissions.js";

const onChange = vi.fn<(value: Permission[]) => void>();

// Reads the registered permission groups back from the real admin config and renders each element.
const Probe = () => {
    const { permissionRenderers } = useAdminConfig();

    return (
        <>
            {permissionRenderers.map(renderer => (
                <section
                    key={renderer.name}
                    data-testid={`permission-renderer-${renderer.name}`}
                    data-title={renderer.title}
                    data-description={renderer.description ?? ""}
                    data-has-schema={String(renderer.schema !== undefined)}
                    data-has-icon={String(renderer.icon !== undefined)}
                >
                    <PermissionValueProvider value={[]} onChange={onChange}>
                        {renderer.element}
                    </PermissionValueProvider>
                </section>
            ))}
        </>
    );
};

describe("SecurityPermissions (R333)", () => {
    it("registers the Workflows group with its element, title, description and icon, and no schema", async () => {
        renderWithAdminUi(
            <CompositionProvider>
                <SecurityPermissions />
                <AdminWithConfig>
                    {AdminConfigPlugin}
                    <Probe />
                </AdminWithConfig>
            </CompositionProvider>
        );

        const group = await screen.findByTestId("permission-renderer-workflows");
        expect(group.getAttribute("data-title")).toBe("Workflows");
        expect(group.getAttribute("data-description")).toBe(
            "Publishing workflows for Headless CMS and Website Builder"
        );
        expect(group.getAttribute("data-has-schema")).toBe("false");
        expect(group.getAttribute("data-has-icon")).toBe("true");
        const none = await within(group).findByRole("radio", { name: "No access" });
        expect(none.getAttribute("aria-checked")).toBe("true");
        expect(
            within(group).getByText(
                "Reviewing is not a permission. Anyone in a step's reviewing teams who can read the content can review it."
            )
        ).toBeDefined();
        expect(onChange).not.toHaveBeenCalled();
    });
});
