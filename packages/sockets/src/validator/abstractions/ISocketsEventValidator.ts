import { ISocketsEvent, ISocketsEventData } from "~/handler/types";
import { PartialDeep } from "type-fest";

export type ISocketsEventValidatorValidateParams = PartialDeep<ISocketsEvent>;

export interface ISocketsEventValidator {
    /**
     * @throws {Error}
     */
    validate<T extends ISocketsEventData = ISocketsEventData>(
        params: ISocketsEventValidatorValidateParams
    ): Promise<ISocketsEvent<T>>;
}
