export function isMultiTenancyEnabled() {
    // This check is for backwards compatibility with pre-5.29.0 projects.
    if (process.env.WEBINY_MULTI_TENANCY === "true") {
        return true;
    }

    // For >=5.29.0 projects, check for `WCP_PROJECT_ENVIRONMENT` variable.
    return process.env.hasOwnProperty("WCP_PROJECT_ENVIRONMENT");
}
