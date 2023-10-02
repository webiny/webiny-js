import { createModelField } from "./utils";
import { WorkflowModelDefinition } from "~/types";

const idField = () =>
    createModelField({
        label: "Identity Id",
        type: "text",
        parent: "reviewersGroup",
        validation: [
            {
                message: "`identityId` field value is required in reviewersGroup.",
                name: "required"
            }
        ]
    });

const nameField = () =>
    createModelField({
        label: "Name",
        type: "text",
        parent: "reviewersGroup",
        validation: [
            {
                message: "`name` field value is required in reviewersGroup.",
                name: "required"
            }
        ]
    });

const slugField = () =>
    createModelField({
        label: "Slug",
        type: "text",
        parent: "reviewersGroup",
        validation: [
            {
                message: "`slug` field value is required in reviewersGroup.",
                name: "required"
            }
        ]
    });

const descriptionField = () =>
    createModelField({
        label: "Description",
        type: "text",
        parent: "reviewersGroup"
    });

const reviewersField = () =>
    createModelField({
        label: "Reviewers",
        type: "object",
        parent: "reviewersGroup",
        validation: [
            {
                message: "`reviewers` field value is required in reviewersGroup.",
                name: "required"
            }
        ]
    });

export const REVIEWERS_GROUP_MODEL_ID = "apwReviewersGroupModelDefinition";

export const createReviewersGroupModelDefinition = (): WorkflowModelDefinition => {
    return {
        name: "APW - Reviewer",
        modelId: REVIEWERS_GROUP_MODEL_ID,
        titleFieldId: "name",
        layout: [
            ["reviewer_identityId"],
            ["reviewersGroup_name"],
            ["reviewersGroup_description"],
            ["reviewersGroup_reviewers"]
        ],
        fields: [idField(), nameField(), slugField(), descriptionField(), reviewersField()],
        description: "",
        isPrivate: true
    };
};
