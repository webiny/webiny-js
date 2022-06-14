import { PulumiApp } from "@webiny/pulumi-app";

type CallbackPulumiAppInput<T> = (app: PulumiApp) => T;

export type PulumiAppInput<T> = T | CallbackPulumiAppInput<T>;

export function getPulumiAppInput<T>(app: PulumiApp, input: PulumiAppInput<T>) {
    if (typeof input === "function") {
        return (input as CallbackPulumiAppInput<T>)(app);
    }

    return input;
}
