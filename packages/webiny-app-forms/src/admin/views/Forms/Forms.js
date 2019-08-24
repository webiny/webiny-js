import React from "react";
import { compose } from "recompose";
import { graphql } from "react-apollo";
import { withRouter } from "react-router-dom";
import { SplitView, LeftPanel, RightPanel } from "webiny-app-admin/components/SplitView";
import { FloatingActionButton } from "webiny-app-admin/components/FloatingActionButton";
import { withDataList } from "webiny-app/components";
import { withSnackbar } from "webiny-app-admin/components";
import FormsDataList from "./FormsDataList";
import FormDetails from "./FormDetails";
import NewFormDialog from "./NewFormDialog";
import { createForm, listForms } from "webiny-app-forms/admin/viewsGraphql";
import { get } from "lodash";

function Forms(props) {
    const [newFormDialogOpened, openNewFormDialog] = React.useState(false);

    const { dataList } = props;
    return (
        <>
            <NewFormDialog open={newFormDialogOpened} onClose={() => openNewFormDialog(false)} />
            <SplitView>
                <LeftPanel span={4}>
                    <FormsDataList dataList={dataList} />
                </LeftPanel>
                <RightPanel span={8}>
                    <FormDetails refreshForms={dataList.refresh} />
                </RightPanel>
            </SplitView>
            <FloatingActionButton onClick={() => openNewFormDialog(true)} />
        </>
    );
}

export default compose(
    withSnackbar(),
    withRouter,
    graphql(createForm, { name: "createMutation" }),
    withDataList({
        query: listForms,
        response: data => {
            return get(data, "forms.listForms", {});
        },
        variables: {
            sort: { savedOn: -1 }
        }
    })
)(Forms);
