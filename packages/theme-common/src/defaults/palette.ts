/**
 * The primitive palette seeded into every new theme.
 *
 * Primitives are user-defined and freely named — this set exists only so a blank theme is complete
 * on creation. Enterprises replace it with their own palette, and the canonical slots repoint.
 *
 * The values are chosen so the default theme passes every canonical contrast pair in both light and
 * dark. `defaultTheme.test.ts` asserts that, so changing a value here without re-checking will fail
 * the build rather than ship an inaccessible default.
 */
export const DEFAULT_PALETTE: Readonly<Record<string, string>> = {
    white: "#FFFFFF",
    black: "#000000",

    "neutral-50": "#F8FAFC",
    "neutral-100": "#F1F5F9",
    "neutral-200": "#E2E8F0",
    "neutral-300": "#CBD5E1",
    "neutral-400": "#94A3B8",
    "neutral-500": "#64748B",
    "neutral-600": "#475569",
    "neutral-700": "#334155",
    "neutral-800": "#1E293B",
    "neutral-900": "#0F172A",
    "neutral-950": "#020617",

    "blue-50": "#EFF6FF",
    "blue-300": "#93C5FD",
    "blue-400": "#60A5FA",
    "blue-500": "#3B82F6",
    "blue-600": "#2563EB",
    "blue-700": "#1D4ED8",
    "blue-950": "#172554",

    "green-50": "#ECFDF5",
    "green-300": "#6EE7B7",
    "green-700": "#047857",
    "green-950": "#022C22",

    "amber-50": "#FFFBEB",
    "amber-300": "#FCD34D",
    "amber-700": "#B45309",
    "amber-950": "#451A03",

    "red-50": "#FEF2F2",
    "red-300": "#FCA5A5",
    "red-700": "#B91C1C",
    "red-950": "#450A0A"
};

export const DEFAULT_FONTS = {
    sans: {
        key: "sans",
        family: "Inter",
        /** Only the weights the default theme actually references are requested. */
        weights: [400, 500, 600, 700],
        styles: ["normal"],
        subsets: ["latin"],
        display: "swap",
        variable: true
    },
    mono: {
        key: "mono",
        family: "IBM Plex Mono",
        weights: [400, 600],
        styles: ["normal"],
        subsets: ["latin"],
        display: "swap",
        variable: false
    }
} as const;
