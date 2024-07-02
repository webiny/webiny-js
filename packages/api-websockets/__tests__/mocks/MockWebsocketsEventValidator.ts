import { IWebsocketsEventValidator, IWebsocketsEventValidatorValidateParams } from "~/validator";
import { IWebsocketsEvent, IWebsocketsEventData } from "~/handler/types";

export class MockWebsocketsEventValidator implements IWebsocketsEventValidator {
    public async validate<T extends IWebsocketsEventData = IWebsocketsEventData>(
        input: IWebsocketsEventValidatorValidateParams
    ): Promise<IWebsocketsEvent<T>> {
        return {
            requestContext: {
                ...(input.requestContext || {})
            },
            body: input.body || JSON.stringify({})
        } as unknown as IWebsocketsEvent<T>;
    }
}
