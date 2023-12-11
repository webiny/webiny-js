import { ResponseHeaders, StandardHeaders } from "~/ResponseHeaders";
import { Request } from "~/types";

interface ModifyResponseHeadersCallable {
    (request: Request, headers: ResponseHeaders): void;
}

class ModifyResponseHeadersPlugin<T extends StandardHeaders = StandardHeaders> {
    private readonly cb: ModifyResponseHeadersCallable;

    constructor(cb: ModifyResponseHeadersCallable) {
        this.cb = cb;
    }

    modify(request: Request, headers: ResponseHeaders) {
        this.cb(request, headers);
    }
}

export function createModifyResponseHeaders<T extends StandardHeaders = StandardHeaders>(
    cb: ModifyResponseHeadersCallable
) {
    return new ModifyResponseHeadersPlugin(cb);
}
