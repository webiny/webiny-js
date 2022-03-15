export type Config = Record<string, any>;

interface AppConfig {
    set(config: Config): void;
    get(): Config;
    getKey<T = string>(key: string, defaultValue: T): T;
}

const deepFreeze = (obj: Record<string, any>): Record<string, any> => {
    Object.keys(obj).forEach(prop => {
        if (typeof obj[prop] === "object" && !Object.isFrozen(obj[prop])) {
            deepFreeze(obj[prop]);
        }
    });
    return Object.freeze(obj);
};

function createConfig(): AppConfig {
    let _config: Record<string, any> = {};

    return {
        set(config: Config) {
            _config = deepFreeze(config);
        },
        get() {
            return _config;
        },
        getKey(key, defaultValue) {
            return key in _config ? _config[key] : defaultValue;
        }
    };
}

export const config = createConfig();
