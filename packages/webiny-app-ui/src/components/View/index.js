import View from "./View";
import ViewError from "./Error";
import FormView from "./FormView";
import ListView from "./ListView";
import DashboardView from "./DashboardView";
import ChartBlock from "./ChartBlock";
import InfoBlock from "./InfoBlock";
import Body from "./Body";
import Header from "./Header";
import Footer from "./Footer";
import HeaderCenter from "./DashboardComponents/HeaderCenter";

View.Form = FormView;
View.Error = ViewError;
View.List = ListView;
View.Dashboard = DashboardView;
View.Header = Header;
View.Header.Center = HeaderCenter;
View.Body = Body;
View.Footer = Footer;

View.ChartBlock = ChartBlock;
View.InfoBlock = InfoBlock;

export default View;
