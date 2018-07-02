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

describe("toObject test", () => {
    test("should return simple toObject correctly", async () => {
        const userTable = new UserTable();
        expect(userTable.toObject()).toEqual(userTableObject);
    });

    test("should return complex toObject correctly", async () => {
        const companyTable = new CompanyTable();
        expect(companyTable.toObject()).toEqual(companyTableObject);

        const complexTable = new ComplexTable();
        expect(complexTable.toObject()).toEqual(complexTableObject);
    });

    test("should return complete toObject correctly", async () => {
        const completeTable = new CompleteTable();
        expect(completeTable.toObject()).toEqual(completeTableObject);
    });
});
