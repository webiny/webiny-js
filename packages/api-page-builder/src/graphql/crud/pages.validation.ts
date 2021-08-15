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

        updateData.settings = Object.assign(
            {},
            updateData.settings,
            await updateSettingsModel.toJSON()
        );
    }
});
