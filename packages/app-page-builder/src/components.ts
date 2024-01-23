import PagePublishRevision from "./admin/plugins/pageDetails/header/publishRevision/PublishRevision";
import { PublishPageMenuOption } from "./admin/plugins/pageDetails/pageRevisions/MenuOptions/PublishPageMenuOption";
import { PageRevisionListItemGraphic } from "./admin/plugins/pageDetails/pageRevisions/PageRevisionListItemGraphic";
import { PublishPageButton } from "./pageEditor";

export const Components = {
    PageDetails: {
        /**
         * This component is used in the page details drawer, which opens from the pages table.
         */
        PublishPageRevision: PagePublishRevision,
        /**
         * This component is used in the page revisions list, within the page details drawer.
         */
        PublishPageMenuOption,
        /**
         * This component is used in the list of revisions, located in the page details drawer.
         */
        PageRevisionListItemGraphic
    },
    PageEditor: {
        /**
         * This component is used in the main page editor.
         */
        PublishPageButton
    }
};
