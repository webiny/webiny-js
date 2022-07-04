import { MailerSender, MailerSenderParams } from "~/types";

interface DummySender extends MailerSender {
    getAllSent: () => MailerSenderParams[];
}
export const createDummySender = (): DummySender => {
    const sent: MailerSenderParams[] = [];

    return {
        send: async params => {
            sent.push(params);
            return {
                result: true,
                error: null
            };
        },
        getAllSent: () => {
            return sent;
        }
    };
};
