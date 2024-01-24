import { Plugin } from "@webiny/plugins/Plugin";
import { ResponseHeaders } from "~/ResponseHeaders";
import { Request } from "~/types";

interface ModifyResponseHeadersCallable {
    (request: Request, headers: ResponseHeaders): void;
}

export class ModifyResponseHeadersPlugin extends Plugin {
    public static override type = "handler.response.modifyHeaders";
    private readonly cb: ModifyResponseHeadersCallable;

    constructor(cb: ModifyResponseHeadersCallable) {
        super();
        this.cb = cb;
    }

    modify(request: Request, headers: ResponseHeaders) {
        this.cb(request, headers);
    }
}

export function createModifyResponseHeaders(cb: ModifyResponseHeadersCallable) {
    return new ModifyResponseHeadersPlugin(cb);
}
