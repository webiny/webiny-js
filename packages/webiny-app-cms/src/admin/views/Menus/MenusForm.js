// @flow
import * as React from "react";
import { i18n } from "webiny-app/i18n";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import AddMenuItem from "./MenusForm/AddMenuItem";
// import MenuItem from "./MenusForm/MenuItem";
import type { WithCrudFormProps } from "webiny-app-admin/components";
import { withTheme, type WithThemeProps } from "webiny-app-cms/theme";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "webiny-app-admin/components/Views/SimpleForm";
import { findIndex, each, get } from "lodash";

const t = i18n.namespace("Cms.MenusForm");

type Props = WithCrudFormProps & WithThemeProps;
type State = {
    item: ?Object
};

// Generate ID string similar to MongoDB
function mongoId() {
    const s = x => Math.floor(x).toString(16);
    return s(Date.now() / 1000) + " ".repeat(16).replace(/./g, () => s(Math.random() * 16));
}

const Section = (props: any) => props.title;

class MenusForm extends React.Component<Props, State> {
    // dragged = null;
    state = {
        item: null
    };

    cancelMenuItem = () => {
        this.setState({ item: null });
    };

    /**
     * Recursively search for an object with given ID in the given source array
     * @param source
     * @param id
     * @returns {*}
     */
    findObject = (source, id) => {
        const index = findIndex(source, { id });
        if (index >= 0) {
            return { source, index, item: source[index] };
        }

        let res = null;
        each(source, s => {
            if (s.items) {
                const result = this.findObject(s.items, id);
                if (result) {
                    res = result;
                    return false;
                }
            }
        });
        return res;
    };

    // ---------------------------------------

    /*  /!**
     * Drag start callback
     * @param e
     *!/
    onDragStart = e => {
        if (this.dragged) {
            return;
        }
        this.dragged = $(e.currentTarget).closest('[data-role="item"]')[0];
        placeholder.style.height = $(this.dragged).height() + "px";
        // Firefox requires this to be set
        e.dataTransfer.setData("text/html", this.dragged);
    };

    /!**
     * Drag end callback
     * @param e
     *!/
    onDragEnd = e => {
        if (!this.dragged) {
            return;
        }
        e.preventDefault();

        if (this.dragged.dataset.id !== this.over.dataset.id) {
            const data = this.menuForm.getData("items");
            // Remove item being dragged from data
            const source = this.findObject(data, this.dragged.dataset.id);
            source.source.splice(source.index, 1);

            // Insert item into the new position
            const target = this.findObject(data, this.over.dataset.id);
            if (this.over.classList && this.over.classList.contains("highlight")) {
                // This is executed when item is being dropped on a highlighted item (meaning it has no child items)
                target.item.items = target.item.items || [];
                target.item.items.push(source.item);
            } else {
                // This is executed when target item has children, we splice the existing items with the new item
                target.source.splice(
                    this.nodePlacement === "after" ? target.index + 1 : target.index,
                    0,
                    source.item
                );
            }
            this.menuForm.setData({ items: data });
        }

        // Update UI
        const el = ReactDOM.findDOMNode(this);
        this.dragged.style.display = "block";
        const highlightedItem = el.querySelector("li.highlight");
        if (highlightedItem) {
            highlightedItem.classList.remove("highlight");
        }
        el.querySelector(".the-hub-separator").parentNode.removeChild(placeholder);
        this.dragged = null;
    };

    onDragOver = e => {
        e.preventDefault();
        e.stopPropagation();

        // We don't do anything if nothing is being dragged or mouse position hadn't changed since last move
        if (!this.dragged || (this.lastClientY === e.clientY && this.lastClientX === e.clientX)) {
            return false;
        }

        // Store current mouse position
        this.lastClientX = e.clientX;
        this.lastClientY = e.clientY;

        this.dragged.style.display = "none";

        let over = null;
        // Exit the function if element being dragged over is not a [data-role="item"] (or a child of it)
        if (e.target.nodeName !== "UL" && !e.target.classList.contains("the-hub-separator")) {
            over = $(e.target).closest('[data-role="item"]')[0];
        } else {
            return false;
        }

        this.over = over;

        // Calculate Y positions to determine where we should place the placeholder
        const overPosition = $(over).offset();
        overPosition.middle = overPosition.top + 38 / 2;
        const above = e.clientY < overPosition.middle - 5;
        const below = e.clientY > overPosition.middle + 5;
        const nest = !above && !below; // This means we are hovering right in the middle of an item

        const parent = over.parentNode;
        over.classList.remove("highlight");
        if (below) {
            this.nodePlacement = "after";
            parent.insertBefore(placeholder, over.nextElementSibling);
        } else if (above) {
            this.nodePlacement = "before";
            parent.insertBefore(placeholder, over);
        } else if (nest) {
            const data = this.menuForm.getData("items");
            const nestTarget = this.findObject(data, over.dataset.id);
            if (get(nestTarget.item, "items.length", 0) === 0) {
                over.classList.add("highlight");
            }
        }

        this.processing = false;
        return false;
    };*/

