/**
 * The pathname rule of the admin SEO group (`PATHNAME_REGEX` in
 * `packages/app-website-builder/src/presentation/pages/PageEditor/PageSettings/groups/SeoSettingsGroup.ts`),
 * copied here, not imported (the API must not depend on admin code). An empty string passes the
 * admin form (it is optional) but is rejected here: the model must send `null` to clear the key.
 */
const PATHNAME_REGEX = new RegExp(
    `^\\/(?:[a-zA-Z0-9._~:@!$&'()*+,;=%/-])*(?:\\?[a-zA-Z0-9._~:@!$&'()*+,;=?/%#[\\]-]*)?(?:#[a-zA-Z0-9._~:@!$&'()*+,;=?/%#[\\]-]*)?$`
);

/**
 * The admin rule lets `//host` through (its path class includes `/`), and a protocol-relative URL
 * is an external URL, so it is rejected on top of the copied rule.
 */
const isPathname = (value: unknown): boolean => {
    return typeof value === "string" && !value.startsWith("//") && PATHNAME_REGEX.test(value);
};

/**
 * Whether `value` is acceptable for the writable page path (R172). The page model stores
 * `properties` as JSON and nothing type-checks it, so the editor does before writing. The title is
 * required and never cleared; the SEO text fields accept `null` (the key is removed); the canonical
 * URL must also be a pathname (`/path`, the admin rule); the SEO flags are booleans. Any other path is not writable. Pure.
 */
export const isWbPageEditorValue = (path: string, value: unknown): boolean => {
    switch (path) {
        case "properties.title":
            return typeof value === "string" && value.trim() !== "";
        case "properties.seo.title":
        case "properties.seo.description":
            return value === null || typeof value === "string";
        case "properties.seo.canonicalUrl":
            return value === null || isPathname(value);
        case "properties.seo.noIndex":
        case "properties.seo.noFollow":
            return typeof value === "boolean";
        default:
            return false;
    }
};

/** What the model should send for a writable page path, for the error text. Pure. */
export const describeWbPageEditorValue = (path: string): string => {
    switch (path) {
        case "properties.title":
            return "a non-empty string";
        case "properties.seo.canonicalUrl":
            return "a pathname such as /path, or null";
        case "properties.seo.noIndex":
        case "properties.seo.noFollow":
            return "true or false";
        default:
            return "a string or null";
    }
};
