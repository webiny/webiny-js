import { MailerConfig, MailerContextObject } from "~/types";

export const createMailerCrud = (config: MailerConfig): MailerContextObject => {
    const { sender } = config;

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
