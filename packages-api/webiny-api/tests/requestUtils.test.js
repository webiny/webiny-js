import { expect } from "chai";
import { requestUtils } from "./../src";

describe("Request utils test", () => {
    it("should return all query parameters", function() {
        const query = { a: 1, b: true, c: "string" };
        const { getQuery } = requestUtils({ query });
        expect(getQuery()).to.deep.equal(query);
    });

    it("should return query parameter by name", function() {
        const query = { a: 1, b: true, c: "string" };
        const { getQuery } = requestUtils({ query });
        expect(getQuery("c")).to.equal(query.c);
    });

    it("should return query parameter fallback value", function() {
        const query = { a: 1, b: true, c: "string" };
        const { getQuery } = requestUtils({ query });
        expect(getQuery("d", 100)).to.equal(100);
    });

    it("should return fields", function() {
        const query = { a: 1, b: true, _fields: "name" };
        const { getFields } = requestUtils({ query });
        expect(getFields()).to.equal(query._fields);
    });

    it("should return fields fallback value", function() {
        const query = { a: 1, b: true };
        const { getFields } = requestUtils({ query });
        expect(getFields("id,email")).to.equal("id,email");
    });

    it("should return all filters", function() {
        const query = { a: 1, b: true, _fields: "name" };
        const { getFilters } = requestUtils({ query });
        expect(getFilters()).to.deep.equal({ a: 1, b: true });
    });

    it("should return sorters", function() {
        const query = { _sort: "-name,+createdOn" };
        const { getSorters } = requestUtils({ query });
        expect(getSorters()).to.deep.equal([["name", -1], ["createdOn", 1]]);
    });

    it("should return sorters fallback value", function() {
        const { getSorters } = requestUtils({ query: {} });
        expect(getSorters([["createdOn", -1]])).to.deep.equal([["createdOn", -1]]);
    });

    it("should return sorters fallback value", function() {
        const { getSorters } = requestUtils({ query: { _sort: 150 } });
        expect(getSorters([["createdOn", -1]])).to.deep.equal([["createdOn", -1]]);
    });

    it("should return page", function() {
        const { getPage } = requestUtils({ query: { _page: 3 } });
        expect(getPage()).to.equal(3);
    });

    it("should return page fallback value", function() {
        const { getPage } = requestUtils({ query: { _page: false } });
        expect(getPage(2)).to.equal(2);
    });

    it("should return perPage", function() {
        const { getPerPage } = requestUtils({ query: { _perPage: 25 } });
        expect(getPerPage()).to.equal(25);
    });

    it("should return perPage fallback value", function() {
        const { getPerPage } = requestUtils({ query: {} });
        expect(getPerPage(10)).to.equal(10);
    });

    it("should return perPage fallback value", function() {
        const { getPerPage } = requestUtils({ query: { _perPage: true } });
        expect(getPerPage(10)).to.equal(10);
    });

    it("should return body value", function() {
        const { getBody } = requestUtils({ body: { name: "test" } });
        expect(getBody()).to.deep.equal({ name: "test" });
    });

    it("should return empty body value", function() {
        const { getBody } = requestUtils({});
        expect(getBody()).to.deep.equal({});
    });
});
