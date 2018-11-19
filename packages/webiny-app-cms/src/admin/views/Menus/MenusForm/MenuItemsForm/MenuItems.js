// @flow
import React from "react";
import ReactDOM from "react-dom";
import MenuItem from "./MenuItem";
import findObject from "./findObject";
import styled from "react-emotion";
import { get } from "lodash";
import $ from "jquery";

const Wrapper = styled("div")({
    ul: {
        listStyle: "none",
        li: {
            display: "inline-block",
            minWidth: 250,
            border: "1px solid #cdcdcd",
            padding: "6px 10px",
            margin: "0 0 10px 0",
            backgroundColor: "#f2f2f4",
            color: "#000",
            a: {
                float: "right"
            }
        }
    }
});

const placeholder = document.createElement("li");
placeholder.className = "the-hub-separator";

class MenuItems extends React.Component<*> {
    dragged: any = null;
    over: any = null;
    lastClientY: null;
    lastClientX: null;
    nodePlacement: null;
    processing: false;

    onDragStart = (e: *) => {
        if (this.dragged) {
            return;
        }
        this.dragged = $(e.currentTarget).closest('[data-role="item"]')[0];
        placeholder.style.height = $(this.dragged).height() + "px";
        // Firefox requires this to be set
        e.dataTransfer.setData("text/html", this.dragged);
    };

    /**
     * Drag end callback
     * @param e
     */
    onDragEnd = (e: *) => {
        if (!this.dragged) {
            return;
        }
        e.preventDefault();

        const { menuForm } = this.props;

        if (this.dragged.dataset.id !== this.over.dataset.id) {
            const data = menuForm.state.data.items;
            // Remove item being dragged from model
            const source = findObject(data, this.dragged.dataset.id);

            if (source) {
                source.source.splice(source.index, 1);

                // Insert item into the new position
                const target = findObject(data, this.over.dataset.id);
                if (this.over.classList && this.over.classList.contains("highlight")) {
                    // This is executed when item is being dropped on a highlighted item (meaning it has no child items)
                    if (target) {
                        target.item.items = target.item.items || [];
                        target.item.items.push(source.item);
                    }
                } else {
                    // This is executed when target item has children, we splice the existing items with the new item
                    target &&
                        target.source.splice(
                            this.nodePlacement === "after" ? target.index + 1 : target.index,
                            0,
                            source.item
                        );
                }
                menuForm.setState(state => {
                    state.items = data;
                    return state;
                });
            }
        }

        // Update UI
        const el = ReactDOM.findDOMNode(this); // eslint-disable-line
        this.dragged.style.display = "block";
        const highlightedItem = el.querySelector("li.highlight");
        if (highlightedItem) {
            highlightedItem.classList.remove("highlight");
        }
        el.querySelector(".the-hub-separator").parentNode.removeChild(placeholder);
        this.dragged = null;
    };

    onDragOver = (e: *) => {
        e.preventDefault();
        e.stopPropagation();

        // We don't do anything if nothing is being dragged or mouse position hadn't changed since last move
        if (!this.dragged || (this.lastClientY === e.clientY && this.lastClientX === e.clientX)) {
            return false;
        }

        const { menuForm } = this.props;

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
            const data = menuForm.state.data.items;
            const nestTarget = findObject(data, over.dataset.id);
            if (get(nestTarget.item, "items.length", 0) === 0) {
                over.classList.add("highlight");
            }
        }

        this.processing = false;
        return false;
    };

    render() {
        const { items, onChange, setCurrentItem } = this.props;
        const data = Array.isArray(items) ? [...items] : [];

        return (
            <Wrapper>
                <ul id="menu" onDragOver={this.onDragOver}>
                    {data.map((item, index) => {
                        const props = {
                            item,
                            index,
                            onDragStart: this.onDragStart,
                            onDragEnd: this.onDragEnd,
                            onEdit: setCurrentItem,
                            onDelete: id => {
                                const target = findObject(data, id);
                                target && target.source.splice(target.index, 1);
                                onChange(data);
                                setCurrentItem(null);
                            }
                        };
                        return <MenuItem key={index} {...props} />;
                    })}
                </ul>
            </Wrapper>
        );
    }
}

export default MenuItems;
