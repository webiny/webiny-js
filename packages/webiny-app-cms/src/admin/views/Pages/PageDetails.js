// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
// Webiny imports
import { withRouter, withForm } from "webiny-app/components";
import { refreshDataList } from "webiny-app/actions";
import { withSnackbar } from "webiny-app-admin/components";
import { Tabs, Tab } from "webiny-ui/Tabs";
import RenderElement from "webiny-app-cms/render/components/Element";
import RevisionActions from "./RevisionActions";

class PageDetails extends React.Component<*> {
    render() {
        const {
            CmsRevision: { data: revision }
        } = this.props;

        if (!revision) {
            return <div>Select a page on the left!</div>;
        }

        return (
            <React.Fragment>
                <RevisionActions revision={revision}/>
                <Tabs>
                    <Tab label={"Page preview"}>
                        <RenderElement element={revision.content}/>
                    </Tab>
                    <Tab label={"Stats"} />
                    <Tab label={"Revisions"} />
                </Tabs>
            </React.Fragment>
        );
    }
}

export default compose(
    connect(
        null,
        { refreshDataList }
    ),
    withSnackbar(),
    withRouter(),
    withForm({
        name: "CmsRevision",
        type: "Cms.Revisions",
        fields: "id name title slug content settings page { id, revisions { id name } }",
        tag: "cms-editor"
    })
)(PageDetails);
