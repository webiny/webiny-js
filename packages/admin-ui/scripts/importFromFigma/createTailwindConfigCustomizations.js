const createTailwindConfigCustomizations = normalizedFigmaExport => {
    return {
        backgroundColor: normalizedFigmaExport.reduce((acc, { type, variantName }) => {
            if (type === "backgroundColor") {
                const [color, variant] = variantName.split("-");
                if (!acc[color]) {
                    acc[color] = {
                        DEFAULT: `var(--bg-${color}-default)`
                    };
                }

                acc[color][variant] = `var(--bg-${variantName})`;
            }
            return acc;
        }, {}),
        borderColor: normalizedFigmaExport.reduce((acc, { type, variantName }) => {
            if (type === "borderColor") {
                const [color, variant] = variantName.split("-");
                if (!acc[color]) {
                    acc[color] = {
                        DEFAULT: `var(--border-${color}-default)`
                    };
                }

                acc[color][variant] = `var(--border-${variantName})`;
            }
            return acc;
        }, {}),
        textColor: normalizedFigmaExport.reduce((acc, { type, variantName }) => {
            if (type === "textColor") {
                const [color, variant] = variantName.split("-");
                if (!acc[color]) {
                    acc[color] = {
                        DEFAULT: `var(--text-${color}-default)`
                    };
                }

                acc[color][variant] = `var(--text-${variantName})`;
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
        }, {})
    };
};

module.exports = { createTailwindConfigCustomizations };
