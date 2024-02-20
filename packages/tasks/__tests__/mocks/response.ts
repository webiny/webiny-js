import {
    IResponse,
    IResponseContinueParams,
    IResponseContinueResult,
    IResponseDoneParams,
    IResponseDoneResult,
    IResponseErrorParams,
    IResponseErrorResult
} from "~/response/abstractions";
import { ITaskEvent } from "~/handler/types";
import { Response } from "~/response";

export const createMockResponseFactory = (
    params?: Partial<IResponse>
): ((event: ITaskEvent) => IResponse) => {
    const { done, error, continue: cont } = params || {};

    class MockResponse extends Response {
        public override continue(params: IResponseContinueParams): IResponseContinueResult {
            if (cont) {
                return cont(params);
            }
            return super.continue(params);
        }
        public override done(params?: IResponseDoneParams): IResponseDoneResult {
            if (done) {
                return done(params);
            }
            return super.done(params);
        }
        public override error(params: IResponseErrorParams): IResponseErrorResult {
            if (error) {
                return error(params);
            }
            return super.error(params);
        }
    }

    return (event: ITaskEvent) => {
        return new MockResponse(event);
    };
};
