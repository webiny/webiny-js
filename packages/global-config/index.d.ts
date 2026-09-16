export interface GlobalConfig {
    /**
     * Returns the whole config, creating it with defaults if it is missing or
     * has no `id`. `isEnabled()` in @webiny/telemetry already calls it this way;
     * the overload was just missing from these types.
     */
    get(): Record<string, any>;
    get(key: string): any;
    set(key: string, value: any): void;
}

export declare const globalConfig: GlobalConfig;
