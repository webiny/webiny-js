export interface GetSettingsParams {
    // Also the entries whose end date has passed; the settings page always asks for them (R317).
    includeExpired: boolean;
}
