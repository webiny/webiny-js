import {
    createAppModifier as baseCreateAppModifier,
    CreateAppModifierCallable
} from "@webiny/api-aco/apps";
import { PB_APP_NAME } from "~/contants";
import { PbAcoContext } from "~/types";
import { Context } from "@webiny/handler/types";

export const createAppModifier = <T extends Context = PbAcoContext>(
    cb: CreateAppModifierCallable<T>
) => {
    return baseCreateAppModifier<T>(PB_APP_NAME, cb);
};
