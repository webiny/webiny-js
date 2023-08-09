import uniqid from "uniqid";

function getPlaceholder(placeholder) {
    return cy.get('input[placeholder="' + placeholder + '"]');
}

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
    var import_url =
        "https://wby-fm-bucket-d7ecf9a.s3.amazonaws.com/EXPORTS/8lktvc8xe-WEBINY_BLOCK_EXPORT.zip?AWSAccessKeyId=ASIA4ITYNEHPU62DZ7E2&Expires=1691594051&Signature=sTOI9ECU8yHy%2F7NLf%2Bx52h%2FQa8A%3D&X-Amzn-Trace-Id=Root%3D1-64ca72bf-24750f034e3441390ab83f1a%3BParent%3D2def68bf20ca0ba7%3BSampled%3D0%3BLineage%3D8b7b8b32%3A0%7Cc2636230%3A1%7C2391eed0%3A0&x-amz-security-token=IQoJb3JpZ2luX2VjEFcaCXVzLWVhc3QtMSJHMEUCIElvm8HhZTRC09kHKjn6cHCD%2BZu3HoZYDst22zZTVeDVAiEAuCo42IE3VAvxUDSOO%2FtXmG63aK8AgQMndKpDQ5KXtfcqmAMI8P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw4NDMxMzk4NTA3MTkiDCDmvtpd8IGv212iBirsAmfisv1Fl%2BuJumaxFVCVBkMSVECa%2BTeYPREA50PvGgl7v4F%2FKVmJpR4kXkTTehNp40%2Bxqa%2F%2BXV2ulON7LQjkt1RpsokJ%2F9fjmP5oxWAc8%2Fv0twL3texB%2FBkq2hz%2Bw6D5Ay3BS9Hf92MiOektY2TuNJFCxUpHmQPI1EvLBQ7BqsRJYKHTFnUHdPQlIjzjG8QKOwO24kinGx6HxATfMnUn5Nu5qdDO3C8JErFC0LAAJyJFJu0bYFGSGf4QDJzE9xXtzfoeBHPMnLpQeALalOivg7g3QmL9wx%2BcWqQsYzuEEYkffQsIPFbY607pUDxcGQvM7gT91cKuXo4KNXkkbHzxE2OqJSHdQ8RQMRa0REtl5uCHsfN3%2FfjOh1FT0tjXfybCVrPxK6zar3fqMKEsZdRZ9x4bVoQp8ti2HPdbD0IxUtKWOZpPBMkdTzgV442zYk%2BrdcJ5opUpAvE10zdMbrqY8IIfHECQLMbjjfm5ZcIwsdeppgY6nQEW2k5HstUcrtwEJxfjUW1YP1mitNyPjwjhhw0MJxEmsMnEnt%2F8Ci9SRZ51qtXdUx%2F%2BJgvLBe%2FzQDKFYEAiZZbQfm9MBtNBpHKZRttNKRua1YbychTatZfTnIiaT0Pb%2F6jNJ0FHafQTYQpx9Z4a6nXeCN%2FJwSdoaSTbwpfSs2oJ5kpcaZK5aonMgkSvLJ9x6vMJMCOGDpHHHQkljU1M";
    var block_category_name = uniqid();
    var slug_name = makeid(10);
    beforeEach(() => cy.login());

    it("Test creation of page builder block module using the New Block UI button if the is no category yet", () => {
        cy.login();
        cy.visit("/page-builder/page-blocks");
        getPlaceholder("Search blocks").should("exist");
        cy.contains("New Block").click();
        cy.contains("Create a new block category").click();
        cy.get(".mdc-text-field__input").eq(0).type(block_category_name);
        cy.get(".mdc-text-field__input").eq(1).type(slug_name);
        cy.get(".mdc-text-field__input").eq(2).type(block_category_name);
        cy.contains("Save block category").click();
        cy.visit("/page-builder/page-blocks");
        getPlaceholder("Search blocks").should("exist");
        cy.contains("New Block").click();
        cy.contains(slug_name).click();
        cy.contains("Save Changes").click();

        cy.contains("New Block").should("exist");
    });
    /*
	it("Test creation of page builder block module using the New Block UI button", () => {
        cy.visit("/page-builder/page-blocks");
		getPlaceholder("Search blocks").should("exist");
		containsClick("New Block");
		containsClick(slug_name);
		containsClick("Save Changes");
		cy.contains("New Block").should("exist");
    });
	*/

    it("Test the functionality of editing the block category", () => {
        cy.visit("/page-builder/block-categories");
        getPlaceholder("Search block categories").should("exist");
        cy.contains(block_category_name).click();
        cy.get(".mdc-text-field__input")
            .eq(2)
            .type(block_category_name + "1");
        cy.contains("Save block category").click();
        cy.contains("New Block").should("exist");
        cy.wait(1000);
    });

    it("Test the functionality of the duplicate block button", () => {
        cy.visit("/page-builder/page-blocks");
        getPlaceholder("Search blocks").should("exist");
        cy.contains(block_category_name).click();
        cy.get(
            ".rmwc-icon.rmwc-icon--component.material-icons.css-8j2ujd-DuplicateButton.eglpe7i6.mdc-icon-button"
        )
            .eq(0)
            .click();

        cy.contains("New Block").should("exist");
        cy.wait(1000);
    });

    it("Test the functionality of the import block button", () => {
        cy.visit("/page-builder/page-blocks");
        getPlaceholder("Search blocks").should("exist");
        cy.findByTestId("pb-blocks-list-options-menu").click();
        cy.contains("Import blocks").click();
        cy.contains("File URL").type(import_url);
        cy.contains("Continue").click();
        cy.contains("All blocks have been imported").should("exist");
        cy.contains("Continue").click();
        cy.wait(1000);
    });

    it("Test the functionality of the export block button", () => {
        cy.visit("/page-builder/page-blocks");
        getPlaceholder("Search blocks").should("exist");
        cy.contains(block_category_name).click();
        cy.get(
            ".rmwc-icon.rmwc-icon--component.material-icons.css-w71tfn-ExportButton.eglpe7i7.mdc-icon-button"
        )
            .eq(0)
            .click();

        cy.contains("Your export is now ready!").should("exist");
        cy.wait(1000);
    });

    it("Test the functionality of the edit block button", () => {
        cy.visit("/page-builder/page-blocks");
        getPlaceholder("Search blocks").should("exist");
        cy.contains(block_category_name).click();
        cy.get(
            ".rmwc-icon.rmwc-icon--component.material-icons.css-1fdpwmn-EditButton.eglpe7i5.mdc-icon-button"
        )
            .eq(0)
            .click();
        //cy.get("css-mt1ik6-StyledDivider.eeco1sf0").click().type("Testing Editing Block"); Does not work
        cy.contains("Save Changes").click();

        getPlaceholder("Search blocks").should("exist");
        cy.wait(1000);
    });

    it("Test the exportation of all blocks", () => {
        cy.visit("/page-builder/page-blocks");
        getPlaceholder("Search blocks").should("exist");
        cy.findByTestId("pb-blocks-list-options-menu").click();
        cy.contains("Export all blocks").click();

        cy.contains("Your export is now ready!").should("exist");
        cy.wait(1000);
    });

    it("Test the exportation of all blocks from the current category", () => {
        cy.visit("/page-builder/page-blocks");
        getPlaceholder("Search blocks").should("exist");
        cy.contains(block_category_name).click();

        cy.findByTestId("pb-blocks-list-options-menu").click();
        cy.contains("Export blocks from current category").click();

        cy.contains("Your export is now ready!").should("exist");
    });

    it("Test deletion of the 2 previously created page builder block modules", () => {
        cy.visit("/page-builder/page-blocks");
        getPlaceholder("Search blocks").should("exist");
        cy.contains(block_category_name).click();

        cy.get(
            ".rmwc-icon.rmwc-icon--component.material-icons.css-1cypnkk-DeleteButton.eglpe7i4.mdc-icon-button"
        )
            .eq(0)
            .click();
        cy.findByTestId("confirmationdialog-confirm-action").click();
        cy.wait(2000);
        cy.get(
            ".rmwc-icon.rmwc-icon--component.material-icons.css-1cypnkk-DeleteButton.eglpe7i4.mdc-icon-button"
        )
            .eq(0)
            .click();
        cy.findByTestId("confirmationdialog-confirm-action").click();
        cy.wait(2000);

        cy.contains("New Block").should("exist");
    });

    it("Test deletion of the previously created page builder category", () => {
        cy.visit("/page-builder/block-categories");
        getPlaceholder("Search block categories").should("exist");
        cy.wait(100);
        cy.get(".rmwc-icon.rmwc-icon--component.material-icons.mdc-icon-button")
            .eq(0)
            .click({ force: true }); //cannot get the button
        cy.wait(100);
        cy.findByTestId("confirmationdialog-confirm-action").click();
        cy.wait(2000);

        cy.contains("New Block").should("exist");
    });
});
