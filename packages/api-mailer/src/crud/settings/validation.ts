import joi from "joi";
import { TransportSettings } from "~/types";

export const validation = joi
    .object<TransportSettings>({
        from: joi.string().email().required(),
        replyTo: joi.string().email().optional(),
        host: joi.string().required(),
        user: joi.string().required(),
        password: joi.string().required()
    })
    .required();
