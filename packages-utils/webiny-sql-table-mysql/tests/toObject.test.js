import { assert } from "chai";
import {
    UserTable,
    userTableObject,
    CompanyTable,
    companyTableObject,
    ComplexTable,
    complexTableObject,
    CompleteTable,
    completeTableObject
} from "./tables";

describe("toObject test", function() {
    it("should return simple toObject correctly", async () => {
        const user = new UserTable();
        assert.deepEqual(user.toObject(), userTableObject);
    });

    it("should return complex toObject correctly", async () => {
        const company = new CompanyTable();
        assert.deepEqual(company.toObject(), companyTableObject);

        const complex = new ComplexTable();
        assert.deepEqual(complex.toObject(), complexTableObject);
    });

    it("should return complete toObject correctly", async () => {
        const complex = new CompleteTable();
        assert.deepEqual(complex.toObject(), completeTableObject);
    });
});
