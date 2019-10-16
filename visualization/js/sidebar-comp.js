/* global loadingComp */

import {html} from 'lit-element';
import {BaseComp} from './base.js';

export class Sidebar extends BaseComp {

    static get properties() {
        return {
            items: Array,
            item: String
        };
    }

    constructor() {
        super();
        loadingComp.open();
        this.items = [];
        this.loadItems();
        this.item = window.item;

        setInterval(() => {
            this.loadItems();
        }, 1000 * 60);
    }

    setCurrent(itemId) {
        this.item = itemId;
        loadingComp.navigate('/' + itemId);
    }

    render() {
        if (!this.items || this.items.length == 0) {
            return html``;
        }

        let m = this.items.map(element => {
            return html`<a class="list-group-item items ${this.item == element.id ? 'current' : ''}" data-id="${element.id}" id="${element.id}" onclick="sidebarComp.setCurrent('${element.id}')">${element.translation}</a>`;
        });

        loadingComp.close();
        return html`
<div class="list-group list-group-flush" id="sidebar">${m}</div>
<div id="status">
    <span>
        <i id="statusVisu" class="fas fa-circle"></i> Visualization
        <span id="visuTime"></span>
    </span>
    <br>
    <span>
        <i id="statusLogger" class="fas fa-cicle"></i> Logger
        <span id="loggerTime"></span>
    </span>
</div>`;
    }

    loadItems() {
        fetch('/items').then(response => {
            if (response.status === 404) {
                return Promise.reject(`Recipe for "${this.recipe}" does not exist.`);
            }
            return response;
        }).then(response => response.json()
        ).then(async data => {
            let arr = [];
            await Promise.all(data.map(async (item) => {
                arr.push(await fetch('/infos/' + item).then(resp => {
                    return resp.json();
                }).then((r) => {
                    return Promise.resolve({
                        id:item,
                        translation:r.title
                    });
                }));
            }));
            this.items = arr;
        // }).catch(err => {
            // console.log(err);
            // if (err) {
            //     dialogComp.show(err);
            // }
        });
    }


    // loadStuff() {
    //     if (!this.recipe) {
    //         return;
    //     }
    //     fetch('/status').then(response => {
    //         if (response.status === 404) {
    //             return Promise.reject(`Recipe for "${this.recipe}" does not exist.`);
    //         }
    //         return response;
    //     }).then(response => response.json()
    //     ).then(data => {
    //         this.data = data;
    //         let visu = xhr.response['visu-state'];
    //         let visuTime = xhr.response['visu-time'];
    //         let logger = xhr.response['logger-state'];
    //         let loggerTime = xhr.response['logger-time'];
    //         if (visu === 'active') {
    //             $('#statusVisu').addClass('active');
    //             $('#visuTime').text(visuTime);
    //         } else {
    //             $('#statusVisu').removeClass('active');
    //             $('#visuTime').text('');
    //         }
    //         if (logger === 'active') {
    //             $('#statusLogger').addClass('active');
    //             $('#loggerTime').text(visuTime);
    //         } else {
    //             $('#statusLogger').removeClass('active');
    //             $('#loggerTime').text('');
    //         }
    //     }).catch(err => {
    //         if (err) {
    //             dialogComp.show(err);
    //         }
    //     });
    // }


}

customElements.define('sidebar-comp', Sidebar);