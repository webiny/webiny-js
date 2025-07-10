import { createStorerAfterEachPluginWithName } from "~/resolver/plugins/StorerAfterEachPlugin.js";
import { shouldBeHandled } from "./shouldBeHandled.js";
import { convertException } from "@webiny/utils";
import type { ICopyUser } from "~/resolver/recordTypes/users/types.js";

export interface ICreateUserOnPutPluginParams {
    copyUser: ICopyUser;
}

export const createUserOnPutPlugin = (params: ICreateUserOnPutPluginParams) => {
    const { copyUser } = params;

    return createStorerAfterEachPluginWithName("users.onPut", {
        canHandle: params => {
            const { command } = params;
            if (command !== "put") {
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
                await copyUser.handle({
                    target: params.target,
                    source: params.source,
                    username
                });
            } catch (ex) {
                console.error("Error while handling users onPut plugin.");
                console.log(convertException(ex));
            }
        }
    });
};
