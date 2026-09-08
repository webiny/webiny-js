/**
 * Build param written by `<SelfHostedAuth cliPasswordReset={...} />` and read by the API when
 * deciding whether to expose the CLI reset mutation. Named here rather than spelled out on both
 * sides, so the config and the API cannot disagree about it.
 *
 * Absent means enabled, and only an explicit `false` turns it off. Opt-out rather than opt-in:
 * the escape hatch is most wanted by whoever has not thought about it, and a project configured
 * before this flag existed keeps it.
 *
 * This flag is NOT what makes the mutation safe, and nothing should be relaxed on the assumption
 * that it is. The mutation is unauthenticated; the signing secret is the only thing standing
 * between a caller and an arbitrary password write, and it already permits minting a login token
 * for any user, so the endpoint grants nothing a leaked secret did not already grant. The flag
 * exists as a kill switch for a flaw in `verifyCliResetToken` (a dropped audience check, a
 * widened `algorithms` list) and as an answer for deployments that must be able to state no such
 * endpoint exists. Keep the verification strict on its own merits.
 */
export const CLI_PASSWORD_RESET_BUILD_PARAM = "SelfHostedAuthCliPasswordReset";

/**
 * Reads the flag the way both the API and the CLI need to read it. Only an explicit `false`
 * (boolean or the string a build param may serialize to) turns the feature off.
 */
export const isCliPasswordResetEnabled = (value: boolean | string | null | undefined): boolean => {
    return value !== false && value !== "false";
};
