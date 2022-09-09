import { Plugin } from "@webiny/plugins";
import { CmsModelField } from "~/types";

export abstract class CmsFieldFieldIdStorageConverter extends Plugin {
    public static override type = "cms.field.fieldid.storage.converter";

    public abstract toStorage(field: CmsModelField): string;
    public abstract fromStorage(field: CmsModelField): string;
}
