import React from "react";
import { ButtonDefault, ButtonPrimary } from "webiny-ui/Button";
import { Form } from "webiny-form";
import { SimpleForm, SimpleFormFooter, SimpleFormContent } from "webiny-app-admin/components/Views/SimpleForm";
import { Elevation } from "webiny-ui/Elevation";
import { dropdownStyle } from "./styled";

const SearchDropdown = ({ plugin, formData = {}, onSearch }) => {
    return (
        <Elevation z={2} className={dropdownStyle}>
            <Form data={formData} onSubmit={onSearch}>
                {({ Bind }) => (
                    <SimpleForm noElevation>
                        <SimpleFormContent>{plugin.renderFilters({ Bind })}</SimpleFormContent>
                        <SimpleFormFooter>
                            <ButtonDefault>Save filter</ButtonDefault>
                            <ButtonPrimary>Search</ButtonPrimary>
                        </SimpleFormFooter>
                    </SimpleForm>
                )}
            </Form>
        </Elevation>
    );
};

export default SearchDropdown;
