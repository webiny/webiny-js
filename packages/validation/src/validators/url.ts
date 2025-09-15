import ValidationError from "~/validationError.js";

const regex = {
    base: new RegExp(
         
        /^(https?:\/\/)((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=!-]*)?(\#[-a-z\d_]*)?$/i
    ),
    ip: new RegExp(
         
        /^(https?:\/\/)(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    ),
    relative: new RegExp(
         
        /^\/.*$/
    ),
    href: new RegExp(
         
        /^(#|mailto:|tel:)\S*$/
    )
};

export default (value: any, params?: string[]) => {
    if (!value || !params) {
        return;
    }
    value = value + "";

    if (value.startsWith("http://localhost") || value.startsWith("https://localhost")) {
        value = value.replace("//localhost", "//localhost.com");
    }

    if (regex.base.test(value)) {
        if (!params.includes("noIp")) {
            return;
        }

        if (!regex.ip.test(value)) {
            return;
        }
    }

    if (params.includes("allowRelative")) {
        if (regex.relative.test(value)) {
            return;
        }
    }

    if (params.includes("allowHref")) {
        if (regex.href.test(value)) {
            return;
        }
    }

    throw new ValidationError("Value must be a valid URL.");
};
