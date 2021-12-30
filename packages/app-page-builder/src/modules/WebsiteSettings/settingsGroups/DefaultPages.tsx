import React from "react";
import { css } from "emotion";
import { Bind } from "@webiny/form";
import { ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { AddPbWebsiteSettings } from "../AddPbWebsiteSettings";
import { usePbWebsiteSettings } from "../usePbWebsiteSettings";
import { PagesAutocomplete } from "~/admin/components/PagesAutocomplete";
import { ReactComponent as EditIcon } from "~/admin/assets/edit.svg";

const { Group, Element } = AddPbWebsiteSettings;

const style = {
    moveTrailingIcon: css({
        ".rmwc-icon": {
            top: "11px !important"
        }
    })
};

const Homepage = () => {
    const { settings, editPage } = usePbWebsiteSettings();

    return (
        <Bind name={"pages.home"}>
            <PagesAutocomplete
                className={style.moveTrailingIcon}
                label={"Homepage"}
                description={`To set a different page, start typing its title and select it from the dropdown menu. Note that the page must be published in order to appear.`}
                trailingIcon={
                    <ButtonPrimary small onClick={() => editPage(settings.pages.home)}>
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

    return (
        <Bind name={"pages.notFound"}>
            <PagesAutocomplete
                className={style.moveTrailingIcon}
                label={"Not found (404) page"}
                description={`To set a different page, start typing its title and select it from the dropdown menu. Note that the page must be published in order to appear.`}
                trailingIcon={
                    <ButtonPrimary small onClick={() => editPage(settings.pages.notFound)}>
                        <ButtonIcon icon={<EditIcon />} />
                        Edit
                    </ButtonPrimary>
                }
            />
        </Bind>
    );
};

export const DefaultPages = () => {
    return (
        <Group name={"defaultPages"} label={"Default Pages"}>
            <Element>
                <Homepage />
            </Element>
            <Element>
                <NotFoundPage />
            </Element>
        </Group>
    );
};
