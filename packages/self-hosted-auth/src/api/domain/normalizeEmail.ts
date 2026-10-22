/**
 * The form an email address is stored and looked up in: trimmed and lowercased.
 *
 * Credentials and reset codes both use it. The sign-in, reset and installer forms already lowercase
 * what is typed, so a credential stored with capitals could never be signed in to. Normalizing in
 * one place also keeps `Sam@example.com` and `sam@example.com` from becoming two accounts, and the
 * reset request limit from being walked around by retyping an address with different capitals.
 */
export const normalizeEmail = (email: string): string => {
    return email.trim().toLowerCase();
};
