import React from "react";
import { Compose, Plugins } from "@webiny/app-admin";
import ApwAdminMenus from "./menus";
import routes from "./routes";
import defaultBar from "./editor/defaultBar";
// Plugins for "page builder"
import { ApwOnPublish } from "./pageBuilder/ApwOnPublish";
import { ApwOnPageDelete } from "./pageBuilder/ApwOnDelete";
import {
    PublishPageButtonHoc,
    PublishRevisionHoc,
    PublishPageMenuOptionHoc,
    PageRequestChangesHoc,
    PageRequestReviewHoc,
    PageRevisionListItemGraphicHoc
} from "./pageBuilder/PublishPageHocs";
// TODO: Fix this import so that we can import it from root level maybe
import PublishRevision from "@webiny/app-page-builder/admin/plugins/pageDetails/header/publishRevision/PublishRevision";
import { PublishPageMenuOption } from "@webiny/app-page-builder/admin/plugins/pageDetails/pageRevisions/PublishPageMenuOption";
import { PublishPageButtonComposable } from "@webiny/app-page-builder/editor/plugins/defaultBar/components/PublishPageButton";
import RequestReview from "@webiny/app-page-builder/admin/plugins/pageDetails/header/requestReview/RequestReview";
import RequestChanges from "@webiny/app-page-builder/admin/plugins/pageDetails/header/requestChanges/RequestChanges";
import { PageRevisionListItemGraphic } from "@webiny/app-page-builder/admin/plugins/pageDetails/pageRevisions/PageRevisionListItemGraphic";

export default () => [routes, defaultBar];

export const ApwAdmin = () => {
    return (
        <>
            <Compose with={PublishRevisionHoc} component={PublishRevision} />
            <Compose with={PublishPageMenuOptionHoc} component={PublishPageMenuOption} />
            <Compose with={PublishPageButtonHoc} component={PublishPageButtonComposable} />
            <Compose with={PageRequestReviewHoc} component={RequestReview} />
            <Compose with={PageRequestChangesHoc} component={RequestChanges} />
            <Compose
                with={PageRevisionListItemGraphicHoc}
                component={PageRevisionListItemGraphic}
            />
            <Plugins>
                <ApwAdminMenus />
                <ApwOnPublish />
                <ApwOnPageDelete />
            </Plugins>
        </>
    );
};
