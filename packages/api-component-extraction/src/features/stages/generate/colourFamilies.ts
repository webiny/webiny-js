import type { ResolvedColour } from "~/domain/artifacts.js";

/**
 * Whether a theme token names a colour in a family that contradicts what it is used for.
 *
 * Cluster maps a measured colour to the nearest token of its own family and, failing that, of any
 * family, on the grounds that a variable survives a theme change and a hex does not. For a background
 * mapped to a text token, or text mapped to a surface, that survival is the defect: thevibe's dark
 * header background is `color.text.primary`, so changing the theme's text colour repaints the header.
 * 28 of 362 measured colours crossed that way across five sites, and Generate used 59 of the 63
 * cross-family variables it was given. These are the crossings refused: text and surface in either
 * direction, a border drawn in a text colour, and a background drawn in a border colour. A border in an
 * accent colour (`action.*`) or in the page's surface is left as it is — those plausibly mean what they
 * say.
 *
 * Background → border was added after the status-colour fix (colour-matcher-replay-result.md): with
 * status colours gone, 2424 Tulane's `#efefef` background landed on `color.border.subtle`, and
 * Freehill's `#dddacd` already had. Exact today, and repainted by anyone who changes the theme's subtle
 * border — the same consequence background → text was refused for.
 *
 * **Status colours are their own family**, and every role crossing into it is refused. `feedback.*`
 * means a message's state: info, success, warning, danger. ParkCity - Take 3's grey header and footer
 * were bound to `feedback.info.background` (pale blue) and `feedback.danger.background` (pale pink)
 * because a name test for "background" filed them as surfaces. Families are decided here by the token's
 * place in the theme, so they cannot arrive as a surface by any route: Cluster, a Plan binding, or the
 * theme fit.
 */
type Family = "status" | "text" | "surface" | "action" | "border" | "other";

/** A state colour (info, success, warning, danger): never a content colour. */
export const isStatusColour = (path: string): boolean => /^color\.feedback\./i.test(path);

const familyOf = (path: string): Family =>
    isStatusColour(path)
        ? "status"
        : /(^|\.)text(\.|$)|foreground/i.test(path)
          ? "text"
          : /(^|\.)action(\.|$)/i.test(path)
            ? "action"
            : /surface|background/i.test(path)
              ? "surface"
              : /(^|\.)border(\.|$)/i.test(path)
                ? "border"
                : "other";

export const crossesFamily = (role: ResolvedColour["role"], tokenPath: string): boolean => {
    const family = familyOf(tokenPath);
    return (
        family === "status" ||
        (role === "background" && family === "text") ||
        (role === "background" && family === "border") ||
        (role === "text" && family === "surface") ||
        (role === "border" && family === "text")
    );
};

/**
 * The role a Plan binding's target names, where it names one. Targets are the Plan model's own words
 * (`section.background`, `heading.color`, `cta`), so a target that does not say is left alone.
 */
const roleOfTarget = (target: string): ResolvedColour["role"] | null => {
    if (/background|\bbg\b|surface|fill/i.test(target)) {
        return "background";
    }
    if (/border|outline|divider/i.test(target)) {
        return "border";
    }
    if (
        /colou?r|text|heading|title|body|paragraph|label|kicker|eyebrow|caption|link|copy/i.test(
            target
        )
    ) {
        return "text";
    }
    return null;
};

/** Whether a Plan binding makes one of the refused crossings, e.g. `root.background -> color.text.primary`. */
export const bindingCrossesFamily = (binding: { target: string; token: string }): boolean => {
    if (!/^color\./.test(binding.token)) {
        return false;
    }
    const role = roleOfTarget(binding.target);
    return role !== null && crossesFamily(role, binding.token);
};
