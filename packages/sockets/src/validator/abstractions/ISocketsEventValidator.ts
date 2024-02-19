import { ISocketsEvent } from "~/handler/types";
import { PartialDeep } from "type-fest";

export interface ISocketsEventValidator {
    /**
     * @throws {Error}
     */
    validate(event: PartialDeep<ISocketsEvent>): Promise<ISocketsEvent>;
}
