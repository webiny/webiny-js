import WebinyError from "@webiny/error";
import { AugmentedError } from "~/types";

export class IndexSettingsGetError extends WebinyError {
    public readonly index: string;

    public constructor(error: AugmentedError, index: string) {
        super(error.message, "GET_INDEX_SETTINGS_ERROR", {
            ...error.data,
            index
        });
        this.index = index;
    }
}
