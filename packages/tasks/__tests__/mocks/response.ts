import { ResponseManager } from "~/manager/ResponseManager";
import {
    IResponseManager,
    IResponseManagerContinue,
    IResponseManagerContinueParams,
    IResponseManagerDone,
    IResponseManagerDoneParams,
    IResponseManagerError,
    IResponseManagerErrorParams,
    TaskResponseStatus
} from "~/types";

export const createMockResponseManager = (params?: Partial<IResponseManager>): IResponseManager => {
    const { done, error, continue: cont } = params || {};

    class MockResponseManager extends ResponseManager {
        public continue(params: IResponseManagerContinueParams): IResponseManagerContinue {
            if (cont) {
                return cont(params);
            }
            return {
                ...params,
                id: params.task.id,
                status: TaskResponseStatus.CONTINUE
            };
        }
        public done(params: IResponseManagerDoneParams): IResponseManagerDone {
            if (done) {
                return done(params);
            }
            return {
                ...params,
                id: params.task.id,
                status: TaskResponseStatus.DONE
            };
        }
        public error(params: IResponseManagerErrorParams): IResponseManagerError {
            if (error) {
                return error(params);
            }
            return {
                ...params,
                id: params.task.id,
                status: TaskResponseStatus.ERROR
            };
        }
    }

    return new MockResponseManager();
};
