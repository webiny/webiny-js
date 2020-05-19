import contentModelGroupData from "../mocks/contentModelGroup";
import contentModels from "../mocks/contentModels";

export default async context => {
    const ContentModel = context.models.CmsContentModel;
    const ContentModelGroup = context.models.CmsContentModelGroup;

    const contentModelGroup = new ContentModelGroup();
    contentModelGroup.populate(contentModelGroupData);
    await contentModelGroup.save();

    const contentModelInstances = [];
    for (let i = 0; i < contentModels.length; i++) {
        const contentModel = new ContentModel();
        contentModel.populate(contentModels[i]);
        await contentModel.save();
        contentModelInstances.push(contentModel);
    }

    return { contentModelInstances, contentModels, contentModelGroup: contentModelGroupData };
};
