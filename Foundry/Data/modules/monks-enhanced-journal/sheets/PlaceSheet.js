import { setting, i18n, log, makeid, MonksEnhancedJournal } from "../monks-enhanced-journal.js";
import { EnhancedJournalSheet } from "../sheets/EnhancedJournalSheet.js";

export class PlaceSheet extends EnhancedJournalSheet {
    constructor(data, options) {
        super(data, options);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: i18n("MonksEnhancedJournal.place"),
            template: "modules/monks-enhanced-journal/templates/sheets/place.html",
            tabs: [{ navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description" }],
            dragDrop: [
                { dragSelector: ".document.actor", dropSelector: ".place-container" },
                { dragSelector: ".document.item", dropSelector: ".place-container" },
                { dragSelector: ".sheet-icon", dropSelector: "#board" }
            ],
            scrollY: [".tab.entry-details .tab-inner", ".tab.townsfolk .tab-inner", ".tab.shops .tab-inner", ".tab.description .tab-inner"]
        });
    }

    static get type() {
        return 'place';
    }

    static get defaultObject() {
        return { shops: [], townsfolk: [], attributes: {} };
    }

    /*
    get allowedRelationships() {
        return ['organization', 'person', 'shop', 'poi', 'place'];
    }*/

    async getData() {
        let data = await super.getData();

        if (data?.data?.flags['monks-enhanced-journal']?.townsfolk) {
            data.data.flags['monks-enhanced-journal'].relationships = data?.data?.flags['monks-enhanced-journal']?.townsfolk;
            this.object.setFlag('monks-enhanced-journal', 'relationships', data.data.flags['monks-enhanced-journal'].relationships);
            this.object.unsetFlag('monks-enhanced-journal', 'townsfolk');
        }

        if (foundry.utils.hasProperty(data, "data.flags.monks-enhanced-journal.attributes")) {
            // check to make sure the attributes are formatted correctly
            let changedObjectValues = false;
            let sheetSettings = {};
            let attributes = data?.data?.flags['monks-enhanced-journal']?.attributes || {};
            for (let [k, v] of Object.entries(attributes)) {
                if (typeof v == "object") {
                    sheetSettings[k] = { shown: !v.hidden };
                    attributes[k] = v.value;
                    changedObjectValues = true;
                }
            }
            if (changedObjectValues) {
                await this.object.update({ 'monks-enhanced-journal.flags.sheet-settings.attributes': sheetSettings });
                await this.object.setFlag('monks-enhanced-journal', 'attributes', attributes);
            }
        } else if (foundry.utils.hasProperty(data, "data.flags.monks-enhanced-journal.fields")) {
            // convert fields to attributes
            let fields = foundry.utils.getProperty(data, "data.flags.monks-enhanced-journal.fields");
            let attributes = {};
            let sheetSettings = {};
            let flags = foundry.utils.getProperty(data, "data.flags.monks-enhanced-journal") || {};
            let defaultSettings = this.object.constructor.sheetSettings() || {};

            for (let attr of Object.keys(defaultSettings.attributes)) {
                attributes[attr] = flags[attr] || "";
                if (fields[attr] != undefined)
                    sheetSettings[attr].shown = !!fields[attr]?.value;
            }
            foundry.utils.setProperty(data, "data.flags.monks-enhanced-journal.attributes", attributes);
            foundry.utils.setProperty(data, "data.flags.monks-enhanced-journal.sheet-settings.attributes", sheetSettings);
            await this.object.setFlag('monks-enhanced-journal', 'attributes', attributes);
            await this.object.update({ 'monks-enhanced-journal.flags.sheet-settings.attributes': sheetSettings });
        }

        if (data?.data?.flags['monks-enhanced-journal']?.shops) {
            let relationships = data.data.flags['monks-enhanced-journal'].relationships || [];
            relationships = relationships.concat(data?.data?.flags['monks-enhanced-journal']?.shops);
            this.object.setFlag('monks-enhanced-journal', 'relationships', relationships);
            this.object.unsetFlag('monks-enhanced-journal', 'shops');
        }


        data.relationships = await this.getRelationships();
        data.shops = (data.relationships?.shop?.documents || []);
        data.townsfolk = (data.relationships?.person?.documents || []);
        delete data.relationships.shop;
        delete data.relationships.person;

        /*
        for (let item of (data.data.flags['monks-enhanced-journal'].relationships || [])) {
            let entity = await this.getDocument(item, "JournalEntry", false);
            if (!(entity instanceof JournalEntry || entity instanceof JournalEntryPage))
                continue;
            if (entity && entity.testUserPermission(game.user, "LIMITED") && (game.user.isGM || !item.hidden)) {
                let page = (entity instanceof JournalEntryPage ? entity : entity.pages.contents[0]);
                let type = foundry.utils.getProperty(page, "flags.monks-enhanced-journal.type");
                item.name = page.name;
                item.img = page.src;
                item.type = type;

                if (type == "shop") {
                    item.shoptype = page.getFlag("monks-enhanced-journal", "shoptype");
                    data.shops.push(item);
                } else if (type == "person") {
                    item.role = page.getFlag("monks-enhanced-journal", "role");
                    data.townsfolk.push(item);
                } else if(page instanceof JournalEntryPage) {
                    if (!data.relationships[type])
                        data.relationships[type] = { type: type, name: i18n(`MonksEnhancedJournal.${type.toLowerCase()}`), documents: [] };

                    data.relationships[type].documents.push(item);
                }
            }
        }
        */

        data.shops = data.shops.sort((a, b) => a.name.localeCompare(b.name));
        data.townsfolk = data.townsfolk.sort((a, b) => a.name.localeCompare(b.name));
        for (let [k, v] of Object.entries(data.relationships)) {
            v.documents = v.documents.sort((a, b) => a.name.localeCompare(b.name));
        }

        data.fields = this.fieldlist();

        data.has = {
            relationships: Object.keys(data.relationships || {})?.length,
            townsfolk: data.townsfolk?.length,
            shops: data.shops?.length
        }

        return data;
    }

