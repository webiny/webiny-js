import { Render } from "~/types";

export default function (args: Render): Render {
    return {
        tenant: args.tenant,
        path: args.path,
        locale: args.locale,
        files: args.files
    };
}
