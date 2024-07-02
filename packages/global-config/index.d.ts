export interface GlobalConfig {
    get(key: string): any;
    set(key: string, value: any): void;
}

export declare const globalConfig: GlobalConfig;
