import { expect } from "chai";
import ApiErrorResponse from "./../src/response/apiErrorResponse";

describe("ApiErrorResponse class test", function() {
    it("on construct - data, message and statusCode must be correctly set", () => {
        const response = new ApiErrorResponse(
            { test: true },
            "This is a message...",
            "WBY-ERROR",
            ApiErrorResponse.ERROR_STATUS_CODE
        );
        expect(response.getData(false).test).to.equal(true);
        expect(response.getData()).to.deep.equal({
            code: "WBY-ERROR",
            data: { test: true },
            message: "This is a message..."
        });
        expect(response.getMessage()).to.equal("This is a message...");
        expect(response.getStatusCode()).to.equal(ApiErrorResponse.ERROR_STATUS_CODE);
    });

    it("on construct - data, message and statusCode must be correctly set, even if nothing was passed on construct", () => {
        const response = new ApiErrorResponse();
        expect(response.getData(false)).to.equal(null);
        expect(response.getData()).to.deep.equal({
            code: ""
        });
        expect(response.getMessage()).to.equal("");
        expect(response.getStatusCode()).to.equal(ApiErrorResponse.ERROR_STATUS_CODE);
    });
});
