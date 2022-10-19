import {
    MailerConfig,
    MailerContextObject,
    Mailer,
    OnMailerAfterSendParams,
    OnMailerBeforeSendParams,
    OnMailerErrorParams,
    OnMailerBeforeInitParams,
    OnMailerAfterInitParams,
    OnMailerInitErrorParams
} from "~/types";
import { createTopic } from "@webiny/pubsub";
import { attachOnMailerBeforeSend } from "~/crud/mailer/onMailerBeforeSend";

export const createMailerCrud = <T extends Mailer = Mailer>(
    config: MailerConfig<T>
): MailerContextObject<T> => {
    let mailer = config.mailer;
    /**
     * We define possible events to be hooked into.
     */
    const onMailerBeforeInit = createTopic<OnMailerBeforeInitParams>("mailer.onMailerBeforeInit");
    const onMailerInitError = createTopic<OnMailerInitErrorParams>("mailer.onMailerInitError");
    const onMailerAfterInit = createTopic<OnMailerAfterInitParams>("mailer.onMailerAfterInit");
    const onMailerBeforeSend = createTopic<OnMailerBeforeSendParams>("mailer.onMailerBeforeSend");
    const onMailerAfterSend = createTopic<OnMailerAfterSendParams>("mailer.onMailerAfterSend");
    const onMailerError = createTopic<OnMailerErrorParams>("mailer.onMailerError");
    /**
     * We attach our default ones.
     */
    attachOnMailerBeforeSend({
        onMailerBeforeSend
    });

    const getMailer = (): T => {
        return mailer;
    };

    const isAvailable = (): boolean => {
        return mailer.name !== "dummy";
    };

    return {
        onMailerBeforeInit,
        onMailerInitError,
        onMailerAfterInit,
        onMailerBeforeSend,
        onMailerAfterSend,
        onMailerError,
        getMailer,
        setMailer: target => {
            mailer = target;
        },
        isAvailable,
        send: async data => {
            if (!mailer) {
                return {
                    result: null,
                    error: {
                        message: "There is no mailer available.",
                        code: "NO_MAILER_DEFINED"
                    }
                };
            }
            try {
                await onMailerBeforeSend.publish({
                    data
                });
                const response = await mailer.send(data);
                await onMailerAfterSend.publish({
                    data
                });

                return {
                    result: response.result,
                    error: response.error
                };
            } catch (ex) {
                await onMailerError.publish({
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
