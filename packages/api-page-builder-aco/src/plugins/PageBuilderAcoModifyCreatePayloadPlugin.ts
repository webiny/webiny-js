import { Plugin, PluginsContainer } from "@webiny/plugins";
import { PbCreatePayload } from "~/types";
import { Page } from "@webiny/api-page-builder/types";

interface ModifyPayloadParams<T extends PbCreatePayload = PbCreatePayload, P extends Page = Page> {
    plugins: PluginsContainer;
    payload: T;
    page: P;
}

export interface PageBuilderAcoModifyCreatePayloadPluginCallable<
    T extends PbCreatePayload = PbCreatePayload,
    P extends Page = Page
> {
    (params: ModifyPayloadParams<T, P>): Promise<void>;
}

export class PageBuilderAcoModifyCreatePayloadPlugin<
    T extends PbCreatePayload = PbCreatePayload,
    P extends Page = Page
> extends Plugin {
    public static override readonly type = "pb.aco.modifyCreatePayload";

    private readonly cb: PageBuilderAcoModifyCreatePayloadPluginCallable<T, P>;

    public constructor(cb: PageBuilderAcoModifyCreatePayloadPluginCallable<T, P>) {
        super();
        this.cb = cb;
    }

    public async modifyPayload(params: ModifyPayloadParams<T, P>): Promise<void> {
        await this.cb(params);
    }
}
