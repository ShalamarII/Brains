import { MonksEnhancedJournal, log, setting, i18n, makeid } from '../monks-enhanced-journal.js';

export class DCConfig extends FormApplication {
    constructor(object, journalentry, options = {}) {
        super(object, options);
        this.journalentry = journalentry;
    }

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "dc-config",
            classes: ["form", "dc-sheet"],
            title: i18n("MonksEnhancedJournal.DCConfiguration"),
            template: "modules/monks-enhanced-journal/templates/dc-config.html",
            width: 400
        });
    }

    static optionList() {
        let config = CONFIG[game.system.id.toUpperCase()] || {};
        if (game.system.id == "tormenta20")
            config = CONFIG.T20;
        else if (game.system.id == "shadowrun5e")
            config = CONFIG.SR5;

        const { lore, ...skills } = config.skillList || {};

        let attributeOptions = [
            { id: "ability", text: "MonksEnhancedJournal.Ability", groups: config.abilities || config.scores || config.atributos },
            { id: "save", text: "MonksEnhancedJournal.SavingThrow", groups: config.savingThrows || config.saves || config.saves_long || config.resistencias || config.abilities },
            { id: "skill", text: "MonksEnhancedJournal.Skill", groups: config.skills || config.pericias || skills }
        ];
        if (game.system.id == "pf2e")
            attributeOptions.push({ id: "attribute", text: i18n("MonksEnhancedJournal.Attribute"), groups: { perception: i18n("PF2E.PerceptionLabel") } });

        attributeOptions = attributeOptions.filter(g => g.groups);
        for (let attr of attributeOptions) {
            attr.groups = foundry.utils.duplicate(attr.groups);
            for (let [k, v] of Object.entries(attr.groups)) {
                attr.groups[k] = v?.label || v;
            }
        }

        return attributeOptions;
    }

    getData(options) {
        return foundry.utils.mergeObject(super.getData(options),
            {
                attributeOptions: DCConfig.optionList()
            }, { recursive: false }
        );
    }

    /* -------------------------------------------- */

    /** @override */
    async _updateObject(event, formData) {
        log('updating dc', event, formData, this.object);

        foundry.utils.mergeObject(this.object, formData);
        let dcs = foundry.utils.duplicate(this.journalentry.object.flags["monks-enhanced-journal"].dcs || []);
        if (this.object.id == undefined) {
            this.object.id = makeid();
            dcs.push(this.object);
        }
            
        this.journalentry.object.setFlag('monks-enhanced-journal', 'dcs', dcs);
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async close(options) {
        if (this.object.id && (this.object.attribute == 'undefined' || this.object.attribute.indexOf(':') < 0)) {
           this.journalentry.deleteItem(this.object.id, 'dcs');    //delete it if it wasn't created properly
        }
        return super.close(options);
    }
}