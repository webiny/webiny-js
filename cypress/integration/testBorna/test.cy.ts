function makeid(length) {
    var result = "";
    var characters = "abcdefghijklmnopqrstuvwxyz";
    var charactersLength = characters.length;

    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

context("Blocks Page", () => {
    var tokenStorage;
    var blockCategoryName = makeid(10);
    var slugName = makeid(10);
    beforeEach(() => cy.login());
	
    it("Test creation of page builder block module using the New Block UI button if the is no category yet", () => {
        cy.login();
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains("New Block").click(); 
        cy.contains("Create a new block category").click();
        cy.findByRole('textbox', { name: 'Name' }).type(blockCategoryName);
        cy.findByRole('textbox', { name: 'Slug' }).type(slugName);
        cy.findByRole('textbox', { name: 'Description' }).type(blockCategoryName);
        cy.contains("Save block category").click();
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains("New Block").click();
        cy.findByText(slugName).click();
        cy.contains("Save Changes").click();
        cy.contains("New Block").should("exist");
    }); 
	
    it("Test the functionality of editing the block category", () => {
        cy.visit("/page-builder/block-categories");
        cy.findByPlaceholderText("Search block categories").should("exist");
        cy.contains(blockCategoryName).click();
        cy.findByRole('textbox', { name: 'Description' }).type(blockCategoryName +"1");
        cy.contains("Save block category").click();
        cy.findByPlaceholderText("Search block categories", { timeout: 10000 }).should("exist");
		cy.wait(1000);
    });

    it("Test the functionality of the duplicate block button", () => {
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryName).click();
        cy.get(".rmwc-icon.rmwc-icon--component.material-icons.css-8j2ujd-DuplicateButton.eglpe7i6.mdc-icon-button").eq(0).click();
        cy.findByPlaceholderText("Search blocks", { timeout: 10000 }).should("exist");
        cy.wait(1000);
    });
	
	it("Test the functionality of the export block button", () => {
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryName).click();
        cy.get(".rmwc-icon.rmwc-icon--component.material-icons.css-w71tfn-ExportButton.eglpe7i7.mdc-icon-button").eq(0).click();
        cy.findByText("Your export is now ready!").should("exist");
        cy.get('span.link-text.mdc-typography--body2').invoke('text').then((importUrl) => {
			tokenStorage = importUrl;
			Cypress.env('importUrl', tokenStorage)
		});
    });
	
    it("Test the functionality of the import block button", () => {
		cy.visit("/page-builder/page-blocks");
		cy.findByPlaceholderText("Search blocks").should("exist");
		cy.findByTestId("pb-blocks-list-options-menu").click();
		cy.findByRole('menuitem', { name: 'Import blocks' }).click();
		cy.contains("File URL").type(Cypress.env('importUrl'));
		cy.contains("Continue").click();
		cy.findByText("All blocks have been imported").should("exist");
		cy.contains("Continue").click();
	});
	
	it("Test the exportation of all blocks", () => {
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.findByTestId("pb-blocks-list-options-menu").click();
        cy.findByText("Export all blocks").click();
		cy.findByText("Your export is now ready!").should("exist");
    });
	
    it("Test the functionality of the edit block button", () => {
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryName).click();
        cy.get(".rmwc-icon.rmwc-icon--component.material-icons.css-1fdpwmn-EditButton.eglpe7i5.mdc-icon-button").eq(0).click();
        cy.contains("Save Changes").click();
        cy.findByPlaceholderText("Search blocks").should("exist");
    });
	
    it("Test the exportation of all blocks from the current category", () => {
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryName).click();
        cy.findByTestId("pb-blocks-list-options-menu").click();
        cy.contains("Export blocks from current category").click();
        cy.findByText("Your export is now ready!").should("exist");
    });
	
    it("Test the deletion of the 2 previously created page builder block modules", () => {
        cy.visit("/page-builder/page-blocks");
        cy.findByPlaceholderText("Search blocks").should("exist");
        cy.contains(blockCategoryName).click();
        cy.get(".rmwc-icon.rmwc-icon--component.material-icons.css-1cypnkk-DeleteButton.eglpe7i4.mdc-icon-button").eq(0).click();
        cy.findByTestId("confirmationdialog-confirm-action").click();     
        cy.get(".rmwc-icon.rmwc-icon--component.material-icons.css-1cypnkk-DeleteButton.eglpe7i4.mdc-icon-button").eq(0).click();
        cy.findByTestId("confirmationdialog-confirm-action").click();
        cy.contains("New Block").should("exist");
    });
	
    it("Test deletion of the previously created page builder category", () => {
        cy.visit("/page-builder/block-categories");
        cy.findByPlaceholderText("Search block categories").should("exist");
        cy.get(".rmwc-icon.rmwc-icon--component.material-icons.mdc-icon-button").eq(0).click({ force: true });
        cy.findByTestId("confirmationdialog-confirm-action").click();
        cy.contains("New Block").should("exist");
    });
});
