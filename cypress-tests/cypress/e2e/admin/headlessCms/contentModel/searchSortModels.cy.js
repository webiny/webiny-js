import uniqid from "uniqid";
import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";

context("Headless CMS - Search and Sort Content Models", () => {
    const totalModels = 2;
    const newModel = uniqid("iPhone-");
    const models = [];

    let contentModelGroup;

    before(() => {
        // Create content model group
        cy.cmsCreateContentModelGroup({
            data: { name: uniqid("Testing-"), icon: "fas/star" }
        }).then(data => {
            contentModelGroup = data;
            // Create first content model
            cy.cmsCreateContentModel({
                data: {
                    name: `${newModel} 1`,
                    modelId: `${newModel}-1`,
                    singularApiName: upperFirst(camelCase(`${newModel}-1`)),
                    pluralApiName: upperFirst(camelCase(`${newModel}-1S`)),
                    group: contentModelGroup.id
                }
            }).then(data => {
                models.push({ name: data.name, modelId: data.modelId });
                // Create second content model
                cy.cmsCreateContentModel({
                    data: {
                        name: `${newModel} 2`,
                        modelId: `${newModel}-2`,
                        singularApiName: upperFirst(camelCase(`${newModel}-2`)),
                        pluralApiName: upperFirst(camelCase(`${newModel}-2S`)),
                        group: contentModelGroup.id
                    }
                }).then(data => {
                    models.push({ name: data.name, modelId: data.modelId });
                });
            });
        });
    });

    beforeEach(() => cy.login());

    after(() => {
        const [firstModel, secondModel] = models;
        // Delete content models
        cy.waitUntil(
            () =>
                cy
                    .cmsDeleteContentModel({
                        modelId: firstModel.modelId
                    })
                    .then(data => data === true),

            {
                description: `wait until "ContentModel" one is deleted`
            }
        );

        cy.waitUntil(
            () =>
                cy
                    .cmsDeleteContentModel({
                        modelId: secondModel.modelId
                    })
                    .then(data => data === true),

            {
                description: `wait until "ContentModel" two is deleted`
            }
        );
        // Delete content model group after all models has been deleted
        cy.waitUntil(
            () =>
                cy
                    .cmsDeleteContentModelGroup({ id: contentModelGroup.id })
                    .then(data => data === true),
            {
                description: `Wait until "ContentModelGroup" is deleted`
            }
        );
    });

    it("should able to search content model", () => {
        cy.visit("/cms/content-models");

        // Should show no results when searching for non existing group
        cy.findByTestId("default-data-list.search").within(() => {
            cy.findByPlaceholderText(/search content model/i).type("NON_EXISTING_MODEL_NAME");
            cy.wait(500);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(/no records found./i).should("exist");
        });

        // Should able to search models by prefix
        cy.findByTestId("default-data-list.search").within(() => {
            const input = cy.findByPlaceholderText(/search content model/i);
            input.clear();
            input.type(newModel);
            cy.wait(500);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            for (let i = 0; i < totalModels; i++) {
                cy.findByText(models[i].name).should("exist");
            }
        });
        cy.get(`[data-testid="default-data-list"]`).children().should("have.length", totalModels);

        // Should able to search a specific model by name
        cy.findByTestId("default-data-list.search").within(() => {
            const input = cy.findByPlaceholderText(/search content model/i);
            input.clear();
            input.type(models[0].name);
            cy.wait(500);
        });
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.findByText(models[0].name).should("exist");
        });
    });

    it("should able to sort content model", () => {
        cy.visit("/cms/content-models");

        // Sort groups by "Newest to Oldest"
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("default-data-list.filter")` if issue is fixed.
        cy.get('button[data-testid="default-data-list.filter"]').click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select("savedOn_DESC");
            // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
            // Now targeting <button> directly. Revert to `.findByTestId("default-data-list.filter")` if issue is fixed.
            cy.get('button[data-testid="default-data-list.filter"]').click();
        });
        // Last model should be on the top
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(models[models.length - 1].name).should("exist");
                });
        });

        // Sort groups by "Oldest to Newest"
        // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
        // Now targeting <button> directly. Revert to `.findByTestId("default-data-list.filter")` if issue is fixed.
        cy.get('button[data-testid="default-data-list.filter"]').click();
        cy.findByTestId("ui.list.data-list").within(() => {
            cy.get("select").select("savedOn_ASC");
            // Workaround for "@rmwc/icon-button" v14 issue: props duplication onto <i>, causing multiple elements with same `data-testid`.
            // Now targeting <button> directly. Revert to `.findByTestId("default-data-list.filter")` if issue is fixed.
            cy.get('button[data-testid="default-data-list.filter"]').click();
        });
        // Last model should not be on the top
        cy.findByTestId("default-data-list").within(() => {
            cy.get("li")
                .first()
                .within(() => {
                    cy.findByText(models[models.length - 1].name).should("not.exist");
                });
        });
    });
});
