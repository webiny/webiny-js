import { ContextPlugin } from "@webiny/handler";
import { AdminSettingsContext } from "~/types";
import { createStorageOperations } from "~/storage";
import { createSettingsService } from "~/services/settings";

export const createContext = () => {
    return new ContextPlugin<AdminSettingsContext>(async context => {
        /**
         * Storage operations should be created from the outside and passed into the context creation.
         * // TODO refactor at some point
         */
        const storageOperations = await createStorageOperations({
            documentClient: (context.db.driver as any).documentClient
        });

        context.settings = await createSettingsService({
            context,
            storageOperations
        });
    });
};
