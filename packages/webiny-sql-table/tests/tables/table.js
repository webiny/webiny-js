import { Table as BaseTable } from "webiny-sql-table";
import CustomDriver from "./customDriver";

class Table extends BaseTable {}

Table.setDriver(new CustomDriver());

export default Table;
