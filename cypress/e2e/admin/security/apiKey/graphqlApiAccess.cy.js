import uniqid from "uniqid";

context("Security -> API Key -> GraphQL API Access", () => {
    let apiKey;

    before(() => {
        cy.securityCreateApiKey({
            data: {
                name: uniqid("", "-api-key"),
                description: uniqid("description-"),
                permissions: [{ name: "*" }]
            }
        }).then(key => {
            apiKey = key;
        });
    });

    after(() => {
        cy.securityDeleteApiKey({
            id: apiKey.id
        });
    });

    it("should able to read from GraphQL API using API key", () => {
        return cy.securityReadRole({ slug: "full-access" }, apiKey.token).then(group => {
            assert.equal(group.name, "Full Access");
            assert.equal(group.slug, "full-access");
            assert.equal(group.description, "Grants full access to all apps.");
        });
    });

    it("should able to read from CMS Manage GraphQL API using API key", () => {
        return cy.cmsListContentModelGroup({}, apiKey.token).then(groups => {
            assert.isArray(groups);
            // eslint-disable-next-line jest/valid-expect
            expect(groups).to.have.length.of.at.least(1);
        });
    });
});
