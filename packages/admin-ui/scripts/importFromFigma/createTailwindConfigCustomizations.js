const createTailwindConfigCustomizations = normalizedFigmaExport => {
    return {
        backgroundColor: normalizedFigmaExport.reduce((acc, { type, variantName }) => {
            if (type === "backgroundColor") {
                const [color, variant] = variantName.split("-");
                if (!acc[color]) {
                    acc[color] = {
                        DEFAULT: `hsl(var(--bg-${color}-default))`
                    };
                }

                acc[color][variant] = `hsl(var(--bg-${variantName}))`;
            }
            return acc;
        }, {}),
        borderColor: normalizedFigmaExport.reduce((acc, { type, variantName }) => {
            if (type === "borderColor") {
                const [color, variant] = variantName.split("-");
                if (!acc[color]) {
                    acc[color] = {
                        DEFAULT: `hsl(var(--border-${color}-default))`
                    };
                }

                acc[color][variant] = `hsl(var(--border-${variantName}))`;
            }
            return acc;
        }, {}),
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
        spacing: normalizedFigmaExport.reduce((acc, { type, variantName }) => {
            if (type === "spacing") {
                acc[variantName] = `var(--spacing-${variantName})`;
            }
            return acc;
        }, {}),
        textColor: normalizedFigmaExport.reduce((acc, { type, variantName }) => {
            if (type === "textColor") {
                const [color, variant] = variantName.split("-");
                if (!acc[color]) {
                    acc[color] = {
                        DEFAULT: `hsl(var(--text-${color}-default))`
                    };
                }

                acc[color][variant] = `hsl(var(--text-${variantName}))`;
            }
            return acc;
        }, {}),
    };
};

module.exports = { createTailwindConfigCustomizations };
