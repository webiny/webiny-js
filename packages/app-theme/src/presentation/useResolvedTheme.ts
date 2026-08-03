import { useMemo } from "react";
import {
    findContrastFailures,
    getTokenAtPath,
    META_EXTENSION,
    parseAlias,
    resolveDocumentModes,
    splitPath,
    type ContrastWarning,
    type ThemeMode,
    type TokenPath,
    type TokenValue
} from "@webiny/theme-common";
import type { ThemeDto } from "~/features/themeGateway/index.js";

export interface ResolvedThemeView {
    /** Resolved literal for the given mode, or `undefined` when the token failed to resolve. */
    value(path: TokenPath, mode: ThemeMode): TokenValue | undefined;
    /** Display name of the token this one points at, or `null` when it holds a literal. */
    reference(path: TokenPath, mode: ThemeMode): { name: string; path: TokenPath } | null;
    /** Contrast failures keyed by the foreground token they are attached to. */
    contrastWarnings: Map<TokenPath, ContrastWarning[]>;
}

const displayNameFor = (theme: ThemeDto, path: TokenPath): string => {
    const token = getTokenAtPath(theme.tokens, path);
    const meta = token?.$extensions?.[META_EXTENSION];
    if (meta?.displayName) {
        return meta.displayName;
    }

    const segments = splitPath(path);
    return segments[segments.length - 1] ?? path;
};

/**
 * Resolves the open draft client-side so the editor can show real colours and real warnings while
 * the user types. The same pure functions run on the API at publish, so what you see here is what
 * gets frozen — there is no second implementation to drift.
 */
export const useResolvedTheme = (theme: ThemeDto | undefined): ResolvedThemeView => {
    return useMemo(() => {
        if (!theme) {
            return {
                value: (): TokenValue | undefined => undefined,
                reference: (): { name: string; path: TokenPath } | null => null,
                contrastWarnings: new Map<TokenPath, ContrastWarning[]>()
            };
        }

        const modes = resolveDocumentModes(theme.tokens);

        const warnings = new Map<TokenPath, ContrastWarning[]>();
        for (const failure of findContrastFailures({
            light: modes.light.tokens,
            dark: modes.dark.tokens
        })) {
            const existing = warnings.get(failure.pair.foreground) ?? [];
            existing.push(failure);
            warnings.set(failure.pair.foreground, existing);
        }

        return {
            value: (path: TokenPath, mode: ThemeMode) => modes[mode].tokens.get(path)?.value,
            reference: (path: TokenPath, mode: ThemeMode) => {
                const token = getTokenAtPath(theme.tokens, path);
                if (!token) {
                    return null;
                }

                const raw =
                    mode === "dark"
                        ? (token.$extensions?.["com.webiny.modes"]?.dark ?? token.$value)
                        : token.$value;

                const target = parseAlias(raw);
                return target ? { name: displayNameFor(theme, target), path: target } : null;
            },
            contrastWarnings: warnings
        };
    }, [theme]);
};
