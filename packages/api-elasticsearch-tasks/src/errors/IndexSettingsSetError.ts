import WebinyError from "@webiny/error";
import { AugmentedError } from "~/types";

export class IndexSettingsSetError extends WebinyError {
    public readonly index: string;

    public constructor(error: AugmentedError, index: string) {
        super(error.message, "SET_INDEX_SETTINGS_ERROR", {
            ...error.data,
            index
        });
        this.index = index;
    }
}
