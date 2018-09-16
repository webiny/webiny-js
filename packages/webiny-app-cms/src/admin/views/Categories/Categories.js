// @flow
import * as React from "react";
import { Elevation } from "webiny-ui/Elevation";
import { Grid, Cell } from "webiny-ui/Grid";
import CategoriesDataList from "./CategoriesDataList";
import CategoriesForm from "./CategoriesForm";

class Categories extends React.Component<*> {
    render() {
        return (
            <Elevation z={1}>
                <Grid>
                    <Cell span={6}>
                        <CategoriesDataList />
                    </Cell>
                    <Cell span={6}>
                        <CategoriesForm />
                    </Cell>
                </Grid>
            </Elevation>
        );
    }
}

export default Categories;
