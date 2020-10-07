import * as React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { LIST_MENUS } from "./graphql";
import { Query } from "react-apollo";
import { get } from "lodash";
import styled from "@emotion/styled";
import { validation } from "@webiny/validation";
import { AutoComplete } from "@webiny/ui/AutoComplete";

const FormOptionsWrapper = styled("div")({
    minHeight: 250
});

const getOptions = ({ gqlData, settingsData }) => {

    const menuID = settingsData?.settings?.menu?.element;
    const menusList = gqlData?.pageBuilder?.menus?.data || [];
    const options = menusList.map(({ id, title, slug, description, items, createdOn }) => (
        { id, name: title, slug, items, description, createdOn }
    ));
    return {
        options,
        value: options.find(item => item.id === menuID) || null
    }
};


const MenuOptionsSettings = ({ Bind, data: settingsData }) => {
    console.log("MenuOptionsSettings::::::settings data::::");
    console.log(settingsData);
    return (
        <FormOptionsWrapper>
            <Query query={LIST_MENUS} fetchPolicy="network-only">
                {({ data: gqlData, loading, refetch }) => {
                    if (loading) {
                        return <div>Loading...</div>;
                    }
                    const { options, value } = getOptions({ gqlData, settingsData });
                    return (
                        <Grid>
                            <Cell span={12}>
                                <Bind
                                    name={"settings.menu.element"}
                                    validators={validation.create("required")}
                                >
                                    {({ onChange }) => (
                                        <AutoComplete
                                            options={options}
                                            value={value}
                                            onChange={onChange}
                                            label={"Menu"}
                                        />
                                    )}
                                </Bind>
                            </Cell>
                        </Grid>
                    );
                }}
            </Query>
        </FormOptionsWrapper>
    )
}

export default MenuOptionsSettings;