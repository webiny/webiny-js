import {
    MailerConfig,
    MailerContextObject,
    Mailer,
    MailerSetterParams,
    OnAfterMailerSendParams,
    OnBeforeMailerSendParams,
    OnErrorMailerParams
} from "~/types";
import { createTopic } from "@webiny/pubsub";
import { attachOnBeforeSend } from "~/crud/mailer/onBeforeSend";
import WebinyError from "@webiny/error";

const createDefaultMailer = async () => {
    return import("~/mailers/createSmtpMailer").then(module => {
        return module.createSmtpMailer();
    });
};

export const createMailerCrud = (config?: MailerConfig): MailerContextObject => {
    let defaultMailer: MailerSetterParams | undefined = config?.mailer || createDefaultMailer;
    /**
     * We define possible events to be hooked into.
     */
    const onBeforeSend = createTopic<OnBeforeMailerSendParams>("mailer.onBeforeMailSend");
    const onAfterSend = createTopic<OnAfterMailerSendParams>("mailer.onAfterMailSend");
    const onError = createTopic<OnErrorMailerParams>("mailer.onErrorMailSend");
    /**
     * We attach our default ones.
     */
    attachOnBeforeSend({
        onBeforeSend
    });

    let initializedMailer: Mailer | undefined;

    const getMailer = async <T extends Mailer = Mailer>(): Promise<T> => {
        if (initializedMailer) {
            return initializedMailer as T;
        } else if (!defaultMailer) {
            throw new WebinyError({
                message: "Mailer is not set.",
                code: "MAILER_NOT_SET_ERROR"
            });
        } else if (typeof defaultMailer === "function") {
            try {
                initializedMailer = await defaultMailer();

                return initializedMailer as T;
            } catch (ex) {
                throw new WebinyError({
                    message: "Error while getting mailer.",
                    code: "MAILER_ERROR",
                    data: {
                        error: ex
                    }
                });
            }
        }
        initializedMailer = defaultMailer;
        return initializedMailer as T;
    };

    return {
        onBeforeSend,
        onAfterSend,
        onError,
        getMailer,
        setMailer: target => {
            initializedMailer = undefined;
            defaultMailer = target;
        },
        send: async ({ data }) => {
            const mailer = await getMailer();
            try {
                await onBeforeSend.publish({
                    data
                });
                const response = await mailer.send(data);
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
