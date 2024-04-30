import {
    IKickOutCurrentUserUseCase,
    IKickOutCurrentUserUseCaseExecuteParams
} from "~/abstractions/IKickOutCurrentUserUseCase";
import { IGetIdentity, IGetWebsocketsContextCallable } from "~/types";
import { parseIdentifier } from "@webiny/utils";

export interface IKickOutCurrentUserUseCaseParams {
    getWebsockets: IGetWebsocketsContextCallable;
    getIdentity: IGetIdentity;
}

export class KickOutCurrentUserUseCase implements IKickOutCurrentUserUseCase {
    private readonly getWebsockets: IGetWebsocketsContextCallable;
    private readonly getIdentity: IGetIdentity;

    public constructor(params: IKickOutCurrentUserUseCaseParams) {
        this.getWebsockets = params.getWebsockets;
        this.getIdentity = params.getIdentity;
    }

    public async execute(record: IKickOutCurrentUserUseCaseExecuteParams): Promise<void> {
        const { lockedBy, id } = record;

        const websockets = this.getWebsockets();

        const { id: entryId } = parseIdentifier(id);

        const identity = this.getIdentity();

        /**
         * We do not want any errors to leak out of this method.
         * Just log the error, if any.
         */
        try {
            await websockets.send(
                { id: lockedBy.id },
                {
                    action: `lockingMechanism.entry.kickOut.${entryId}`,
                    data: {
                        record: record.toObject(),
                        user: identity
                    }
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
