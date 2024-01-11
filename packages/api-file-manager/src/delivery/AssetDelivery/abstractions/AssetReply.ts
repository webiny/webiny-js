import { ResponseHeaders } from "@webiny/handler";

interface HeadersSetter {
    (headers: ResponseHeaders): ResponseHeaders;
}

interface AssetReplyParams {
    code: number;
    headers?: ResponseHeaders;
    body?: AssetReplyBody;
}

interface AssetReplyBody {
    (): Promise<unknown> | unknown;
}

const defaultBody = () => "";

export class AssetReply {
    private headers: ResponseHeaders;
    private code: number;
    private body: AssetReplyBody;

    constructor(params: AssetReplyParams = { code: 200 }) {
        this.code = params.code;
        this.headers = params.headers || ResponseHeaders.create();
        this.body = params.body || defaultBody;
    }

    setHeaders(cb: HeadersSetter) {
        this.headers = cb(this.headers);
    }

    getHeaders() {
        return this.headers;
    }

    setCode(code: number) {
        this.code = code;
    }

    getCode() {
        return this.code;
    }

    setBody(body: AssetReplyBody) {
        this.body = body;
    }

    getBody() {
        return this.body();
    }
}
