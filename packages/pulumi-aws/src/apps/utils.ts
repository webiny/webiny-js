import { ApplicationContext, PulumiApp } from "@webiny/pulumi-sdk";

type InputFcn<T> = (ctx: ApplicationContext) => T;

export type AppInput<T> = T | InputFcn<T>;

export function getAppInput<T>(app: PulumiApp, input: AppInput<T>) {
    if (typeof input === "function") {
        return (input as InputFcn<T>)(app.ctx);
    }

    return input;
}
