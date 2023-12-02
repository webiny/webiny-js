import { ResponseHeaders, StandardHeaders } from "~/ResponseHeaders";
import { Request } from "~/types";

interface ModifyResponseHeadersCallable<T> {
    (request: Request, headers: ResponseHeaders<T>): void;
}

class ModifyResponseHeadersPlugin<T extends StandardHeaders = StandardHeaders> {
    private readonly cb: ModifyResponseHeadersCallable<T>;

    constructor(cb: ModifyResponseHeadersCallable<T>) {
        this.cb = cb;
    }

    modify(request: Request, headers: ResponseHeaders<T>) {
        this.cb(request, headers);
    }
}

export function createModifyResponseHeaders<T extends StandardHeaders = StandardHeaders>(
    cb: ModifyResponseHeadersCallable<T>
) {
    return new ModifyResponseHeadersPlugin<T>(cb);
}
