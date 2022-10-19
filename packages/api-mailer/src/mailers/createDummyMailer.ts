import { Mailer, MailerSendData } from "~/types";

export interface DummyMailer extends Mailer {
    name: "dummy";
    getAllSent: () => MailerSendData[];
}
export const createDummyMailer = (): DummyMailer => {
    const sent: MailerSendData[] = [];

    return {
        name: "dummy",
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
