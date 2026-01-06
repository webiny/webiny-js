import { createAbstraction } from "@webiny/feature/api";
import type { BaseUserAttributes } from "@webiny/api-core/types/users.js";

export interface AttributeGetter {
    (user: BaseUserAttributes): string;
}

export interface ICognitoConfig {
    region: string;
    userPoolId: string;
}

export const CognitoConfig = createAbstraction<ICognitoConfig>("CognitoConfig");

export namespace CognitoConfig {
    export type Interface = ICognitoConfig;
}
