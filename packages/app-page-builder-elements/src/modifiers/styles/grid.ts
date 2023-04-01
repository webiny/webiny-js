import { ElementStylesModifier } from "~/types";

const grid: ElementStylesModifier = ({ element, theme }) => {
    // This modifier can only be applied to Grid page element renderer.
    if (element.type !== "grid") {
        return null;
    }

    const gridSettings = element.data?.settings?.gridSettings;
    if (!gridSettings) {
        return null;
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        if (!gridSettings[breakpointName]) {
            return returnStyles;
        }

        const columnsCount = element.data?.settings?.grid?.cellsType?.split("-")?.length || 1;
        const columnSizes: number[] =
            element.data?.settings?.grid?.columnSizes ||
            element.data?.settings?.grid?.cellsType?.split("-").map(Number); // cellsType is here for backward compatibility.
        const rowCount = element.data.settings?.grid?.rowCount || 1;

        const value = { ...gridSettings[breakpointName] };
        const cellWidthReduction = value.columnGap
            ? `${value.columnGap - value.columnGap / columnsCount}px`
            : null; // Number of pixels we need to subtract from each cell to ensure they fit in the grid with column gap

        // We need to transform gap values to pixels (e.g. "15" to "15px")
        if (value.columnGap) {
            value.columnGap = `${value.columnGap}px`;
        }
        if (value.rowGap) {
            value.rowGap = `${value.rowGap}px`;
        }

        const cellFullWidthConstrains =
            rowCount === 1 ||
            breakpointName === "mobile-landscape" ||
            breakpointName === "mobile-portrait"; // Only applies to single-row grid or on mobile view.

        // If we have flex direction set to "column" or "column-reverse",
        // we also want to apply 100% width to direct `pb-cell` elements.
        if (
            value.flexDirection !== "row" &&
            element.data?.settings?.verticalAlign?.[breakpointName] !== "stretch" &&
            cellFullWidthConstrains
        ) {
            columnSizes.forEach(
                (_, index) =>
                    (value[`& > pb-cell:nth-of-type(${columnsCount}n + ${index + 1})`] = {
                        width: "100%"
                    })
            );
        } else if (cellWidthReduction) {
            columnSizes.forEach(
                (size, index) =>
                    (value[`& > pb-cell:nth-of-type(${columnsCount}n + ${index + 1})`] = {
                        width: `calc(${(size / 12) * 100}% - ${cellWidthReduction})`
                    })
            );
        }

        return {
            ...returnStyles,
            [breakpointName]: value
        };
    }, {});
};

export const createGrid = () => grid;
