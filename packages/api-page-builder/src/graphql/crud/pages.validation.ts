import { UpdateDataModel, UpdateSettingsModel } from "./pages/models";
import { PbContext } from "~/graphql/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

export default new ContextPlugin<PbContext>(async context => {
    context.pageBuilder.pages.onBeforePageUpdate.subscribe(async params => {
        const { page, original, input } = params;
        const updateDataModel = new UpdateDataModel().populate(input);
        await updateDataModel.validate();

        const updateSettingsModel = new UpdateSettingsModel()
            .populate(original.settings)
            .populate(page.settings);

        await updateSettingsModel.validate();

        const newData = (await updateSettingsModel.toJSON()) as Record<string, any>;

        page.settings = Object.assign({}, page.settings, newData);
    });
});
