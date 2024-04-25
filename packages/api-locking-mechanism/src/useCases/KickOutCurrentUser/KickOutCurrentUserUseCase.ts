import {
    IKickOutCurrentUserUseCase,
    IKickOutCurrentUserUseCaseExecuteParams
} from "~/abstractions/IKickOutCurrentUserUseCase";
import { IGetWebsocketsContextCallable } from "~/types";
import { parseIdentifier } from "@webiny/utils";

export interface IKickOutCurrentUserUseCaseParams {
    getWebsockets: IGetWebsocketsContextCallable;
}

export class KickOutCurrentUserUseCase implements IKickOutCurrentUserUseCase {
    private readonly getWebsockets: IGetWebsocketsContextCallable;

    public constructor(params: IKickOutCurrentUserUseCaseParams) {
        this.getWebsockets = params.getWebsockets;
    }

    public async execute(params: IKickOutCurrentUserUseCaseExecuteParams): Promise<void> {
        const { lockedBy, id } = params;

        const websockets = this.getWebsockets();

        const { id: entryId } = parseIdentifier(id);

        /**
         * We do not want any errors to leak out of this method.
         * Just log the error, if any.
         */
        try {
            await websockets.send(
                { id: lockedBy.id },
                {
                    action: `lockingMechanism.entry.kickOut.${entryId}`
                }
            );
        } catch (ex) {
            console.error(
                `Could not send the kickOut message to a user with identity id: ${lockedBy.id}. More info in next log line.`
            );
            console.info(ex);
        }
    }
}
