import { DEFAULTS } from "./defaults.js";

// We don't need tokens that end with `-a{one or two numbers}` because they are used for
// alpha colors. We don't need these because we can use the /alpha function in Tailwind CSS.
const isColorWithAlpha = variantName => {
    return variantName.match(/^.*-a\d{1,2}$/);
};

const createTailwindConfigTheme = normalizedFigmaExport => {
    return {
        animation: {
            "accordion-down": "accordion-down 0.2s ease-out",
            "accordion-up": "accordion-up 0.2s ease-out",
            "collapsible-down": "collapsible-down 0.2s ease-out",
            "collapsible-up": "collapsible-up 0.2s ease-out",
            "skeleton-pulse": "skeleton-pulse 1400ms ease-in-out infinite"
        },
        backgroundColor: normalizedFigmaExport.reduce(
            (acc, { type, variantName }) => {
                if (type === "backgroundColor") {
                    if (isColorWithAlpha(variantName)) {
                        return acc;
                    }

                    const [, color, variant] = variantName.match("(.*?)-(.*)");

                    if (!acc[color]) {
                        acc[color] = {
                            DEFAULT: `hsl(var(--bg-${color}-default))`
                        };
                    }

                    acc[color][variant] = `hsl(var(--bg-${variantName}))`;
                }
                return acc;
            },
            { ...DEFAULTS.COLORS }
        ),
        borderColor: normalizedFigmaExport.reduce(
            (acc, { type, variantName }) => {
                if (type === "borderColor") {
                    const [color, ...variantParts] = variantName.split("-");
                    const variantKey = variantParts.join("-") || "DEFAULT";

                    if (!acc[color]) {
                        acc[color] = {
                            DEFAULT: `hsl(var(--border-${color}-default))`
                        };
                    }

                    acc[color][variantKey] = `hsl(var(--border-${variantName}))`;
                }
                return acc;
            },
            { ...DEFAULTS.COLORS }
        ),
        borderRadius: normalizedFigmaExport.reduce((acc, { type, variantName }) => {
            if (type === "borderRadius") {
                acc[variantName] = `var(--radius-${variantName})`;
            }
            return acc;
        }, {}),
        borderWidth: normalizedFigmaExport.reduce((acc, { type, variantName }) => {
            if (type === "borderWidth") {
                acc[variantName] = `var(--border-width-${variantName})`;
            }
            return acc;
        }, {}),
        fill: normalizedFigmaExport.reduce(
            (acc, { type, variantName }) => {
                if (type === "fill") {
                    if (isColorWithAlpha(variantName)) {
                        return acc;
                    }
                    const [color, variant] = variantName.split("-");
                    if (!acc[color]) {
                        acc[color] = {
                            DEFAULT: `hsl(var(--fill-${color}))`
                        };
                    }

                    // `variant || color` was needed because we have some colors that don't have variants.
                    // Like, `destructive` only has `destructive` variant. No `muted`, `strong`, etc.
                    acc[color][variant || color] = `hsl(var(--fill-${variantName}))`;
                }
                return acc;
            },
            { ...DEFAULTS.COLORS }
        ),
        fontSize: normalizedFigmaExport.reduce(
            (acc, { type, variantName }) => {
                if (type === "textFont") {
                    if (!variantName.startsWith("font-size-")) {
                        return acc;
                    }

                    const size = variantName.replace("font-size-", "");
                    acc[size] = [
                        `var(--text-${size})`,
                        {
                            lineHeight: `var(--text-${size}-leading)`,
                            letterSpacing: `var(--text-${size}-tracking)`
                        }
                    ];

                    return acc;
                }

                return acc;
            },
            // On top of what will be imported from Figma, we also add the default heading sizes.
            [1, 2, 3, 4, 5, 6].reduce((acc, lvl) => {
                acc[`h${lvl}`] = [
                    `var(--text-h${lvl})`,
                    {
                        lineHeight: `var(--text-h${lvl}-leading)`,
                        letterSpacing: `var(--text-h${lvl}-tracking)`,
                        fontWeight: `var(--text-h${lvl}-weight)`
                    }
                ];
                return acc;
            }, {})
        ),
        fontWeight: normalizedFigmaExport.reduce((acc, { type, variantName }) => {
            if (type === "textFont") {
                if (!variantName.startsWith("font-weight-")) {
                    return acc;
                }

                const weight = variantName.replace("font-weight-", "");
                acc[weight] = `var(--font-weight-${weight})`;

                return acc;
            }

            return acc;
        }, {}),
        keyframes: {
            "accordion-down": {
                from: { height: "0" },
                to: { height: "var(--radix-accordion-content-height)" }
            },
            "accordion-up": {
                from: { height: "var(--radix-accordion-content-height)" },
                to: { height: "0" }
            },
            "collapsible-down": {
                from: { height: "0" },
                to: { height: "var(--radix-collapsible-content-height)" }
            },
            "collapsible-up": {
                from: { height: "var(--radix-collapsible-content-height)" },
                to: { height: "0" }
            },
            "skeleton-pulse": {
                "0%, 100%": { backgroundColor: "hsl(var(--bg-neutral-dimmed))" },
                "50%": { backgroundColor: "hsl(var(--bg-neutral-muted))" }
            }
        },
        margin: normalizedFigmaExport.reduce((acc, { type, variantName }) => {
            if (type === "margin") {
                acc[variantName] = `var(--margin-${variantName})`;
            }
            return acc;
        }, {}),
        padding: normalizedFigmaExport.reduce((acc, { type, variantName }) => {
            if (type === "padding") {
                acc[variantName] = `var(--padding-${variantName})`;
            }
            return acc;
        }, {}),
        ringColor: normalizedFigmaExport.reduce(
            (acc, { type, variantName }) => {
                if (type === "ringColor") {
                    if (isColorWithAlpha(variantName)) {
                        return acc;
                    }

                    const [color, variant] = variantName.split("-");
                    if (!acc[color]) {
                        acc[color] = {
                            DEFAULT: `hsl(var(--ring-${color}-default))`
                        };
                    }

                    acc[color][variant] = `hsl(var(--ring-${variantName}))`;
                }
                return acc;
            },
            { ...DEFAULTS.COLORS }
        ),
        ringWidth: normalizedFigmaExport.reduce((acc, { type, variantName }) => {
            if (type === "ringWidth") {
                acc[variantName] = `var(--ring-width-${variantName})`;
            }
            return acc;
        }, {}),
        shadow: normalizedFigmaExport.reduce((acc, { type, variantName }) => {
            if (type === "shadow") {
                acc[variantName] = `var(--shadow-${variantName})`;
            }
            return acc;
        }, {}),
        spacing: normalizedFigmaExport.reduce(
            (acc, { type, variantName }) => {
                if (type === "spacing") {
                    acc[variantName] = `var(--spacing-${variantName})`;
                }
                return acc;
            },
            {
                // Custom sidebar-related variables.
                "sidebar-collapsed": "var(--spacing-sidebar-collapsed)",
                "sidebar-expanded": "var(--spacing-sidebar-expanded)",
                // Custom main content-related variables.
                "main-content": "var(--spacing-main-content)"
            }
        ),
        textColor: normalizedFigmaExport.reduce(
            (acc, { type, variantName }) => {
                if (type === "textColor") {
                    if (isColorWithAlpha(variantName)) {
                        return acc;
                    }

                    const [color, ...variantParts] = variantName.split("-");
                    const variant = variantParts.join("-");
                    if (!acc[color]) {
                        acc[color] = {
                            DEFAULT: `hsl(var(--text-${color}-default))`
                        };
                    }

                    acc[color][variant] = `hsl(var(--text-${variantName}))`;
                }
                return acc;
            },
            { ...DEFAULTS.COLORS }
        ),
        zIndex: {
            5: 5,
            15: 15,
            25: 25,
            35: 35,
            45: 45
        }
    };
};

export { createTailwindConfigTheme };
