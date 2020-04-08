export const copyEnvironment = async (targetEnvironment, context) => {
    const { CmsContentModel } = context.models;
    const contentModels = await CmsContentModel.find();
    for (let i = 0; i < contentModels.length; i++) {
        const contentModel = contentModels[i];
        contentModel.environment = targetEnvironment;
        await contentModel.save();
    }
};
