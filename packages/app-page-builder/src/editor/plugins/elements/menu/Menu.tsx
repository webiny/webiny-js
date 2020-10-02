import * as React from "react";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { get } from "lodash";
import { Form } from "@webiny/app-form-builder/components/Form";
//import { MenusForm } from "@webiny/app-page-builder/admin/views/Menus/MenusForm.tsx";
//import { Menu } from "@webiny/ui/Menu";
import styled from "@emotion/styled";
import { connect } from "react-redux";
//import { Query } from "react-apollo";
//import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
//import { LIST_MENUS } from "./graphql";
import { getPlugins } from "@webiny/plugins";
import { getActiveElementId } from "@webiny/app-page-builder/editor/selectors";
import { PbElement } from "@webiny/app-page-builder/types";

import { PbPageElementMenuComponentPlugin } from "@webiny/app-page-builder/types";

const Overlay = styled("div")({
    background: "black",
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 10,
    opacity: 0.25
});

export type MenuElementProps = {
    isActive: boolean;
    element: PbElement;
};

const Menu = (props: MenuElementProps) => {
    //menu data passed through here
    const { element, isActive } = props;
    console.log("MENU PROPS ::::;;;;");
    console.log(props);
 
    //get dtata from here
    //get(element, "data.settings.component", get(element, "settings.component"));
    const menuData = get(element, "data") || {};
    const component = getPlugins<PbPageElementMenuComponentPlugin>(
        "pb-page-element-menu-component"
    ).find(cmp => cmp.componentName === menuData.component);;

    let menu;
    console.log(menuData);
   
    if ('settings' in menuData) {
        menu = menuData.settings.menu.element;
    } else {
        return <div>Selected menu component not found!</div>;
    }

    const { component: MenuComponent } = component;

    if (!MenuComponent) {
        return <div>You must select a component to render your list!</div>;
    }

    //const menu = get(element, "data.settings.menu") || {};
    console.log("component, menu, MenuComponent ::::::::::");
    console.log(component);
    console.log(menu);
    console.log(MenuComponent);
 
    //
    let render = <span>Menu not selected.</span>;
    //console.log(vars);
    //const menu = components.find(cmp => cmp.componentName === component);
    //const { theme } = usePageBuilder();

    if (menu){
        console.log(menu);
        const props = {
            preview: true,
            menu: menu,
        };
 
        render = <MenuComponent {...props} />;
        /*render = (
            <Form {...menu} data={menu.element ? props.data : { items: [] }}>
                {({ data, form, Bind }) => (
                    <SimpleForm data-testid={"pb-menus-form"}>
                        {crudForm.loading && <CircularProgress />}
                        <SimpleFormContent>
                            <Grid>
                                <Cell span={6}>
                                    <Bind name="title" validators={validation.create("required")}>
                                        <Input label={t`Name`} />
                                    </Bind>
                                </Cell>
                                <Cell span={6}>
                                    <Bind name="slug" validators={validation.create("required")}>
                                        <Input disabled={data.id} label={t`Slug`} />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name="description">
                                        <Input rows={5} label={t`Description`} />
                                    </Bind>
                                </Cell>
                            </Grid>
                            <Bind name="items">
                                {props => <MenuItems menuForm={form} {...props} />}
                            </Bind>
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            <ButtonPrimary onClick={form.submit}>{t`Save menu`}</ButtonPrimary>
                        </SimpleFormFooter>
                    </SimpleForm>
                )}
            </Form>
        );*/
    }
    console.log("element:::::");
    console.log(element);
    console.log("render:::::");
    console.log(render);
    //removing key number menu.parent
    return (
        <>
            {isActive && <Overlay />}
            <ElementRoot
                key={`form-1`}
                element={element}
                className={"webiny-pb-element-form"}
            >
                {render}
            </ElementRoot>
        </>
    )
};

export default connect((state, props: any) => {
    return {
        isActive: getActiveElementId(state) === props.element.id
    };
})(Menu);