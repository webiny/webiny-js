import uniqid from "uniqid";

context("Login Page", () => {
    it("must log in user successfully", () => {
        cy.visit("/");
        cy.findByText(/sign in/i).should("exist");
        cy.findByText(/forgot password?/i).should("exist");

        cy.findByLabelText(/your e-mail/i).type("admin@webiny.com");
        cy.findByLabelText(/your password/i).type("12345678");
        cy.findByText(/submit/i).click();

        cy.findByPlaceholderText(/search.../i).should("exist");
        cy.findByText(/pages/i).should("exist");

        // Make sure we can open user menu and that the e-mail is printed.
        cy.findByTestId("logged-in-user-menu-avatar").click();
        cy.findByTestId("logged-in-user-menu-list").within(() => {
            cy.findByText(Cypress.env("DEFAULT_ADMIN_USER_USERNAME")).should("exist");
        });
    });

    it("try to access admin pages as anonymous user", () => {
        cy.visit("/page-builder/pages");
        cy.findByText(/sign in/i).should("exist");
        cy.findByText(/forgot password?/i).should("exist");

        cy.visit("/form-builder/forms");
        cy.findByText(/sign in/i).should("exist");
        cy.findByText(/forgot password?/i).should("exist");

        cy.visit("/cms/content-models");
        cy.findByText(/sign in/i).should("exist");
        cy.findByText(/forgot password?/i).should("exist");
    });

    it("try to access non-existing page as logged user", () => {
        cy.visit("/");
        cy.findByText(/sign in/i).should("exist");
        cy.findByText(/forgot password?/i).should("exist");

        cy.findByLabelText(/your e-mail/i).type("admin@webiny.com");
        cy.findByLabelText(/your password/i).type("12345678");
        cy.findByText(/submit/i).click();

        cy.findByPlaceholderText(/search.../i).should("exist");
        cy.findByText(/pages/i).should("exist");

        cy.visit("/page-builder/pagessss");
        cy.findByText(/The route is either missing, or you're not authorized to view it./i).should(
            "exist"
        );
        cy.findByText(/Please contact your administrator to report the issue./i).should("exist");
        cy.findByText(/Take me back./i).should("exist");
    });

    it("authenticated user must logout successfully", () => {
        cy.visit("/");
        cy.findByText(/sign in/i).should("exist");
        cy.findByText(/forgot password?/i).should("exist");

        cy.findByLabelText(/your e-mail/i).type("admin@webiny.com");
        cy.findByLabelText(/your password/i).type("12345678");
        cy.findByText(/submit/i).click();

        cy.findByPlaceholderText(/search.../i).should("exist");
        cy.findByText(/pages/i).should("exist");

        cy.findByTestId("logged-in-user-menu-avatar").click();
        cy.findByText(/Sign out/i).click();
        cy.findByText(/sign in/i).should("exist");
        cy.findByText(/forgot password?/i).should("exist");
    });

    it('recover password E2E for "full-access" user', () => {
        const serverId = 'xxi0btmi';
        let passwordResetCode;
        const newUserAccountEmail = uniqid("cypress_", "@xxi0btmi.mailosaur.net");

        let fullAccessGroupUser;
        let password = "12345678";
        let newPassword = "12345678910"

        // eslint-disable-next-line jest/valid-expect-in-promise
        cy.securityReadGroup({ slug: "full-access" }).then(group => {
            return cy
                .securityCreateUser({
                    data: {
                        email: newUserAccountEmail,
                        firstName: uniqid("first name-"),
                        lastName: uniqid("last name-"),
                        password,
                        group: group.id
                    }
                })
                .then(user => {
                    fullAccessGroupUser = user;
                    // Login with new user
                    cy.login({ username: fullAccessGroupUser.email, password });
                    cy.log('email:' + fullAccessGroupUser.email)
                    cy.log('psw:' + password)
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

                    cy.findByTestId("logged-in-user-menu-avatar").click();
                    cy.findByText(/Sign out/i).click();
                    cy.findByText(/sign in/i).should("exist");

                    // activate user password
                    cy.findByLabelText(/your e-mail/i).type(newUserAccountEmail);
                    cy.findByLabelText(/your password/i).type("12345678");
                    cy.findByText(/submit/i).click();
                    cy.get('div.react-spinner-material').should('be.visible');
                    cy.get('div.react-spinner-material').should('not.exist');
                    cy.get('input[type="password"]').click();
                    cy.get('input[type="password"]').type('12345678');
                    cy.get('button.webiny-ui-button > span').click(); // SET PASSWORD btn

                    cy.findByTestId("logged-in-user-menu-avatar").click();
                    cy.findByText(/Sign out/i).click();
                    cy.findByText(/sign in/i).should("exist");

                    // recover psw
                    cy.findByText(/forgot password?/i).click();
                    cy.findByLabelText(/email/i).type(newUserAccountEmail);
                    cy.findByText(/send me the code?/i).click();
                    cy.contains('We have sent you a code to reset your password!').should('be.visible');

                    cy.mailosaurGetMessage(serverId, {
                        sentTo: newUserAccountEmail
                    }).then(email => {
                        expect(email.subject).to.equal('Your verification code');
                        passwordResetCode = email.html.body.match(/(\d+)/)[0];

                        cy.log(passwordResetCode)

                        cy.contains('Password Recovery').should('be.visible');
                        cy.contains('I got the code!').click();
                        cy.get('div > input[type="text"]').type(passwordResetCode)
                        cy.get('div[data-testid="new-password-input"] input').type(newPassword);
                        cy.get('div[data-testid="retype-password-input"] input').type(newPassword);
                        cy.get('button[data-testid="submit-btn-new-psw"]').click();

                        cy.findByText(/sign in/i).should("exist");
                        cy.findByLabelText(/your e-mail/i).type(newUserAccountEmail);
                        cy.findByLabelText(/your password/i).type(newPassword);
                        cy.findByText(/submit/i).click();
                        cy.findByPlaceholderText(/search.../i).should("exist");
                        cy.findByText(/pages/i).should("exist");
                    })
                });
        });
    });
});
