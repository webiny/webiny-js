import { CmsEntryPermission, CmsModel } from "~/types";
import { AppPermissions, EnsureParams, Options } from "@webiny/api-security";

type PickedCmsModel = Pick<CmsModel, "isPrivate">;

interface EnsureWithModelParams extends EnsureParams {
    model: PickedCmsModel;
}

interface CanAccessNonOwnedRecordsWithModelParams {
    model: PickedCmsModel;
}

interface CanAccessOnlyOwnRecordsWithModelParams {
    model: PickedCmsModel;
}

interface HasFullAccessWithModelParams {
    model: PickedCmsModel;
}

export class EntriesPermissions extends AppPermissions<CmsEntryPermission> {
    async ensureWithModel(params: EnsureWithModelParams, options: Options = {}): Promise<boolean> {
        if (await this.hasFullAccessWithModel(params)) {
            return true;
        }

        return this.ensure(params, options);
    }

    async canAccessNonOwnedRecordsWithModel(params: CanAccessNonOwnedRecordsWithModelParams) {
        if (await this.hasFullAccessWithModel(params)) {
            return false;
        }

        return this.canAccessNonOwnedRecords();
    }

    async canAccessOnlyOwnRecordsWithModel(params: CanAccessOnlyOwnRecordsWithModelParams) {
        if (await this.hasFullAccessWithModel(params)) {
            return false;
        }

        return this.canAccessOnlyOwnRecords();
    }

    async hasFullAccessWithModel(params: HasFullAccessWithModelParams) {
        if (params.model.isPrivate) {
            return true;
        }

        return this.hasFullAccess();
    }
}
