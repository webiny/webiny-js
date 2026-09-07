/**
 * Build param written by `<SelfHostedAuth cliPasswordReset={...} />` and read by the API when
 * deciding whether to expose the CLI reset mutation. Named here rather than spelled out on both
 * sides, so the config and the API cannot disagree about it.
 *
 * Absent means enabled: a project configured before this flag existed keeps the escape hatch.
 */
export const CLI_PASSWORD_RESET_BUILD_PARAM = "SelfHostedAuthCliPasswordReset";

/**
 * Reads the flag the way both the API and the CLI need to read it. Only an explicit `false`
 * (boolean or the string a build param may serialize to) turns the feature off.
 */
export const isCliPasswordResetEnabled = (value: boolean | string | null | undefined): boolean => {
    return value !== false && value !== "false";
};
