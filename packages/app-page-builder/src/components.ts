import PagePublishRevision from "./admin/plugins/pageDetails/header/publishRevision/PublishRevision";
import DeleteTheEntirePage from "./admin/plugins/pageDetails/header/deletePage/DeletePage";
import EditPageInToolbar from "./admin/plugins/pageDetails/header/editRevision/EditRevision";
import * as RevisionsList from "./admin/plugins/pageDetails/pageRevisions/RevisionsList";
import { usePage as usePageDetailsPage } from "./admin/views/Pages/PageDetails";
import { PreviewPage as PreviewPageToolbar } from "./admin/plugins/pageDetails/header/pageOptionsMenu/PreviewPage";
import { DuplicatePage as DuplicatePageToolbar } from "./admin/plugins/pageDetails/header/pageOptionsMenu/DuplicatePage";
import {
    PublishPageMenuOption,
    DeleteRevisionMenuOption,
    UnpublishPageMenuOption,
    EditRevisionMenuOption,
    PreviewRevisionMenuOption
} from "~/admin/plugins/pageDetails/pageRevisions/MenuOptions";
import { PageRevisionListItemGraphic } from "~/admin/plugins/pageDetails/pageRevisions/PageRevisionListItemGraphic";
import { PublishPageButton, usePage as usePageFromEditor } from "./pageEditor";
import { PreviewPage as PreviewPageMenuOption } from "./pageEditor/config/editorBar/PreviewPageButton/PreviewPageButton";
import {
    DeletePage,
    MovePage,
    EditPage,
    PreviewPage,
    ChangePageStatus,
    DuplicatePage
} from "~/admin/components/Table/Table";
import { usePage } from "~/admin/views/Pages/hooks/usePage";

export const Components = {
    PageList: {
        /**
         * This hooks provides access to the current page in the table row.
         */
        usePage,
        /**
         * These components are used to render page actions in the dropdown menu.
         */
        PageActions: {
            /**
             * This component renders the "Publish" and "Unpublish" page action.
             */
            ChangePageStatus,
            /**
             * This component renders the "Edit" page action.
             */
            EditPage,
            /**
             * This component renders the "Duplicate" page action.
             */
            DuplicatePage,
            /**
             * This component renders the "Delete" page action.
             */
            DeletePage,
            /**
             * This component renders the "Move To" page action.
             */
            MovePage,
            /**
             * This component renders the "Preview" page action.
             */
            PreviewPage
        }
    },
    PageDetails: {
        /**
         * This hooks provides access to the page in details drawer.
         */
        usePage: usePageDetailsPage,
        /**
         * These components are used in the toolbar of the page details drawer.
         */
        Toolbar: {
            /**
             * This component renders the "Publish" action, which published the current page revision.
             */
            PublishRevision: PagePublishRevision,
            /**
             * This component renders the "Edit" action, which takes the use to the Page Editor.
             */
            EditPage: EditPageInToolbar,
            /**
             * This component renders the "Delete" action, which deletes the entire page.
             */
            DeletePage: DeleteTheEntirePage,
            /**
             * This component renders the "Preview" action in the dropdown menu.
             */
            PreviewPage: PreviewPageToolbar,
            /**
             * This component renders the "Duplicate" action in the dropdown menu.
             */
            DuplicatePage: DuplicatePageToolbar
        },
        /**
         * These components are used in the page revisions tab, in the page details drawer.
         */
        Revisions: {
            /**
             * This hooks provides access to the current revision in the list.
             */
            useRevision: RevisionsList.useRevision,
            /**
             * This component is used in the list of revisions, located in the page details drawer.
             */
            ListItemGraphic: PageRevisionListItemGraphic,
            /**
             * These components are used in the revision actions dropdown menu.
             */
            Actions: {
                /**
                 * This component renders the "Publish Revision" action.
                 */
                PublishRevision: PublishPageMenuOption,
                /**
                 * This component renders the "Delete Revision" action.
                 */
                DeleteRevision: DeleteRevisionMenuOption,
                /**
                 * This component renders the "Unpublish Revision" action.
                 */
                UnpublishRevision: UnpublishPageMenuOption,
                /**
                 * This component renders the "Edit Revision" action.
                 */
                EditRevision: EditRevisionMenuOption,
                /**
                 * This component renders the "Preview Revision" action.
                 */
                PreviewRevision: PreviewRevisionMenuOption
            }
        }
    },
    PageEditor: {
        /**
         * This hook provides access to the page object in the Page Editor.
         */
        usePage: usePageFromEditor,
        /**
         * These components are rendered in the top editor toolbar.
         */
        Toolbar: {
            /**
             * This component renders a button to publish the page.
             */
            PublishPage: PublishPageButton,
            /**
             * This component renders an item in the dropdown menu.
             */
            PreviewPage: PreviewPageMenuOption
        }
    }
};
