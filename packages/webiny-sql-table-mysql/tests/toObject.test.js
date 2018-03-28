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
        const userTable = new UserTable();
        assert.deepEqual(userTable.toObject(), userTableObject);
    });

    it("should return complex toObject correctly", async () => {
        const companyTable = new CompanyTable();
        assert.deepEqual(companyTable.toObject(), companyTableObject);

        const complexTable = new ComplexTable();
        assert.deepEqual(complexTable.toObject(), complexTableObject);
    });

    it("should return complete toObject correctly", async () => {
        const completeTable = new CompleteTable();
        assert.deepEqual(completeTable.toObject(), completeTableObject);
    });
});
