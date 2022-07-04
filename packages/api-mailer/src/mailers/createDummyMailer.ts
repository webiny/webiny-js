import { Mailer, MailerSendData } from "~/types";

export interface DummyMailer extends Mailer {
    getAllSent: () => MailerSendData[];
}
export const createDummyMailer = (): DummyMailer => {
    const sent: MailerSendData[] = [];

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
