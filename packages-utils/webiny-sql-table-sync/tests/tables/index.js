import CustomDriver from "../customDriver/customDriver";
import { Table } from "webiny-sql-table";

class ExtendedTable extends Table {}
ExtendedTable.setDriver(new CustomDriver());

export class TableA extends ExtendedTable {}

TableA.setName("TableA");

export class TableB extends ExtendedTable {}

TableB.setName("TableB");
