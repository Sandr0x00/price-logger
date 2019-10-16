import {html} from 'lit-element';
import Navigo from 'navigo';
import {BaseComp} from './base.js';

class Router extends BaseComp {
    static get properties() {
        return {
            route: Object,
        };
    }
    constructor() {
        super(); // Must call super in constructor
        window.router = new Navigo(null, true, '#!');
        window.router.on('/:id', (params) => {
            window.item = params.id;
            this.route = html`<graph-comp itemId="${params.id}"></graph-comp>`;
        }).on('*', () => {
            window.item = 'B078Y36QFJ';
            this.route = html`<graph-comp itemId="B078Y36QFJ"></graph-comp>`;
        }).resolve();
    }

    render() {
        return this.route;
    }
}
customElements.define('main-router', Router);