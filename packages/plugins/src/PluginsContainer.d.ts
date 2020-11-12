import { Plugin } from "./types";
export declare class PluginsContainer {
    plugins: Record<string, Plugin>;
    constructor(...args: any[]);
    byName<T extends Plugin = Plugin>(name: string): T;
    byType<T extends Plugin>(type?: string): T[];
    register(...args: any): void;
    unregister(name: string): void;
}
