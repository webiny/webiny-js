import { createStorerAfterEachPluginWithName } from "~/resolver/plugins/StorerAfterEachPlugin.js";
import { shouldBeHandled } from "./shouldBeHandled.js";
import { convertException } from "@webiny/utils";
import type { IDeleteUser } from "~/resolver/recordTypes/users/types.js";

export interface IDeleteUserOnDeletePluginParams {
    deleteUser: IDeleteUser;
}

export const createUserOnDeletePlugin = (params: IDeleteUserOnDeletePluginParams) => {
    const { deleteUser } = params;

    return createStorerAfterEachPluginWithName("users.onDelete", {
        canHandle: params => {
            const { command } = params;
            if (command !== "delete") {
                return false;
            }
            return shouldBeHandled(params);
        },
        handle: async params => {
            const { item } = params;
            /**
             * We are 100% positive that the key exists here because canHandle would not allow for handle to be called.
             */
            // @ts-expect-error
            const username = item.data.email as string;
            try {
                await deleteUser.handle({
                    target: params.target,
                    username
                });
            } catch (ex) {
                console.error("Error while handling users onDelete plugin.");
                console.log(convertException(ex));
            }
        }
    });
};
