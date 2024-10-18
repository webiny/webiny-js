import {
    marshall as baseMarshall,
    unmarshall as baseUnmarshall
} from "@webiny/aws-sdk/client-dynamodb";
import { GenericRecord } from "@webiny/cli/types";

import { AttributeValue } from "@webiny/handler-aws/types";

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
