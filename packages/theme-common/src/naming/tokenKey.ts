/**
 * Immutable keys for primitives and custom semantic tokens.
 *
 * A key is assigned once, at creation, and never changes. Variable names derive from the key, so
 * renaming a token's display name is always safe and never a data migration. Canonical slots have
 * no key — their path is core-owned and serves the same purpose.
 *
 * Keys are derived deterministically from the display name rather than randomly generated, so a
 * theme created from the same input twice produces the same keys — which matters for extraction,
 * where a re-run after a failed analysis should not churn every variable name.
 */

const MAX_KEY_LENGTH = 48;

export interface CreateTokenKeyParams {
    /** Keys already in use in this document. A collision appends `-2`, `-3`, and so on. */
    existingKeys?: Iterable<string>;
}

export const slugifyTokenKey = (displayName: string): string => {
    const slug = displayName
        .normalize("NFKD")
        // Strip combining diacritical marks left behind by NFKD, so "Grün" becomes "grun".
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, MAX_KEY_LENGTH)
        .replace(/-+$/g, "");

    return slug;
};

export const createTokenKey = (
    displayName: string,
    { existingKeys }: CreateTokenKeyParams = {}
): string => {
    const base = slugifyTokenKey(displayName);
    if (!base) {
        throw new Error(
            `Cannot derive a token key from "${displayName}" — it contains no alphanumeric characters.`
        );
    }

    const taken = new Set(existingKeys ?? []);
    if (!taken.has(base)) {
        return base;
    }

    let suffix = 2;
    while (taken.has(`${base}-${suffix}`)) {
        suffix++;
    }

    return `${base}-${suffix}`;
};

const KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isValidTokenKey = (key: string): boolean => {
    return key.length > 0 && key.length <= MAX_KEY_LENGTH && KEY_PATTERN.test(key);
};
