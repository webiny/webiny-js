/**
 * `@webiny/theme-common` — the shared design-token domain for the Webiny Theme app.
 *
 * Consumed by the API (publish-time alias resolution and artifact generation), Admin (validation,
 * swatches, inline warnings), the frontend SDK (payload typing) and the Tailwind adapter. It holds
 * no I/O and no framework code: everything here is a pure function over a token document.
 */

export * from "./dtcg/types.js";
export * from "./dtcg/guards.js";
export * from "./dtcg/traverse.js";
export * from "./dtcg/schema.js";
export * from "./dtcg/edit.js";

export * from "./canonical/index.js";

export * from "./naming/cssVariable.js";
export * from "./naming/tokenKey.js";

export * from "./resolve/alias.js";
export * from "./resolve/errors.js";

export * from "./fluid/length.js";
export * from "./fluid/clamp.js";
export * from "./fluid/ramp.js";

export * from "./a11y/color.js";
export * from "./a11y/contrast.js";
export * from "./a11y/zoom.js";

export * from "./policy/types.js";
export * from "./theme/settings.js";
export * from "./validate/publish.js";
export * from "./snapshot.js";
export * from "./artifacts/index.js";

export * from "./defaults/palette.js";
export * from "./defaults/defaultTheme.js";
