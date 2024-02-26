import orderBy from "lodash/orderBy";

type ListOrderItem = `${string}_ASC` | `${string}_DESC`;
type ListOrder = ListOrderItem[];
interface OrderByField {
    field: string;
    order: "asc" | "desc";
}

export class Sorter<T> {
    private _order: OrderByField[];

    constructor(order: ListOrder) {
        this._order = this.parseOrder(order);
    }

    public sort(items: T[]): T[] {
        return orderBy(
            items,
            this._order.map(sort => sort.field),
            this._order.map(sort => sort.order)
        );
    }

    private parseOrder(order: ListOrder): OrderByField[] {
        return order.map(item => {
            const [field, order] = item.split("_");
            return { field, order: order.toLowerCase() as "asc" | "desc" };
        });
    }
}
