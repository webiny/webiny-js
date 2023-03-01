import { ElementStylesModifier } from "~/types";

const gridSettings: ElementStylesModifier = ({ element, theme }) => {
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

        const columns = element.data?.settings?.grid?.cellsType?.split("-")?.length || 1;
        const columnSizes: number[] =
            element.data?.settings?.grid?.columnSizes ||
            element.data?.settings?.grid?.cellsType?.split("-");
        const rowCount = element.data.settings?.grid?.rowCount || 1;
        const value = { ...gridSettings[breakpointName] };

        if (value.columnGap) {
            value["--cellWidthOffset"] = `${value.columnGap - value.columnGap / columns}px`;
            value.columnGap = `${value.columnGap}px`;
        }

        if (value.rowGap) {
            value.rowGap = `${value.rowGap}px`;
        }

        // If we have flex direction set to "column" or "column-reverse",
        // we also want to apply 100% width to direct `pb-cell` elements
        // (only applies to single-row grid or multi-row grid on mobile).
        if (
            value.flexDirection !== "row" &&
            element.data?.settings?.verticalAlign?.[breakpointName] !== "stretch" &&
            (rowCount === 1 ||
                breakpointName === "mobile-landscape" ||
                breakpointName === "mobile-portrait")
        ) {
            columnSizes.forEach(
                (_, index) =>
                    (value[`& > pb-cell:nth-of-type(${columns}n + ${index + 1})`] = {
                        width: "100%"
                    })
            );
        } else {
            columnSizes.forEach(
                (size, index) =>
                    (value[`& > pb-cell:nth-of-type(${columns}n + ${index + 1})`] = {
                        width: `calc(${(size / 12) * 100}% - var(--cellWidthOffset, 0px))`
                    })
            );
        }

        return {
            ...returnStyles,
            [breakpointName]: value
        };
    }, {});
};

export const createGridSettings = () => gridSettings;
