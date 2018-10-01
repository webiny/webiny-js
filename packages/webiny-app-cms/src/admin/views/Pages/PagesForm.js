// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
// Webiny imports
import { i18n } from "webiny-app/i18n";
import { withRouter } from "webiny-app/components";
import { refreshDataList } from "webiny-app/actions";
import { withSnackbar } from "webiny-app-admin/components";

const t = i18n.namespace("Cms.PagesForm");

class PagesForm extends React.Component<*> {
    render() {
        return (
            <div>Page preview</div>
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
    /*withForm({
        name: "CmsCategoriesForm",
        type: "Cms.Categories",
        fields: "id name slug url layout"
    }),*/
)(PagesForm);
