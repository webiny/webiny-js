import React from "react";
import { getPlugins } from "@webiny/plugins";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";
import { Form } from "@webiny/form";
import { cloneDeep, debounce } from "lodash";
import { Grid, Cell } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
// import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";

const AppearanceTab = props => {
    const { getFieldPlugin } = useContentModelEditor();
    const {
        field,
        form: { Bind, data }
    } = props;

    // const renderPlugins = getPlugins<CmsEditorFieldRendererPlugin>();

    return (
        <Bind name={"appearance"}>
            {({ value: validationValue, onChange: onChangeValidation }) => (
                <SimpleForm>
                    <SimpleFormHeader title={"woah"} />
                    <Form
                        data={{}}
                        onChange={data => {
                            /*onFormChange({
                                 data,
                                 validationValue,
                                 onChangeValidation,
                                 validatorIndex
                             })*/
                        }}
                    >
                        {({ Bind, setValue }) => (
                            <SimpleFormContent>
                                <Grid>
                                    <Cell span={4}>12</Cell>
                                </Grid>
                            </SimpleFormContent>
                        )}
                    </Form>
                </SimpleForm>
            )}
        </Bind>
    );
};

export default AppearanceTab;
