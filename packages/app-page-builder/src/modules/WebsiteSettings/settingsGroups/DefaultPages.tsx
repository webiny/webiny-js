import React, { useCallback } from "react";
import { Bind } from "@webiny/form";
import { ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { usePbWebsiteSettings } from "../usePbWebsiteSettings";
import { PagesAutocomplete } from "~/admin/components/PagesAutocomplete";
import { ReactComponent as EditIcon } from "~/admin/assets/edit.svg";
import { WebsiteSettingsConfig } from "~/modules/WebsiteSettings/config/WebsiteSettingsConfig";

const Homepage = () => {
    const { settings, editPage } = usePbWebsiteSettings();
    const homePage = settings.pages?.home;

    const editButtonClickHandler = useCallback(() => {
        if (homePage) {
            editPage(homePage);
        }
    }, [homePage]);

    return (
        <Bind name={"pages.home"}>
            <PagesAutocomplete
                label={"Homepage"}
                description={`To set a different page, start typing its title and select it from the dropdown menu. Note that the page must be published in order to appear.`}
                trailingIcon={
                    <ButtonPrimary small disabled={!homePage} onClick={editButtonClickHandler}>
                        <ButtonIcon icon={<EditIcon />} />
                        Edit
                    </ButtonPrimary>
                }
            />
        </Bind>
    );
};

const NotFoundPage = () => {
    const { settings, editPage } = usePbWebsiteSettings();
    const notFoundPage = settings.pages?.notFound;

    const editButtonClickHandler = useCallback(() => {
        if (notFoundPage) {
            editPage(notFoundPage);
        }
    }, [notFoundPage]);

    return (
        <Bind name={"pages.notFound"}>
            <PagesAutocomplete
                label={"Not found (404) page"}
                description={`To set a different page, start typing its title and select it from the dropdown menu. Note that the page must be published in order to appear.`}
                trailingIcon={
                    <ButtonPrimary small disabled={!notFoundPage} onClick={editButtonClickHandler}>
                        <ButtonIcon icon={<EditIcon />} />
                        Edit
                    </ButtonPrimary>
                }
            />
        </Bind>
    );
};

const { Group, Element } = WebsiteSettingsConfig;

export const DefaultPages = () => {
    return (
        <WebsiteSettingsConfig>
            <Group name={"defaultPages"} label={"Default Pages"}>
                <Element name={"home"} element={<Homepage />} />
                <Element name={"notFound"} element={<NotFoundPage />} />
            </Group>
        </WebsiteSettingsConfig>
    );
};
