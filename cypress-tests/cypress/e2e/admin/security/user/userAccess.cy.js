import uniqid from "uniqid";

context("Security Users", () => {
    it('should verify user access for a "full-access" user', () => {
        let fullAccessGroupUser;
        let password = "12345678";
        // Create a user with `full-access` group

        
        cy.securityReadRole({ slug: "full-access" }).then(group => {
            return cy
                .securityCreateUser({
                    data: {
                        email: uniqid("", "@gmail.com"),
                        firstName: uniqid("first name-"),
                        lastName: uniqid("last name-"),
                        password,
                        groups: [group.id]
                    }
                })
                .then(user => {
                    fullAccessGroupUser = user;
                    // Login with new user
                    cy.login({ username: fullAccessGroupUser.email, password });
                    cy.visit("/");
                    // Verify the access
                    cy.findByText(`Hi ${user.firstName} ${user.lastName}!`).should("be.visible");
                    cy.findByText(/To get started - pick one of the actions below:/i).should(
                        "be.visible"
                    );

                    // Should have Page Builder card
                    cy.findByTestId("admin-welcome-screen-widget-page-builder").within(() => {
                        cy.findByText("Page Builder").should("be.visible");
                        cy.findByText(/Build a new Page/i).should("be.visible");
                    });

                    // Should have Headless CMS card
                    cy.findByTestId("admin-welcome-screen-widget-headless-cms").within(() => {
                        cy.findByText("Headless CMS").should("be.visible");
                        cy.findByText(/New content model/i).should("be.visible");
                    });

                    // Delete user
                    
                    cy.securityDeleteUser({
                        id: fullAccessGroupUser.id
                    }).then(data => assert.isTrue(data));
                });
        });
    });

    // TODO - fix this test (FM issue?)
    it.skip('should verify user access for a "anonymous" user', () => {
        let password = "12345678";
        // Create a user with `full-access` group
        
        cy.securityReadRole({ slug: "anonymous" }).then(group => {
            return cy
                .securityCreateUser({
                    data: {
                        email: uniqid("", "@gmail.com"),
                        firstName: uniqid("first name-"),
                        lastName: uniqid("last name-"),
                        password,
                        groups: [group.id]
                    }
                })
                .then(user => {
                    // Login with new user
                    cy.login({ username: user.email, password });
                    cy.visit("/");
                    // Verify the access
                    cy.findByText(`Hi ${user.firstName} ${user.lastName}!`).should("be.visible");
                    cy.findByText(
                        /Please contact the administrator for permissions to access Webiny apps./i
                    ).should("be.visible");

                    // Should not have Page Builder card
                    cy.findByTestId("admin-welcome-screen-widget-page-builder").should("not.exist");

                    // Should not have Headless CMS card
                    cy.findByTestId("admin-welcome-screen-widget-headless-cms").should("not.exist");

                    // Delete user
                    
                    cy.securityDeleteUser({
                        id: user.id
                    }).then(data => {
                        assert.isTrue(data);
                    });
                });
        });
    });
});