    render() {
        const { data, invalidFields, onSubmit } = this.props;
        /*
        const formProps = {
            ref: ref => this.menuForm = ref,
            api: '/entities/the-hub/menus',
            fields: '*,items',
            connectToRouter: true,
            onSubmitSuccess: 'TheHub.Menus.List',
            onCancel: 'TheHub.Menus.List'
        };
        */

        return (
            <Form data={{ items: [] }} invalidFields={invalidFields} onSubmit={onSubmit}>
                {({ data, form, Bind }) => (
                    <SimpleForm>
                        <SimpleFormContent>
                            <Grid>
                                <Cell span={6}>
                                    <Bind name="name" validators={["required"]}>
                                        <Input label={t`Name`} />
                                    </Bind>
                                </Cell>
                                <Cell span={6}>
                                    <Bind name="slug" validators={["required"]}>
                                        <Input disabled={data.id} label={t`Slug`} />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name="description">
                                        <Input rows={5} label={t`Description`} />
                                    </Bind>
                                </Cell>
                            </Grid>

                            <Grid>
                                <Cell all={4}>
                                    <Section
                                        title={this.state.item ? "Edit menu item" : "Add menu item"}
                                    />

                                    <Bind name="items">
                                        {({ onChange, value = [] }) => {
                                            console.log(value);
                                            return (
                                                <AddMenuItem
                                                    item={this.state.item}
                                                    onCancel={this.cancelMenuItem}
                                                    onSubmit={item => {
                                                        if (item.id) {
                                                            // console.log("wtf");
                                                            // const target = this.findObject(items, item.id);
                                                            // target.source[target.index] = item;
                                                        } else {
                                                            item.id = +new Date();
                                                        }

                                                        onChange([...value, item]);

                                                        /*setTimeout(() => {
                                                            console.log("setano u 'items'", data);
                                                        }, 500);*/
                                                    }}
                                                />
                                            );
                                        }}
                                    </Bind>
                                </Cell>
                                <Cell all={8}>
                                    <Section title="Menu structure" />
                                    {/*<ul className={css} id="menu" onDragOver={this.onDragOver}>
                                        {(data.items || []).map((item, index) => {
                                            const props = {
                                                key: index,
                                                item,
                                                index,
                                                onDragStart: this.onDragStart,
                                                onDragEnd: this.onDragEnd,
                                                // onDrop: this.onDrop,
                                                onEdit: i => this.setState({ item: i }),
                                                onDelete: id => {
                                                    const target = this.findObject(data.items, id);
                                                    target.source.splice(target.index, 1);
                                                    return () =>
                                                        form.setData({ items: data.items });
                                                }
                                            };
                                            return <MenuItem {...props} />;
                                        })}
                                    </ul>*/}
                                </Cell>
                            </Grid>
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            <ButtonPrimary type="primary" onClick={form.submit} align="right">
                                {t`Save menu`}
                            </ButtonPrimary>
                        </SimpleFormFooter>
                    </SimpleForm>
                )}
            </Form>
        );
    }
}

export default withTheme()(MenusForm);
