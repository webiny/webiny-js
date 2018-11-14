// @flow
import React from "react";
import MenuItem from "./MenuItem";
import findObject from "./findObject";
import styled from "react-emotion";

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

class MenuItems extends React.Component<*> {
    dragged = null;

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

    onDragOver = () => {};

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
                            onDrop: this.onDrop,
                            onEdit: setCurrentItem,
                            onDelete: id => {
                                const target = findObject(data, id);
                                target.source.splice(target.index, 1);
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
