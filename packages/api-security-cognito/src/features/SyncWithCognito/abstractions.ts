import { createAbstraction } from "@webiny/feature/api";
import type { BaseUserAttributes } from "@webiny/api-admin-users/types.js";

export interface AttributeGetter {
    (user: BaseUserAttributes): string;
}

interface CognitoConfigAutoVerify {
    email?: boolean;
}

export interface ICognitoConfig {
    region: string;
    userPoolId: string;
    updateAttributes?: Record<string, string | AttributeGetter>;

    getUsername?<
        TBaseUserAttributes extends Pick<BaseUserAttributes, "email"> = Pick<
            BaseUserAttributes,
            "email"
        >
    >(
        user: TBaseUserAttributes
    ): string;

    autoVerify?: CognitoConfigAutoVerify;
}

export const CognitoConfig = createAbstraction<ICognitoConfig>("CognitoConfig");

export namespace CognitoConfig {
    export type Interface = ICognitoConfig;
}
