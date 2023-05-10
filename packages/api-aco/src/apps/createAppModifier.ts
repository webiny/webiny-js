import { Context } from "@webiny/handler/types";
import {
    AcoAppModifierPlugin,
    AcoAppModifierPluginParamsCallable
} from "~/apps/AcoAppModifierPlugin";
import { AcoContext } from "~/types";

export type CreateAppModifierCallable<T extends Context = AcoContext> = AcoAppModifierPluginParamsCallable<T>

export const createAppModifier = <T extends Context = AcoContext>(
    name: string,
    cb: CreateAppModifierCallable<T>
) => {
    return AcoAppModifierPlugin.create<T>({
        name,
        cb
    });
};
