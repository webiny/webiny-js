import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { LocalStorageFeature } from "@webiny/app/features/localStorage/feature.js";
import { ThemeFeature } from "~/features/theme/feature.js";
import type { Theme } from "~/config/AdminConfig/Theme/types.js";

const dark: Theme = {
    id: "dark",
    name: "Dark",
    variables: { "--color-neutral-base": "#000", "--color-scheme": "dark" }
};

const createRoot = () => {
    const root = new Container();
    LocalStorageFeature.register(root, { prefix: "webiny/dep" });
    ThemeFeature.register(root);
    return root;
};

// The same thing `TenancyFeature.createTenantContainer` does.
const createTenant = (root: Container, tenant: string) => {
    const child = root.createChildContainer();
    LocalStorageFeature.register(child, { prefix: `webiny/dep/${tenant}` });
    return child;
};

describe("ThemeFeature", () => {
    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.removeAttribute("style");
    });

    it("stores the selection once per browser, not per tenant", () => {
        const root = createRoot();
        const tenantA = createTenant(root, "a");
        const tenantB = createTenant(root, "b");

        ThemeFeature.resolve(tenantA).selection.select(dark);

        expect(ThemeFeature.resolve(tenantB).selection.getThemeId()).toBe("dark");
        expect(Object.keys(window.localStorage).sort()).toEqual([
            "webiny/dep:webiny/theme",
            "webiny/dep:webiny/theme-variables"
        ]);
    });

    it("reads a stored selection on the first resolve after a reload", () => {
        const beforeReload = createTenant(createRoot(), "a");
        ThemeFeature.resolve(beforeReload).selection.select(dark);

        const afterReload = createRoot();
        const { selection } = ThemeFeature.resolve(afterReload);

        expect(selection.getThemeId()).toBe("dark");
        expect(selection.getStoredVariables()).toEqual(dark.variables);
    });

    it("refreshes the stored variables when the theme's variables change", () => {
        const root = createRoot();
        const { selection } = ThemeFeature.resolve(root);
        selection.select(dark);

        const updated = { ...dark, variables: { ...dark.variables, "--color-new": "red" } };
        selection.select(updated);

        expect(selection.getStoredVariables()).toEqual(updated.variables);
    });

    it("removes the variables the previous write set and the next one doesn't", () => {
        const root = createRoot();
        const { writer } = ThemeFeature.resolve(root);
        const style = document.documentElement.style;

        writer.write(dark.variables);
        expect(style.getPropertyValue("--color-scheme")).toBe("dark");

        writer.write({ "--color-primary-500": "red" });
        expect(style.getPropertyValue("--color-scheme")).toBe("");
        expect(style.getPropertyValue("--color-neutral-base")).toBe("");
        expect(style.getPropertyValue("--color-primary-500")).toBe("red");
    });
});
