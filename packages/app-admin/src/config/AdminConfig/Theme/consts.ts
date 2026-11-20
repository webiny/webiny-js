/**
 * Every palette in `@webiny/admin-ui`'s `theme.css` has the same eleven shades. `0` is white and
 * `50` a near-white tint; both used to exist for `neutral` only, which made the shade vocabulary
 * palette-dependent. They are defined for all six palettes now, so one flat list covers them.
 */
export const COLOR_SHADES = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

export const COLOR_PALLETS = [
    "primary",
    "secondary",
    "neutral",
    "success",
    "warning",
    "destructive"
] as const;
