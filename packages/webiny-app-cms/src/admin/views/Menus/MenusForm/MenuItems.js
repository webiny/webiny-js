// @flow
import React from "react";
import { css } from "emotion";
import uniqid from "uniqid";
import { Grid, Cell } from "webiny-ui/Grid";
import { Icon } from "webiny-ui/Icon";
import { Menu, MenuItem } from "webiny-ui/Menu";
import { ButtonPrimary } from "webiny-ui/Button";
import MenuItemsList from "./MenuItems/MenuItemsList";
import MenuItemForm from "./MenuItems/MenuItemForm";
import { ReactComponent as LinkIcon } from "./MenuItems/icons/round-link-24px.svg";
import { ReactComponent as FolderIcon } from "./MenuItems/icons/round-folder-24px.svg";
import { ReactComponent as PageIcon } from "./MenuItems/icons/round-subject-24px.svg";
import { ReactComponent as PagesIcon } from "./MenuItems/icons/round-format_list_bulleted-24px.svg";
import menuTypePresets from "./MenuItems/menuTypePresets";
import findObject from "./MenuItems/findObject";

const leftPanel = css({
    padding: 25,
    backgroundColor: "var(--mdc-theme-background)",
    overflow: "scroll"
});

type Props = {
    onChange: Function,
    value: any,
    menuForm: *
};

type State = {
    currentMenuItem: ?Object
};

class MenuItems extends React.Component<Props, State> {
    form = React.createRef();

    state = {
        currentMenuItem: null
    };

    editItem = (data: ?Object) => {
        this.setState({ currentMenuItem: data });
    };

    addItem = (type: string) => {
        const { onChange, value } = this.props;
        const newItem = { ...menuTypePresets[type].data(), id: uniqid() };
        onChange([...value, newItem]);
        this.editItem(newItem);
    };

    deleteItem = (item: Object) => {
        const { value, onChange } = this.props;
        const target = findObject(value, item.id);
        target && target.source.splice(target.index, 1);
        onChange(value);
        this.editItem(null);
    };

    render() {
        const { value: items, onChange } = this.props;
        const { currentMenuItem } = this.state;

        return (
            <>
                <Grid>
                    <Cell span={6} className={leftPanel}>
                        <MenuItemsList
                            menuForm={this.props.menuForm}
                            items={items}
                            onChange={onChange}
                            editItem={this.editItem}
                            deleteItem={this.deleteItem}
                        />
                    </Cell>
                    <Cell span={6}>
                        {!currentMenuItem && (
                            <>
                                <div style={{ textAlign: "center" }}>
                                    <p>
                                        To build your menu you need to create menu items!
                                        <br />
                                        Begin by clicking the "Add menu item" button
                                    </p>
                                    <br />
                                    <div style={{ width: 156, margin: "0 auto" }}>
                                        <Menu
                                            handle={<ButtonPrimary>+ Add menu item</ButtonPrimary>}
                                        >
                                            <MenuItem onClick={() => this.addItem("link")}>
                                                <Icon icon={<LinkIcon />} />
                                                &nbsp;&nbsp;Link
                                            </MenuItem>
                                            <MenuItem onClick={() => this.addItem("folder")}>
                                                <Icon icon={<FolderIcon />} />
                                                &nbsp;&nbsp;Folder
                                            </MenuItem>
                                            <MenuItem onClick={() => this.addItem("page")}>
                                                <Icon icon={<PageIcon />} />
                                                &nbsp;&nbsp;Page
                                            </MenuItem>
                                            <MenuItem onClick={() => this.addItem("pageList")}>
                                                <Icon icon={<PagesIcon />} />
                                                &nbsp;&nbsp;Page&nbsp;list
                                            </MenuItem>
                                        </Menu>
                                    </div>
                                </div>
                            </>
                        )}
                        {currentMenuItem && (
                            <MenuItemForm
                                currentMenuItem={currentMenuItem}
                                editItem={this.editItem}
                                items={items}
                                onChange={onChange}
                            />
                        )}
                    </Cell>
                </Grid>
            </>
        );
    }
}

export default MenuItems;
