/**
 * The scope class is both the prefix the CSS is scoped to and the class put on the component's
 * wrapper element. The sdk-frontend runtime derives it independently, so this rule has to stay
 * identical there — but within this package there is one copy, not one per bundler.
 */
export const scopeClassName = (componentName: string): string => {
    // Slugify to a valid CSS identifier: any run of non-alphanumerics (spaces, "/", punctuation)
    // becomes a single hyphen. Without this a name like "Testimonials with features" yields
    // "rc-testimonials with features" — three classes on the element and a descendant-combinator
    // selector in the scoped CSS, so the styles never match and the component renders unstyled.
    const slug =
        componentName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "component";

    return `rc-${slug}`;
};
