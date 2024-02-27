import { ISocketsEvent, ISocketsEventData, ISocketsIncomingEvent } from "~/handler/types";

export type ISocketsEventValidatorValidateParams = ISocketsIncomingEvent;

export interface ISocketsEventValidator {
    /**
     * @throws {Error}
     */
    validate<T extends ISocketsEventData = ISocketsEventData>(
        params: ISocketsEventValidatorValidateParams
    ): Promise<ISocketsEvent<T>>;
}