    fieldlist() {
        let settings = this.sheetSettings() || {};
        let fields = MonksEnhancedJournal.convertObjectToArray(settings)?.attributes;
        let attributes = this.object.flags['monks-enhanced-journal'].attributes || {};
        return fields
            .filter(f => f.shown)
            .map(f => {
                let attr = attributes[f.id];
                return {
                    id: f.id,
                    name: f.name,
                    value: attr,
                    full: f.full
                }
            });
    }

    _documentControls() {
        let ctrls = [
            { text: '<i class="fas fa-search"></i>', type: 'text' },
            { id: 'search', type: 'input', text: i18n("MonksEnhancedJournal.SearchDescription"), callback: this.enhancedjournal.searchText },
            { id: 'show', text: i18n("MonksEnhancedJournal.ShowToPlayers"), icon: 'fa-eye', conditional: game.user.isGM, callback: this.enhancedjournal.doShowPlayers },
            { id: 'edit', text: i18n("MonksEnhancedJournal.EditDescription"), icon: 'fa-pencil-alt', conditional: this.isEditable, callback: () => { this.onEditDescription(); } },
            { id: 'sound', text: i18n("MonksEnhancedJournal.AddSound"), icon: 'fa-music', conditional: this.isEditable, callback: () => { this.onAddSound(); } },
            { id: 'convert', text: i18n("MonksEnhancedJournal.Convert"), icon: 'fa-clipboard-list', conditional: (game.user.isGM && this.isEditable), callback: () => { } }
        ];
        //this.addPolyglotButton(ctrls);
        return ctrls.concat(super._documentControls());
    }

    activateListeners(html, enhancedjournal) {
        super.activateListeners(html, enhancedjournal);

        $('.townsfolk .items-list h4', html).click(this.openRelationship.bind(this));
        $('.shops .items-list h4', html).click(this.openRelationship.bind(this));
        $('.relationships .items-list h4', html).click(this.openRelationship.bind(this));

        $('.item-action', html).on('click', this.alterItem.bind(this));
        $('.item-delete', html).on('click', $.proxy(this._deleteItem, this));
        $('.item-hide', html).on('click', this.alterItem.bind(this));

        //$('.item-relationship .item-field', html).on('change', this.alterRelationship.bind(this));
    }

    _getSubmitData(updateData = {}) {
        let data = foundry.utils.expandObject(super._getSubmitData(updateData));

        if (data.relationships) {
            data.flags['monks-enhanced-journal'].relationships = foundry.utils.duplicate(this.object.getFlag("monks-enhanced-journal", "relationships") || []);
            for (let relationship of data.flags['monks-enhanced-journal'].relationships) {
                let dataRel = data.relationships[relationship.id];
                if (dataRel)
                    relationship = foundry.utils.mergeObject(relationship, dataRel);
            }
            delete data.relationships;
        }

        if (data.flags['monks-enhanced-journal']?.attributes) {
            data.flags['monks-enhanced-journal'].attributes = foundry.utils.mergeObject((this.object?.flags['monks-enhanced-journal']?.attributes || {}), (data.flags['monks-enhanced-journal']?.attributes || {}));
        }

        return foundry.utils.flattenObject(data);
    }

    _canDragDrop(selector) {
        return game.user.isGM || this.object.isOwner;
    }

    async _onDrop(event) {
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        }
        catch (err) {
            return false;
        }

        if (data.type == 'JournalEntry') {
            this.addRelationship(data);
        } else if (data.type == 'JournalEntryPage') {
            let doc = await fromUuid(data.uuid);
            data.id = doc?.parent.id;
            data.uuid = doc?.parent.uuid;
            data.type = "JournalEntry";
            this.addRelationship(data);
        }

        log('drop data', event, data);
    }
}
