import joi, { EmailOptions } from "joi";
import { TransportSettings } from "~/types";

const options: EmailOptions = {
    tlds: false
};

const password = joi.string().label("Password");
const common = {
    from: joi.string().email(options).required().label("Mail from"),
    port: joi.number().label("Port").default(25),
    replyTo: joi.string().email(options).optional().label("Mail reply-to"),
    host: joi.string().required().label("Hostname"),
    user: joi.string().required().label("User")
};

export const createValidation = joi
    .object<TransportSettings>({
        ...common,
        password: password.required()
    })
    .required();

export const updateValidation = joi
    .object<TransportSettings>({
        ...common,
        password
    })
    .required();
