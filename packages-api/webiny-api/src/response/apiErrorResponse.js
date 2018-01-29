// @flow
import _ from "lodash";
import ApiResponse from "./apiResponse";

class ApiErrorResponse extends ApiResponse {
    static ERROR_STATUS_CODE: number;

    data: mixed;
    message: string;
    errorCode: string;
    statusCode: number;

    constructor(
        data: mixed = null,
        message: string = "",
        errorCode: string = "",
        statusCode: number = ApiErrorResponse.ERROR_STATUS_CODE
    ) {
        super(data, message, statusCode);
        this.errorCode = errorCode;
    }

    formatResponse(): Object {
        const data = super.formatResponse();
        data.code = this.errorCode;
        if (_.isEmpty(data.data)) {
            delete data.data;
        }

        return data;
    }
}

ApiErrorResponse.ERROR_STATUS_CODE = 404;

export default ApiErrorResponse;
