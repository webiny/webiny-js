import {
    MailerConfig,
    MailerContextObject,
    MailerSender,
    OnAfterMailerSendParams,
    OnBeforeMailerSendParams,
    OnErrorMailerParams
} from "~/types";
import { createDummySender } from "~/senders/createDummySender";
import { createTopic } from "@webiny/pubsub";
import { attachOnBeforeSend } from "~/crud/mailer/onBeforeSend";

export const createMailerCrud = (config: MailerConfig): MailerContextObject => {
    /**
     * Let's log that we are creating a dummy sender - user should know that mails are actually not being sent.
     */
    if (!config.sender && process.env.DEBUG === "true") {
        console.log("Creating dummy sender as none was sent on init.");
    }
    const sender: MailerSender = config.sender || createDummySender();
    /**
     * We define possible events to be hooked into.
     */
    const onBeforeSend = createTopic<OnBeforeMailerSendParams>();
    const onAfterSend = createTopic<OnAfterMailerSendParams>();
    const onError = createTopic<OnErrorMailerParams>();
    /**
     * We attach our default ones.
     */
    attachOnBeforeSend({
        onBeforeSend
    });

    return {
        onBeforeSend,
        onAfterSend,
        onError,
        send: async ({ data }) => {
            try {
                await onBeforeSend.publish({
                    data
                });
                const response = await sender.send(data);
                await onAfterSend.publish({
                    data
                });

                return {
                    result: response.result,
                    error: response.error
                };
            } catch (ex) {
                await onError.publish({
                    error: ex,
                    data
                });
                return {
                    result: null,
                    error: {
                        message: ex.message,
                        code: ex.code,
                        data: {
                            data,
                            ...ex.data
                        }
                    }
                };
            }
        }
    };
};
