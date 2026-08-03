export type LengthUnit = "px" | "rem";

export interface ParsedLength {
    value: number;
    unit: LengthUnit;
}

/** Assumed root font size. Fluid maths works in rem, so px inputs are converted through this. */
export const DEFAULT_ROOT_FONT_SIZE = 16;

const LENGTH_PATTERN = /^(-?\d*\.?\d+)(px|rem)$/;

/** Parses a plain CSS length. Returns `null` for anything that is not a bare px or rem value. */
export const parseLength = (input: string): ParsedLength | null => {
    const match = LENGTH_PATTERN.exec(input.trim());
    if (!match) {
        return null;
    }

    const value = Number.parseFloat(match[1]);
    if (!Number.isFinite(value)) {
        return null;
    }

    return { value, unit: match[2] as LengthUnit };
};

export const toRem = (length: ParsedLength, rootFontSize = DEFAULT_ROOT_FONT_SIZE): number => {
    return length.unit === "rem" ? length.value : length.value / rootFontSize;
};

/** Rounds to 4 decimal places and trims trailing zeros, so `1.5000` prints as `1.5`. */
export const round = (value: number, precision = 4): number => {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
};

export const formatRem = (value: number): string => `${round(value)}rem`;

export const formatVw = (value: number): string => `${round(value)}vw`;
