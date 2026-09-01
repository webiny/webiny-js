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

    public static create(params: AssetReplyParams = { code: 200 }) {
        return new AssetReply(params);
    }

    protected constructor(params: AssetReplyParams = { code: 200 }) {
        this.code = params.code;
        this.headers = params.headers || ResponseHeaders.create();
        this.body = params.body || defaultBody;
    }

    public setHeaders(cb: HeadersSetter) {
        this.headers = cb(this.headers);
    }

    public getHeaders() {
        return this.headers;
    }

    public setCode(code: number) {
        this.code = code;
    }

    public getCode() {
        return this.code;
    }

    public setBody(body: AssetReplyBody) {
        this.body = body;
    }

    public getBody() {
        return this.body();
    }
}
