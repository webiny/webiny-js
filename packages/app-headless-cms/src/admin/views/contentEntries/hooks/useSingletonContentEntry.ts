import { useContext } from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { SingletonContentEntryContext } from "../ContentEntry/SingletonContentEntryContext";

export const useSingletonContentEntry = makeDecoratable(() => {
    const context = useContext(SingletonContentEntryContext);
    if (!context) {
        throw Error(
            `useSingletonContentEntry() hook can only be used within the SingletonContentEntryContext provider.`
        );
    }
    return context;
});
