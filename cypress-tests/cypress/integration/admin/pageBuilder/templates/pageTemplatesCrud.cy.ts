import { customAlphabet } from "nanoid";

context("Page Builder - Blocks", () => {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz");
    const pageTemplateData1 = {
        title: nanoid(6),
        slug: nanoid(6),
        description: nanoid(6),
        tags: [],
        layout: "static",
        pageCategory: "static",
      };
      const pageTemplateData2 = {
        title: nanoid(6),
        slug: nanoid(6),
        description: nanoid(6),
        tags: [],
        layout: "static",
        pageCategory: "static",
      };

    beforeEach(() => {
        cy.login();
        cy.pbDeleteAllTemplates();
    });

    it("Should be able to create a template and then edit and delete it", () => {
        cy.visit("/page-builder/page-templates");
        //Creates a template using the UI.
        cy.get('.webiny-ui-button--secondary').click();
        //cy.findByTestId("new-record-button").click();
        cy.findByRole('textbox', { name: "Title" }).type("testingfunctionality");
        cy.findByRole('textbox', { name: "Slug" }).type("testingfunctionality");
        cy.findByRole('textbox', { name: "Description" }).type("testingfunctionality");
        cy.findByRole('button', { name: "Create" }).click();
        cy.findByRole('button', { name: "Save Changes" }).should("exist").click();

        cy.contains("testingfunctionality").should("exist");
        
        //Edits the template name using the UI.
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first().click();
        });
        cy.get('div.css-4d76fo-HeaderActions.e1masl564 button.rmwc-icon.rmwc-icon--component.material-icons.mdc-icon-button').first().click();

        cy.wait(1500).findByTestId("pb-editor-page-title").click();
        cy.get(`input[value="testingfunctionality"]`)
            .clear()
            .type("testingfunctionality1")
            .blur();
        cy.findByRole('button', { name: "Save Changes" }).should("exist").click();
        cy.contains("testingfunctionality1").should("exist");

        //Deletes the template using the UI.
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first().click();
        });
        cy.get('div.css-4d76fo-HeaderActions.e1masl564 button.rmwc-icon.rmwc-icon--component.material-icons.mdc-icon-button').eq(1).click();
        cy.findByTestId("confirmationdialog-confirm-action").click();
        
        cy.visit("/page-builder/page-templates");
        cy.contains("testingfunctionality1").should("not.exist");
    });
    
    it.skip("Testing graphQL commands", () => {
        cy.visit("/page-builder/page-templates")
        //cy.pbCreatePageTemplate(pageTemplateData1);
        //cy.pbCreatePageTemplate(pageTemplateData2);
        //cy.pbListPageTemplates().then((responseData) => {
        //    responseData.forEach((template) => {
        //      cy.log("Page Template Title:", template.title);
        //    });
        //  });
        //cy.pbDeleteAllTemplates();
    });
});
