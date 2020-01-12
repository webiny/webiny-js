/// <reference types="commodo" />
import { WithFieldsError } from "@webiny/commodo";
declare class InvalidFieldsError extends WithFieldsError {
    static from(error: typeof WithFieldsError): any;
}
export default InvalidFieldsError;
