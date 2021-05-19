import { PbPagePlugin } from "../types";
import { UpdateDataModel, UpdateSettingsModel } from "./pages/models";

/**
 * Execute validation
 */
const validationPlugin: PbPagePlugin = {
    type: "pb-page",
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
};

export default validationPlugin;
