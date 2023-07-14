import {
    createAcoAppModifier as baseCreateAppModifier,
    CreateAcoAppModifierCallable
} from "@webiny/api-aco";
import { PB_PAGE_TYPE } from "~/contants";
import { PbAcoContext } from "~/types";
import { Context } from "@webiny/handler/types";

export const createAppModifier = <T extends Context = PbAcoContext>(
    cb: CreateAcoAppModifierCallable<T>
) => {
    return baseCreateAppModifier<T>(PB_PAGE_TYPE, cb);
};
