import React from "react";
import { compose, withHandlers } from "recompose";
import { graphql } from "react-apollo";
import { withRouter } from "react-router-dom";
import { SplitView, LeftPanel, RightPanel } from "webiny-admin/components/SplitView";
import { withDataList } from "webiny-app/components";
import { withSnackbar } from "webiny-admin/components";
import FormsDataList from "./FormsDataList";
import FormDetails from "./FormDetails";
import { createForm, listForms } from "webiny-app-forms/admin/graphql/forms";
import { get } from "lodash";

class Forms extends React.Component {
    onSelect = category => {
        this.props.createForm(category.id);
    };

    render() {
        const { dataList } = this.props;
        return (
            <React.Fragment>
                <SplitView>
                    <LeftPanel span={4}>
                        <FormsDataList dataList={dataList} />
                    </LeftPanel>
                    <RightPanel span={8}>
                        <FormDetails refreshForms={dataList.refresh} />
                    </RightPanel>
                </SplitView>
            </React.Fragment>
        );
    }
}

export default compose(
    withSnackbar(),
    withRouter,
    graphql(createForm, { name: "createMutation" }),
    withDataList({
        query: listForms,
        response: data => {
            return get(data, "cms.forms", {});
        },
        variables: {
            sort: { savedOn: -1 }
        }
    }),
    withHandlers({
        createForm: ({ createMutation, history, showSnackbar }) => async category => {
            try {
                const res = await createMutation({ variables: { category } });
                const { data } = res.data.cms.form;
                history.push(`/cms/forms/${data.id}`);
            } catch (e) {
                showSnackbar(e.message);
            }
        }
    })
)(Forms);
