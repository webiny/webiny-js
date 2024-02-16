import { ISocketsEvent } from "~/handler/types";

export interface ISocketsEventValidator {
    /**
     * @throws {Error}
     */
    validate(event: Partial<ISocketsEvent>): Promise<ISocketsEvent>;
}
