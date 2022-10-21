import joi, { EmailOptions } from "joi";
import { TransportSettings } from "~/types";

const options: EmailOptions = {
    tlds: false
};

export const validation = joi
    .object<TransportSettings>({
        from: joi.string().email(options).required(),
        replyTo: joi.string().email(options).optional(),
        host: joi.string().required(),
        user: joi.string().required(),
        password: joi.string().required()
    })
    .required();
