import { ISocketsEvent, ISocketsEventData, ISocketsEventPartial } from "~/handler/types";

export type ISocketsEventValidatorValidateParams = ISocketsEventPartial;

export interface ISocketsEventValidator {
    /**
     * @throws {Error}
     */
    validate<T extends ISocketsEventData = ISocketsEventData>(
        params: ISocketsEventValidatorValidateParams
    ): Promise<ISocketsEvent<T>>;
}
