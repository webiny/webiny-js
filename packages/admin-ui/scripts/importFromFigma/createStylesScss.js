const fs = require("fs");

const createStylesScss = normalizedFigmaExport => {
    // Generate `styles.scss` file.
    let stylesScss = fs.readFileSync(__dirname + "/templates/styles.scss.txt", "utf8");

    // 1. Background colors.
    {
        let currentBgColorGroup = null;
        const bgColors = normalizedFigmaExport
            .filter(item => item.type === "backgroundColor")
            .map(variable => {
                const [colorGroup] = variable.variantName.split("-");
                const cssVar = `--bg-${variable.variantName}: ${variable.hsla.h}, ${variable.hsla.s}%, ${variable.hsla.l}%;`;

                if (!currentBgColorGroup) {
                    currentBgColorGroup = colorGroup;
                    return cssVar;
                }

                if (!currentBgColorGroup || currentBgColorGroup !== colorGroup) {
                    currentBgColorGroup = colorGroup;
                    return ["", cssVar];
                }
                return cssVar;
            })
            .flat();

        stylesScss = stylesScss.replace("{BACKGROUND_COLORS}", bgColors.join("\n"));
    }

    // 2. Text colors.
    {
        let currentTextColor = null;
        const textColors = normalizedFigmaExport
            .filter(item => item.type === "textColor")
            .map(variable => {
                const [colorGroup] = variable.variantName.split("-");
                const cssVar = `--text-${variable.variantName}: ${variable.hsla.h}, ${variable.hsla.s}%, ${variable.hsla.l}%;`;

                if (!currentTextColor) {
                    currentTextColor = colorGroup;
                    return cssVar;
                }

                if (!currentTextColor || currentTextColor !== colorGroup) {
                    currentTextColor = colorGroup;
                    return ["", cssVar];
                }
                return cssVar;
            })
            .flat();

        stylesScss = stylesScss.replace("{TEXT_COLORS}", textColors.join("\n"));
    }

    // 3. Border colors.
    {
        let currentBorderColor = null;
        const borderColors = normalizedFigmaExport
            .filter(item => item.type === "borderColor")
            .map(variable => {
                const [colorGroup] = variable.variantName.split("-");
                const cssVar = `--border-${variable.variantName}: ${variable.hsla.h}, ${variable.hsla.s}%, ${variable.hsla.l}%;`;

                if (!currentBorderColor) {
                    currentBorderColor = colorGroup;
                    return cssVar;
                }

                if (!currentBorderColor || currentBorderColor !== colorGroup) {
                    currentBorderColor = colorGroup;
                    return ["", cssVar];
                }
                return cssVar;
            })
            .flat();

        stylesScss = stylesScss.replace("{BORDER_COLORS}", borderColors.join("\n"));
    }

    // 4. Border radius.
    {
        const borderRadius = normalizedFigmaExport
            .filter(item => item.type === "borderRadius")
            .map(variable => {
                return `--radius-${variable.variantName}: ${variable.resolvedValue}px;`;
            });

        stylesScss = stylesScss.replace("{BORDER_RADIUS}", borderRadius.join("\n"));
    }

    // 5. Border width.
    {
        const borderWidth = normalizedFigmaExport
            .filter(item => item.type === "borderWidth")
            .map(
                variable => `--border-width-${variable.variantName}: ${variable.resolvedValue}px;`
            );

        stylesScss = stylesScss.replace("{BORDER_WIDTH}", borderWidth.join("\n"));
    }

    // 6. Padding.
    {
        const padding = normalizedFigmaExport
            .filter(item => item.type === "padding")
            .map(variable => `--padding-${variable.variantName}: ${variable.resolvedValue}px;`);

        stylesScss = stylesScss.replace("{PADDING}", padding.join("\n"));
    }

    // 7. Elevation.
    {
        const elevation = normalizedFigmaExport
            .filter(item => item.type === "elevation")
            .map(variable => `--elevation-${variable.variantName}: ${variable.resolvedValue}px;`);

        stylesScss = stylesScss.replace("{ELEVATION}", elevation.join("\n"));
    }

    // 8. Fill.
    {
        let currentFillColor = null;
        const textColors = normalizedFigmaExport
            .filter(item => item.type === "fill")
            .map(variable => {
                const [colorGroup] = variable.variantName.split("-");
                const cssVar = `--fill-${variable.variantName}: ${variable.hsla.h}, ${variable.hsla.s}%, ${variable.hsla.l}%;`;

                if (!currentFillColor) {
                    currentFillColor = colorGroup;
                    return cssVar;
                }

                if (!currentFillColor || currentFillColor !== colorGroup) {
                    currentFillColor = colorGroup;
                    return ["", cssVar];
                }
                return cssVar;
            })
            .flat();

        stylesScss = stylesScss.replace("{FILL}", textColors.join("\n"));
    }

    // 9. Spacing.
    {
        const spacing = normalizedFigmaExport
            .filter(item => item.type === "spacing")
            .map(variable => `--spacing-${variable.variantName}: ${variable.resolvedValue}px;`);

        stylesScss = stylesScss.replace("{SPACING}", spacing.join("\n"));
    }

    // 10. Margin.
    {
        const margin = normalizedFigmaExport
            .filter(item => item.type === "margin")
            .map(variable => `--margin-${variable.variantName}: ${variable.resolvedValue}px;`);

        stylesScss = stylesScss.replace("{MARGIN}", margin.join("\n"));
    }

    return stylesScss;
};

module.exports = { createStylesScss };
