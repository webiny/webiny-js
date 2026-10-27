import React from "react";

/**
 * Stands in for a `@webiny/icons` svg import under vitest.
 *
 * `import { ReactComponent as Icon } from "@webiny/icons/foo.svg"` is resolved by a bundler plugin
 * in a real build and by nothing at all in vitest. Without this, every icon in the tree —
 * including the ones inside `@webiny/admin-ui`, such as the accordion chevron and the tag dismiss
 * button — resolves to `undefined` and React throws "Element type is invalid" mid-render. Those
 * thrown messages land in `container.textContent`, so a missing svg loader silently corrupts
 * assertions that have nothing to do with icons.
 *
 * Aliased for `@webiny/icons` only, deliberately: a project-local `.svg` imported for its URL still
 * resolves the way Vite normally resolves an asset.
 *
 * Renders an empty `<svg>` and forwards props, so a component that sets a class or a size on the
 * icon still behaves. It deliberately renders no glyph: the point is that the surrounding markup
 * and copy are testable, not that the artwork is.
 */
const SvgStub = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
    <svg ref={ref} aria-hidden={"true"} {...props} />
));

SvgStub.displayName = "SvgStub";

export const ReactComponent = SvgStub;
export default SvgStub;
