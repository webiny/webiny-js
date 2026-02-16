import { ModelFactory } from "webiny/api/cms/model";

export const CONTACT_SUBMISSION_MODEL_ID = "contactSubmission";

class ContactSubmissionModelImpl implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .public({
                    modelId: CONTACT_SUBMISSION_MODEL_ID,
                    name: "Contact Submission",
                    group: "ungrouped"
                })
                .description("Stores contact form submissions from the website")
                .fields(fields => ({
                    name: fields
                        .text()
                        .renderer("text-input")
                        .label("Name")
                        .helpText("Full name of the person submitting the form")
                        .required("Name is required")
                        .minLength(2)
                        .maxLength(100)
                        .helpText("Enter your full name"),
                    email: fields
                        .text()
                        .renderer("text-input")
                        .label("Email")
                        .helpText("Email address for contact")
                        .required("Email is required")
                        .email()
                        .helpText("Enter a valid email address"),
                    message: fields
                        .longText()
                        .renderer("long-text-text-area")
                        .label("Message")
                        .helpText("Message content from the contact form")
                        .required("Message is required")
                        .minLength(10)
                        .maxLength(1000)
                        .helpText("Enter your message..."),
                    emailType: fields
                        .text()
                        .renderer("radio-buttons")
                        .label("Email Type")
                        .helpText("Automatically classified as Work or Personal")
                        .predefinedValues([
                            { label: "Work", value: "work" },
                            { label: "Personal", value: "personal" }
                        ])
                }))
                .layout([["name", "email"], ["message"], ["emailType"]])
                .titleFieldId("name")
                .descriptionFieldId("message")
                .singularApiName("ContactSubmission")
                .pluralApiName("ContactSubmissions")
        ];
    }
}

export default ModelFactory.createImplementation({
    implementation: ContactSubmissionModelImpl,
    dependencies: []
});
