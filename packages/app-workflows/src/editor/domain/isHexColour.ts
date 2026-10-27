const HEX_COLOUR = /^#[0-9A-Fa-f]{6}$/;

// A custom colour is `#RRGGBB` (R273).
export const isHexColour = (value: string): boolean => {
    return HEX_COLOUR.test(value);
};
