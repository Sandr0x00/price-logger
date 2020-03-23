/* global loadingComp */

import {html} from 'lit-element';
import {BaseComp} from './base.js';

export class Sidebar extends BaseComp {

    static get properties() {
        return {
            items: Array,
            item: String,
            status: Boolean
        };
    }

    constructor() {
        super();
        loadingComp.open();
        this.items = [];
        this.loadItems();
        this.item = window.item;
        this.status = false;

        setInterval(() => {
            this.loadItems();
        }, 1000 * 60);
    }

    setCurrent(itemId) {
        if (this.item !== itemId) {
            this.item = itemId;
            console.log('setCurrent');
            loadingComp.navigate('/' + itemId);
        }
    }

    render() {
        if (!this.items || this.items.length == 0) {
            return html``;
        }

        let m = this.items.map(element => {
            return html`<a class="list-group-item items ${this.item == element.id ? 'current' : ''} ${element.active ? '' : 'inactive'}" data-id="${element.id}" id="${element.id}" onclick="sidebarComp.setCurrent('${element.id}')">${element.translation}</a>`;
        });

        loadingComp.close();
        return html`
<div class="list-group list-group-flush" id="sidebar">${m}</div>
<div id="status" class="list-group-item">
    <i class="fas fa-circle ${this.status ? 'active' : 'nactive'}"></i> Logger
</div>`;
    }

    loadItems() {
        fetch('/items').then(response => response.json()
        ).then(async data => {
            let arr = [];
            await Promise.all(data.map(async (item) => {
                arr.push(await fetch('/infos/' + item).then(resp => {
                    return resp.json();
                }).then((r) => {
                    return Promise.resolve({
                        id:item,
                        translation:r.title,
                        active: r.active
                    });
                }).catch(r => {
                    console.log(r);
                }));
            }));
            this.items = arr.sort((i) => i.active ? -1 : 1);
        // }).catch(err => {
            // console.log(err);
            // if (err) {
            //     dialogComp.show(err);
            // }
        });
        fetch('/status').then(response => response.json()
        ).then(data => {
            this.status = data.status;
        });
    }
}

customElements.define('sidebar-comp', Sidebar);