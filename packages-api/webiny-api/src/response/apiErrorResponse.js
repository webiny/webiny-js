import _ from 'lodash';
import ApiResponse from './apiResponse';

class ApiErrorResponse extends ApiResponse {
    constructor(data = {}, message = '', errorCode = '', statusCode = ApiErrorResponse.ERROR_STATUS_CODE) {
        super(data, message, statusCode);
        this.errorCode = errorCode;
    }

    formatResponse() {
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