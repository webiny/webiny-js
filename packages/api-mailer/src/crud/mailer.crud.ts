import { MailerConfig, MailerContextObject, MailerSender } from "~/types";
import { createDummySender } from "~/senders/createDummySender";

export const createMailerCrud = (config: MailerConfig): MailerContextObject => {
    /**
     * Let's log that we are creating a dummy sender - user should know that mails are actually not being sent.
     */
    if (!config.sender && process.env.DEBUG === "true") {
        console.log("Creating dummy sender as none was sent on init.");
    }
    const sender: MailerSender = config.sender || createDummySender();

    return {
        send: async ({ data }) => {
            try {
                const response = await sender.send(data);

                return {
                    result: response.result,
                    error: response.error
                };
            } catch (ex) {
                return {
                    result: null,
                    error: {
                        message: ex.message,
                        code: ex.code,
                        data: {
                            ...data,
                            ...ex.data
                        }
                    }
                };
            }
        }
    };
};
