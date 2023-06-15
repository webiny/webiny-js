import React from "react";
import { ReactComponent as CloseIcon } from "@material-design-icons/svg/outlined/close.svg";
import { IconButton } from "@webiny/ui/Button";
import { useFileManagerView, useFileManagerViewConfig } from "~/index";
import styled from "@emotion/styled";
import { Form, FormOnSubmit } from "@webiny/form";

const FiltersContainer = styled.div`
    width: 100%;
    height: auto;
    padding: 10px;
    background-color: var(--mdc-theme-surface);
    border-bottom: 1px solid var(--mdc-theme-on-background);
`;

const CloseButton = styled(IconButton)`
    position: absolute;
    top: 16px;
    right: 12px;
`;

export const Filters = () => {
    const { showingFilters, setFilters, hideFilters } = useFileManagerView();
    const { browser } = useFileManagerViewConfig();
    const filters = browser.filters || [];

    if (!showingFilters) {
        return null;
    }

    const applyFilters: FormOnSubmit = data => {
        if (!Object.keys(data).length) {
            return;
        }

        setFilters(data);
    };

    return (
        <FiltersContainer>
            <Form data={{}} onChange={applyFilters}>
                {() => (
                    <>
                        {filters.map(filter => (
                            <span key={filter.name}>{filter.element}</span>
                        ))}
                    </>
                )}
            </Form>
            <CloseButton onClick={hideFilters} icon={<CloseIcon />} />
        </FiltersContainer>
    );
};
