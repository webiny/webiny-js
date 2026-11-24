import { ThemeVariablesWriter } from "./abstractions.js";

/**
 * The only writer to `<html>`'s inline custom properties. Callers pass the full set: the active
 * theme's variables with the brand colors from `<AdminConfig.Theme.Color />` on top.
 */
class DocumentThemeVariablesWriterImpl implements ThemeVariablesWriter.Interface {
    private appliedKeys: string[] = [];

    write(variables: Record<string, string>) {
        if (typeof document === "undefined") {
            return;
        }

        const root = document.documentElement;

        for (const key of this.appliedKeys) {
            if (!(key in variables)) {
                root.style.removeProperty(key);
            }
        }

        for (const [key, value] of Object.entries(variables)) {
            root.style.setProperty(key, value);
        }

        this.appliedKeys = Object.keys(variables);
    }
}

export const DocumentThemeVariablesWriter = ThemeVariablesWriter.createImplementation({
    implementation: DocumentThemeVariablesWriterImpl,
    dependencies: []
});
