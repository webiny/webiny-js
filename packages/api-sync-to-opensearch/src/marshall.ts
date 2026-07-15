import {
    marshall as baseMarshall,
    unmarshall as baseUnmarshall
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

import type { AttributeValue } from "@webiny/aws-sdk/types/index.js";

export interface MarshalledValue {
    [key: string]: AttributeValue;
}

export const marshall = (value: GenericRecord): MarshalledValue => {
    if (!value) {
        return value;
    }
    return baseMarshall(value) as MarshalledValue;
};

export const unmarshall = <T>(value?: MarshalledValue): T | undefined => {
    if (!value) {
        return undefined;
    }
    /**
     * We can safely cast the return value to `T` because we are 100% positive that this is correct.
     */
    // @ts-expect-error
    return baseUnmarshall(value) as T;
};
