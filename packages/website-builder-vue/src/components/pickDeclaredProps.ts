/**
 * Keeps the renderer props a component declares. Vue turns an undeclared prop into an HTML
 * attribute on the component's root element (`breakpoint="desktop"`, `inputs="[object Object]"`).
 * A functional component has no props declaration and receives every prop, so it gets them all.
 */
export function pickDeclaredProps(component: unknown, props: Record<string, unknown>) {
    if (typeof component === "function") {
        return props;
    }

    const options = component as { props?: string[] | Record<string, unknown> };
    const declared = options.props;
    if (!declared) {
        return {};
    }

    const names = Array.isArray(declared) ? declared : Object.keys(declared);
    const picked: Record<string, unknown> = {};
    for (const name of names) {
        if (name in props) {
            picked[name] = props[name];
        }
    }
    return picked;
}
