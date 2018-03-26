import React from 'react';
import {Webiny} from 'webiny-client';

class Footer extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.state = {
            developerMode: false,
            links: [
                {
                    name: 'Webiny 2.0',
                    url: 'http://www.webiny.com/'
                }
                /* {
                 name: 'Legal',
                 url: '#'
                 },
                 {
                 name: 'Copyright',
                 url: '#'
                 },
                 {
                 name: 'Support',
                 url: '#'
                 } */
            ],
            linksSecondary: [
                /* {
                 name: 'Help',
                 url: '#'
                 },
                 {
                 name: 'Documentation',
                 url: '#'
                 },
                 {
                 name: 'GitHub',
                 url: '#'
                 } */
            ]
        };
    }

    renderLink(item, key) {
        return (
            <li key={key}>
                <a href={item.url} target="_blank">{item.name}</a>
            </li>
        );
    }
}

Footer.defaultProps = {
    renderer() {
        return false;

        /*
        return (
            <footer>
                <ul className="links">
                    {this.state.links.map(this.renderLink)}
                </ul>
                <ul className="links secondary">
                    {this.state.linksSecondary.map(this.renderLink)}
                </ul>
                <div className="dropdown sort feedback-wrap">
                    <button className="btn btn-default dropdown-toggle feedback" type="button">
                        <span className="icon icon-comments"></span>
                        <span>HELP US WITH FEEDBACK</span>
                    </button>
                </div>
            </footer>
        );
        */
    }
};

export default Footer;
