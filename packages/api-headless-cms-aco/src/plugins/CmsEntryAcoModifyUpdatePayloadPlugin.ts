import { Plugin, PluginsContainer } from "@webiny/plugins";
import { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { UpdateSearchRecordParams } from "@webiny/api-aco/record/record.types";
import { CmsEntryRecordData } from "~/types";

export type CmsEntryAcoModifyUpdatePayloadPluginPayload = Omit<
    UpdateSearchRecordParams<CmsEntryRecordData>,
    "location"
>;

interface ModifyPayloadParams<
    T extends CmsEntryAcoModifyUpdatePayloadPluginPayload = CmsEntryAcoModifyUpdatePayloadPluginPayload,
    P extends CmsEntry = CmsEntry
> {
    plugins: PluginsContainer;
    model: CmsModel;
    payload: T;
    entry: P;
}

export interface CmsEntryAcoModifyUpdatePayloadPluginCallable<
    T extends CmsEntryAcoModifyUpdatePayloadPluginPayload = CmsEntryAcoModifyUpdatePayloadPluginPayload,
    P extends CmsEntry = CmsEntry
> {
    (params: ModifyPayloadParams<T, P>): Promise<void>;
}

export class CmsEntryAcoModifyUpdatePayloadPlugin<
    T extends CmsEntryAcoModifyUpdatePayloadPluginPayload = CmsEntryAcoModifyUpdatePayloadPluginPayload,
    P extends CmsEntry = CmsEntry
> extends Plugin {
    public static override readonly type = "cms.aco.modifyUpdatePayload";

    private readonly cb: CmsEntryAcoModifyUpdatePayloadPluginCallable<T, P>;

    public constructor(cb: CmsEntryAcoModifyUpdatePayloadPluginCallable<T, P>) {
        super();
        this.cb = cb;
    }

    public async modifyPayload(params: ModifyPayloadParams<T, P>): Promise<void> {
        await this.cb(params);
    }
}
