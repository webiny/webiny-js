import { EntryBeforeCreateEventHandler as EntryBeforeCreateEventHandlerAbstraction } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

// List of common free email providers
const PERSONAL_EMAIL_DOMAINS = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "aol.com",
    "icloud.com",
    "protonmail.com"
];

class ContactSubmissionHookImpl implements EntryBeforeCreateEventHandlerAbstraction.Interface {
    public constructor(private logger: Logger.Interface) {}

    public async handle(event: EntryBeforeCreateEventHandlerAbstraction.Event): Promise<void> {
        const { model, input, entry } = event.payload;

        // 1. Check if this event is for our Contact Submission model
        if (model.modelId !== "contactSubmission") {
            return;
        }

        this.logger.info(`Processing contact submission for model: ${model.modelId}`);

        // 2. Get the email from the payload
        // Note: In Webiny CMS events, the entry data is typically in payload.values
        const email = input.values?.email as string;

        if (!email) {
            this.logger.warn("No email found in contact submission");
            return;
        }

        // 3. Analyze the email domain
        const domain = email.split("@")[1]?.toLowerCase();

        let type = "work";
        if (domain && PERSONAL_EMAIL_DOMAINS.includes(domain)) {
            type = "personal";
        }

        this.logger.info(`Classified email ${email} as ${type}`);

        // 4. Update the entry with the classification
        // We can directly modify the payload.values object to set data before it's saved
        entry.values.emailType = type;
    }
}

export default EntryBeforeCreateEventHandlerAbstraction.createImplementation({
    implementation: ContactSubmissionHookImpl,
    dependencies: [Logger]
});
