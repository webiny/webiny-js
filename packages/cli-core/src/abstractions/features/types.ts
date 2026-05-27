import { AppName } from "@webiny/project";

export interface IBaseAppParams {
    _: string[]; // TODO: implement this in a better way (handler method probably should have this in its context/meta data)
    app: AppName;
    env: string;
    variant?: string;
    region?: string;
}
