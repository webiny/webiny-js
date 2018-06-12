// TODO: review all components and look for dynamic bindings inside `render()` method

import _ from "lodash";
import List from "./List";
import Table from "./Components/Table/Table";
import Row from "./Components/Table/Row";
import RowDetails from "./Components/Table/RowDetails";
import Field from "./Components/Table/Field";
import FieldInfo from "./Components/Table/FieldInfo";
import Header from "./Components/Table/Header";
import Footer from "./Components/Table/Footer";
import Filters from "./Components/Filters";
import FormFilters from "./Components/FormFilters";
import Pagination from "./Components/Pagination";
import MultiActions from "./Components/MultiActions";
import MultiAction from "./Components/MultiActions/MultiAction";
import ModalMultiAction from "./Components/MultiActions/ModalMultiAction";
import DeleteMultiAction from "./Components/MultiActions/DeleteMultiAction";
import SelectRowField from "./Components/Table/Fields/SelectRowField";
import DateTimeField from "./Components/Table/Fields/DateTimeField";
import DateField from "./Components/Table/Fields/DateField";
import TimeField from "./Components/Table/Fields/TimeField";
import PriceField from "./Components/Table/Fields/PriceField";
import NumberField from "./Components/Table/Fields/NumberField";
import FileSizeField from "./Components/Table/Fields/FileSizeField";
import CaseField from "./Components/Table/Fields/CaseField";
import ToggleField from "./Components/Table/Fields/ToggleField";
import TimeAgoField from "./Components/Table/Fields/TimeAgoField";
import GravatarField from "./Components/Table/Fields/GravatarField";
import RowDetailsField from "./Components/Table/Fields/RowDetailsField";
import Actions from "./Components/Table/Actions";
import Action from "./Components/Table/Actions/Action";
import RouteAction from "./Components/Table/Actions/RouteAction";
import EditAction from "./Components/Table/Actions/EditAction";
import ModalAction from "./Components/Table/Actions/ModalAction";
import DeleteAction from "./Components/Table/Actions/DeleteAction";
import EditModalAction from "./Components/Table/Actions/EditModalAction";
import Empty from "./Components/Table/Empty";

_.assign(List, {
    Table,
    MultiActions,
    MultiAction,
    ModalMultiAction,
    DeleteMultiAction,
    Filters,
    FormFilters,
    Pagination
});

_.assign(Table, {
    Header,
    Row,
    RowDetails,
    Field,
    FieldInfo,
    Footer,
    Empty,
    SelectRowField,
    DateTimeField,
    DateField,
    TimeField,
    FileSizeField,
    CaseField,
    ToggleField,
    TimeAgoField,
    PriceField,
    NumberField,
    GravatarField,
    RowDetailsField,
    Actions,
    Action,
    EditAction,
    RouteAction,
    ModalAction,
    DeleteAction,
    EditModalAction
});

export default List;
