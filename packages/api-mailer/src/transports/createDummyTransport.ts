import { Transport, TransportSendData } from "~/types";

export interface DummyTransport extends Transport {
    getAllSent: () => TransportSendData[];
}
export const createDummyTransport = (): DummyTransport => {
    const sent: TransportSendData[] = [];

    return {
        name: "mailer.dummy-default",
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
