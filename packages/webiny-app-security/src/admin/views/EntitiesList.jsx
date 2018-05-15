import React from "react";
import gql from "graphql-tag";
// import ExportEntityModal from "./Modal/ExportModal";
// import ImportEntityModal from "./Modal/ImportModal";
import { app, i18n, createComponent } from "webiny-app";
import { default as EntitiesDataList } from "./components/EntitiesList";
const t = i18n.namespace("Security.EntitiesList");

class EntitiesList extends React.Component {
    toggleOperation(classId, operation, permissionsClass) {
        const mutation = gql`
            mutation {
                toggleEntityOperationPermission(
                    classId: "${classId}"
                    class: "${permissionsClass}"
                    operation: "${operation}"
                ) {
                   entity { classId } permissions { owner group other }
                }
            }
        `;

        app.graphql.mutate({ mutation }).then(({ data }) => {
            console.log("setam novo");
        });
    }

    render() {
        const {
            Link,
            ViewSwitcher,
            View,
            Button,
            ButtonGroup,
            AdminLayout,
            Icon
        } = this.props.modules;

        return (
            <AdminLayout>
                <ViewSwitcher>
                    <ViewSwitcher.View name="entitiesList" defaultView>
                        {({ showView }) => (
                            <View.List>
                                <View.Header
                                    title={t`Security - Entities`}
                                    description={
                                        <span>{t`Manage entities and its permissions`}</span>
                                    }
                                >
                                    <ButtonGroup>
                                        <Link type="primary" route="Entities.Create">
                                            <Icon icon="upload" />
                                            {t`Export`}
                                        </Link>
                                        <Button
                                            type="secondary"
                                            onClick={showView("importModal")}
                                            icon="download"
                                            label={t`Import`}
                                        />
                                    </ButtonGroup>
                                </View.Header>
                                <View.Body>
                                    <EntitiesDataList />
                                </View.Body>
                            </View.List>
                        )}
                    </ViewSwitcher.View>

                    {/*         <ViewSwitcher.View name="exportModal" modal>
                        {({ data: { data } }) => (
                            <ExportEntityModal
                                data={data}
                                api="/security/entities"
                                fields="name,slug,description,entities"
                                label={t`Entity`}
                            />
                        )}
                    </ViewSwitcher.View>

                    <ViewSwitcher.View name="importModal" modal>
                        {() => (
                            <ImportEntityModal
                                api="/security/entities"
                                label={t`Entity`}
                                onImported={() => this.list.loadData()}
                            />
                        )}
                    </ViewSwitcher.View>*/}
                </ViewSwitcher>
            </AdminLayout>
        );
    }
}

export default createComponent(EntitiesList, {
    modules: [
        { AdminLayout: "Admin.Layout" },
        "ViewSwitcher",
        "Link",
        "View",
        "Icon",
        "Grid",
        "Input",
        "Button",
        "ButtonGroup"
    ]
});
