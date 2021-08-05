import { UpdateDataModel, UpdateSettingsModel } from "./pages/models";
import { PagePlugin } from "~/plugins/PagePlugin";

export default new PagePlugin({
    async beforeUpdate({ inputData, existingPage, updateData }) {
        const updateDataModel = new UpdateDataModel().populate(inputData);
        await updateDataModel.validate();

        const updateSettingsModel = new UpdateSettingsModel()
            .populate(existingPage.settings)
            .populate(inputData.settings);

        await updateSettingsModel.validate();

        if (!Array.isArray(updateData.settings.seo.meta)) {
            updateData.settings.seo.meta = [];
        }

        if (!Array.isArray(updateData.settings.social.meta)) {
            updateData.settings.social.meta = [];
        }
    }
});
