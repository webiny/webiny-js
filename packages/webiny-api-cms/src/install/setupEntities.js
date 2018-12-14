// @flow
import { categoryFactory } from "./../entities/Category.entity";
import { menuFactory } from "./../entities/Menu.entity";
import { pageFactory } from "./../entities/Page.entity";
import { tagFactory } from "./../entities/Tag.entity";
import { tags2PagesFactory } from "./../entities/Tags2Pages.entity";
import { elementFactory } from "./../entities/Element.entity";
import { cmsSettingsFactory } from "./../entities/CmsSettings.entity";

export default (context: Object) => {
    context.cms = { entities: {} };

    context.cms.entities.Category = categoryFactory();
    context.cms.entities.Tag = tagFactory(context);
    context.cms.entities.Tags2Pages = tags2PagesFactory(context);
    context.cms.entities.Page = pageFactory(context);
    context.cms.entities.Menu = menuFactory();
    context.cms.entities.Element = elementFactory();
    context.cms.entities.CmsSettings = cmsSettingsFactory(context);
};
