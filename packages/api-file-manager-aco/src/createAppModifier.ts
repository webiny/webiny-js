import {
    createAcoAppModifier as baseCreateAppModifier,
    CreateAcoAppModifierCallable
} from "@webiny/api-aco";
import { FM_FILE_TYPE } from "~/contants";
import { FmAcoContext } from "~/types";
import { Context } from "@webiny/handler/types";

export const createAppModifier = <T extends Context = FmAcoContext>(
    cb: CreateAcoAppModifierCallable<T>
) => {
    return baseCreateAppModifier<T>(FM_FILE_TYPE, cb);
};
