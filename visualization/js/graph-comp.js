/* global loadingComp, dialogComp */

import {html} from 'lit-element';
import {BaseComp} from './base.js';
import {initGraph, updateGraph} from './graph.js';

class Graph extends BaseComp {

    static get properties() {
        return {
            itemId: String,
            title: String,
            data: Object,
            url: String,
        };
    }

    constructor() {
        super();
        initGraph();
        this.urla = null;

        setInterval(() => {
            this.loadData();
        }, 30000);
    }

    shouldUpdate(changedProperties) {
        loadingComp.open();
        if (changedProperties.has('itemId') && this.itemId) {
            this.loadData();
        }
        return changedProperties.has('data');
    }


    render() {
        if (!this.data) {
            return html``;
        }
        loadingComp.close();
        let img = html`<div class="productImg placeholder blur" data-large="/img/${this.itemId}" style="background-image: url('/placeholder/${this.itemId}')"></div>`;
        if (this.url) {
            return html`<a class="productLink" href="${this.url ? this.url : '#'}">${img}</a>`;
        } else {
            return img;
        }
    }

    updated(changedProperties) {
        if (changedProperties.has('data') && this.data) {
            updateGraph(this.data);
            this.lazyLoadImg();
            document.title = `Price-Logger | ${this.title}`;
            window.history.pushState({'pageTitle':this.title}, '', '/#!/' + this.itemId);
        }
    }

    async lazyLoadImg(){
        let list = document.getElementsByClassName('placeholder');
        for (let i = 0; i < list.length; i++) {
            let element = list[i];
            let large = element.getAttribute('data-large');
            if (!large) {
                return;
            }
            let bgImg = new Image();
            bgImg.onload = () => {
                element.style['background-image'] = `url('${bgImg.src}')`;
                element.classList.remove('blur');
            };
            bgImg.src = large;
        }
    }

    loadData() {
        if (!this.itemId) {
            return;
        }
        fetch('/prices/' + this.itemId).then(response => {
            if (response.status === 404) {
                return Promise.reject(`Recipe for "${this.recipe}" does not exist.`);
            }
            return response;
        }).then(response => response.json()
        ).then(data => {
            this.data = data.prices;
            this.title = data.title ? data.title : data.id;
            this.url = data.url ? data.url : null;
        }).catch(err => {
            console.log(err);
            if (err) {
                dialogComp.show(err);
            }
        });
    }


    // setInterval(() => {
    //     loadStatus();
    // }, 10000);
}

customElements.define('graph-comp', Graph);