import { expect } from "chai";
import ApiResponse from "./../src/response/apiResponse";

describe("ApiResponse class test", function() {
    it("setMessage/getMessage must work correctly", () => {
        const response = new ApiResponse();
        expect(response.getMessage()).to.equal("");
        response.setMessage("Test...");
        expect(response.getMessage()).to.equal("Test...");
    });

    it("setStatusCode/getStatusCode must work correctly", () => {
        const response = new ApiResponse();
        expect(response.getStatusCode()).to.equal(200);
        response.setStatusCode(404);
        expect(response.getStatusCode()).to.equal(404);
    });

    it("setData/getData must work correctly", () => {
        const response = new ApiResponse();
        expect(response.getData()).to.deep.equal({ data: null });
        expect(response.getData(false)).to.equal(null);
        response.setData(true);
        expect(response.getData(false)).to.equal(true);
        expect(response.getData()).to.deep.equal({ data: true });
    });

    it("on construct - data, message and statusCode must be correctly set", () => {
        const response = new ApiResponse({ test: true }, "This is a message...", 404);
        expect(response.getData(false).test).to.equal(true);
        expect(response.getData()).to.deep.equal({
            data: { test: true },
            message: "This is a message..."
        });
        expect(response.getMessage()).to.equal("This is a message...");
        expect(response.getStatusCode()).to.equal(404);
    });
});
