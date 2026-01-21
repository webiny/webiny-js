import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { AdminConfig } from "~/config/AdminConfig.js";

const { Theme } = AdminConfig;

describe("AdminConfig Theme", () => {
    it("should allow Theme.Color to be used directly under AdminConfig without wrapper", () => {
        // This test verifies that Theme.Color can be used directly
        // without wrapping it in a <Theme> component
        expect(() => {
            render(
                <AdminConfig>
                    <Theme.Color palette={"primary"} color={"purple"} />
                    <Theme.Color palette={"secondary"} color={"green"} />
                </AdminConfig>
            );
        }).not.toThrow();
    });

    it("should also support Theme.Color wrapped in Theme component for backward compatibility", () => {
        // This test verifies backward compatibility with the old API
        // where Theme.Color was wrapped in a <Theme> component
        expect(() => {
            render(
                <AdminConfig>
                    <Theme>
                        <Theme.Color palette={"primary"} color={"purple"} />
                        <Theme.Color palette={"secondary"} color={"green"} />
                    </Theme>
                </AdminConfig>
            );
        }).not.toThrow();
    });
});
