import { Table as BaseTable } from "./../..";
import CustomDriver from "./customDriver";

class Table extends BaseTable {}

Table.setDriver(new CustomDriver());

export default Table;
