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

    const output = {
        parents: {
            options: [],
            value: null
        }
    };

    const selected = {
        menus: get(settingsData, "settings.menu.element") || []
    };
    console.log("SELECTED > MENUS :::::::");
    console.log(selected.menus);

    const menusList = get(gqlData, "pageBuilder.menus.data") || [];

    output.parents.options = menusList.map(({ id, title, slug, description, items, createdOn }) => ({ id, name: title, slug, items, description, createdOn }));
    output.parents.value = output.parents.options.find(item => item.id === selected.menus) || null;

    return output;
};


const MenuDesignSettings = ({ Bind, data: settingsData }) => {
    console.log("MenuDesignSettings:::::::");
    console.log("settings data:::::")
    console.log(settingsData);
    return (
        <FormOptionsWrapper>
            <Query query={LIST_MENUS} fetchPolicy="network-only">
                {({ data: gqlData, loading, refetch }) => {
                    if (loading) {
                        return <div>Loading...</div>;
                    }
                    console.log("gqlResponse   options value:::::::s:::::");
                    console.log(gqlData);
                    const options = getOptions({ gqlData, settingsData });
                    console.log(options);
                    return (
                        <Grid>
                            <Cell span={12}>
                                <Bind
                                    name={"settings.menu.element"}
                                    validators={validation.create("required")}
                                >
                                    {({ onChange }) => (
                                        <AutoComplete
                                            options={options.parents.options}
                                            value={options.parents.value}
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

export default MenuDesignSettings;