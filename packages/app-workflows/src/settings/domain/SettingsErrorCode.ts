// The codes `GraphQLOperationError.code` carries for the settings operations (R317).
export const SettingsErrorCode = {
    Validation: "Workflows/Settings/Validation",
    Persistence: "Workflows/Settings/Persistence",
    NotAuthorized: "Workflows/NotAuthorized",
    NotAuthenticated: "Workflows/NotAuthenticated"
} as const;
