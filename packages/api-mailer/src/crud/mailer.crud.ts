import {
    MailerConfig,
    MailerContextObject,
    MailerSender,
    MailerSenderSetterParams,
    OnAfterMailerSendParams,
    OnBeforeMailerSendParams,
    OnErrorMailerParams
} from "~/types";
import { createTopic } from "@webiny/pubsub";
import { attachOnBeforeSend } from "~/crud/mailer/onBeforeSend";
import WebinyError from "@webiny/error";

const createDefaultSender = async () => {
    return import("~/senders/createSmtpSender").then(module => {
        return module.createSmtpSender();
    });
};

export const createMailerCrud = (config?: MailerConfig): MailerContextObject => {
    let mailerSender: MailerSenderSetterParams | undefined = config?.sender || createDefaultSender;
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

    let mailerSenderInitialized: MailerSender | undefined;

    const getSender = async <T extends MailerSender = MailerSender>(): Promise<T> => {
        if (mailerSenderInitialized) {
            return mailerSenderInitialized as T;
        } else if (!mailerSender) {
            throw new WebinyError({
                message: "Mailer sender is not set.",
                code: "MAILER_SENDER_NOT_SET_ERROR"
            });
        } else if (typeof mailerSender === "function") {
            try {
                mailerSenderInitialized = await mailerSender();

                return mailerSenderInitialized as T;
            } catch (ex) {
                throw new WebinyError({
                    message: "Error while getting mailer sender.",
                    code: "MAILER_SENDER_ERROR",
                    data: {
                        error: ex
                    }
                });
            }
        }
        mailerSenderInitialized = mailerSender;
        return mailerSenderInitialized as T;
    };

    return {
        onBeforeSend,
        onAfterSend,
        onError,
        getSender,
        setSender: target => {
            mailerSenderInitialized = undefined;
            mailerSender = target;
        },
        send: async ({ data }) => {
            const sender = await getSender();
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
