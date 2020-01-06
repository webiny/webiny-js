import { Plugin } from "./types";
export declare const registerPlugins: (...args: any) => void;
export declare const getPlugins: (type?: string) => Plugin[];
export declare const getPlugin: (name: string) => Plugin;
export declare const unregisterPlugin: (name: string) => void;
