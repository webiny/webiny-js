import { ISocketsEventValidator, ISocketsEventValidatorValidateParams } from "~/validator";
import { ISocketsEvent, ISocketsEventData } from "~/handler/types";

export class MockSocketsEventValidator implements ISocketsEventValidator {
    public async validate<T extends ISocketsEventData = ISocketsEventData>(
        input: ISocketsEventValidatorValidateParams
    ): Promise<ISocketsEvent<T>> {
        return {
            requestContext: {
                ...(input.requestContext || {})
            },
            data: {
                ...(input.data || {})
            }
        } as unknown as ISocketsEvent<T>;
    }
}
