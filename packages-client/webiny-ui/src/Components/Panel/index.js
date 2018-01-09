import _ from 'lodash';
import Body from './Body';
import Header from './Header';
import Footer from './Footer';
import Panel from './Panel';

_.assign(Panel, {Header, Body, Footer});

export default Panel;
