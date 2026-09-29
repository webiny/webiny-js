/**
 * The key reset code rows are stored and counted under.
 *
 * Lowercased, so that the request limit cannot be walked around by retyping the same address with
 * different capitals. Only the reset table uses this: credentials are still looked up with the
 * address exactly as typed, the way `LoginUseCase` does it, so nothing here changes who can sign in
 * or under which spelling.
 */
export const normalizeResetEmail = (email: string): string => {
    return email.trim().toLowerCase();
};
