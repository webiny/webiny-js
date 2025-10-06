import { EnvConfig as Abstraction } from "./abstractions.js";

export class DefaultEnvConfig implements Abstraction.Interface {
    private readonly env: Abstraction.Config;

    constructor(env: Abstraction.Config) {
        this.env = env;
    }

    public get<K extends keyof Abstraction.Config>(
        key: K,
        defaultValue?: Abstraction.Config[K]
    ): Abstraction.Config[K] {
        const rawValue = this.env[key];

        if ((rawValue === undefined || rawValue === null) && defaultValue !== undefined) {
            return defaultValue;
        }

        return rawValue;
    }
}
