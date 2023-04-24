import { Plugin, PluginsContainer } from "@webiny/plugins";
import { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { CreateSearchRecordParams } from "@webiny/api-aco/record/record.types";
import { CmsEntryRecordData } from "~/types";

export type CmsEntryAcoModifyCreatePayloadPluginPayload =
    CreateSearchRecordParams<CmsEntryRecordData>;

interface ModifyPayloadParams<
    T extends CmsEntryAcoModifyCreatePayloadPluginPayload = CmsEntryAcoModifyCreatePayloadPluginPayload,
    P extends CmsEntry = CmsEntry
> {
    plugins: PluginsContainer;
    model: CmsModel;
    payload: T;
    entry: P;
}

export interface CmsEntryAcoModifyCreatePayloadPluginCallable<
    T extends CmsEntryAcoModifyCreatePayloadPluginPayload = CmsEntryAcoModifyCreatePayloadPluginPayload,
    P extends CmsEntry = CmsEntry
> {
    (params: ModifyPayloadParams<T, P>): Promise<void>;
}

export class CmsEntryAcoModifyCreatePayloadPlugin<
    T extends CmsEntryAcoModifyCreatePayloadPluginPayload = CmsEntryAcoModifyCreatePayloadPluginPayload,
    P extends CmsEntry = CmsEntry
> extends Plugin {
    public static override readonly type = "cms.aco.modifyCreatePayload";

    private readonly cb: CmsEntryAcoModifyCreatePayloadPluginCallable<T, P>;

    public constructor(cb: CmsEntryAcoModifyCreatePayloadPluginCallable<T, P>) {
        super();
        this.cb = cb;
    }

    public async modifyPayload(params: ModifyPayloadParams<T, P>): Promise<void> {
        await this.cb(params);
    }
}
