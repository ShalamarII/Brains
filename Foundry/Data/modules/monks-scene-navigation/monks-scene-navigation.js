﻿import { registerSettings } from "./settings.js";
export let debugEnabled = 0;

export let debug = (...args) => {
    if (debugEnabled > 1) console.log("DEBUG: monks-scene-navigation | ", ...args);
};
export let log = (...args) => console.log("monks-scene-navigation | ", ...args);
export let warn = (...args) => {
    if (debugEnabled > 0) console.warn("WARN: monks-scene-navigation | ", ...args);
};
export let error = (...args) => console.error("monks-scene-navigation | ", ...args);

export const setDebugLevel = (debugText) => {
    debugEnabled = { none: 0, warn: 1, debug: 2, all: 3 }[debugText] || 0;
    // 0 = none, warnings = 1, debug = 2, all = 3
    if (debugEnabled >= 3)
        CONFIG.debug.hooks = true;
};

export let i18n = key => {
    return game.i18n.localize(key);
};
export let setting = key => {
    return game.settings.get("monks-scene-navigation", key);
};

export let patchFunc = (prop, func, type = "WRAPPER") => {
    if (game.modules.get("lib-wrapper")?.active) {
        libWrapper.register("monks-scene-navigation", prop, func, type);
    } else {
        const oldFunc = eval(prop);
        eval(`${prop} = function (event) {
            return func.call(this, ${type != "OVERRIDE" ? "oldFunc.bind(this)," : ""} ...arguments);
        }`);
    }
}

Hooks.once('init', async function () {
    log('Initializing Monks Scene Navigation');
    registerSettings();

    const msn = initSceneNavigation();
    CONFIG.ui.nav = msn;

    patchFunc("Scene.prototype.activate", function (wrapped, ...args) {
        if (setting("minimize-activate")) {
            ui.nav.collapse();
        }
        return wrapped(...args);
    });
});

export default function initSceneNavigation() {
    return class MonksSceneNavigation extends CONFIG.ui.nav {
        constructor(folder, options = {}) {
            super(options);
            //this.folderid = folder;
            //this.templatepath = "./modules/monks-scene-navigation/templates/" + (folder == undefined ? "subnavigation.html" : "navigation.html");
        }

        static get defaultOptions() {
            return foundry.utils.mergeObject(super.defaultOptions, {
                id: "navigation",
                template: "./modules/monks-scene-navigation/templates/navigation.html",
                popOut: false,
                dragDrop: [{ dragSelector: ".scene,.folder", dropSelector: ".scene,.scene-list" }]
            });
        }

        get scenes() {
            if (!setting('modify-scene-bar'))
                return super.scenes;

            let folders = [];
            if (game.user.isGM || setting("player-folders")) {
                folders = ui.scenes.folders.filter(f => {
                    return true;
                });
                folders.sort((a, b) => a.sort - b.sort - 1);
            }

            //show the scene if the scene is active, or is currently being viewed, or can be navigated to
            let scenes = game.scenes.contents.filter(s => {
                return ((s.navigation && s.visible) || s.active || s.isView); // || s.permission > 3
            });
            scenes.sort((a, b) => a.navOrder - b.navOrder);

            return (game.settings.get("monks-scene-navigation", "folder-position") == "front" ? folders.concat(scenes) : scenes.concat(folders));
        }

        getData(options) {
            if (!setting('modify-scene-bar')) {
                options.template = "templates/hud/navigation.html";
                let data = super.getData(options);

                if (setting("display-realname") && game.user.isGM) {
                    data.scenes = data.scenes.map(s => {
                        if (s.name != s.tooltip && s.tooltip) {
                            let scene = game.scenes.get(s.id);
                            s.name = TextEditor.truncateText(scene.name, { maxLength: 30 });
                            let tooltip = scene.navName || scene.name;
                            s.tooltip = tooltip != s.name ? tooltip : null;
                            s.css += " italic";
                        }
                        return s;
                    });
                }
                return data;
            }

            let groups = [];
            const allscenes = this.scenes;

            // Modify Scene data
            let mapScenes = function (folder) { //flatten the scenes if not the GM
                let scenes = allscenes.filter(s => {
                    let folderid = s.folder?._id;
                    return folderid == folder?._id || (!game.user.isGM && !setting("player-folders"))
                });   
                scenes = scenes.map(s => {
                    if (s instanceof Scene) {
                        let users = game.users.contents
                            .filter(u => u.active && (u.viewedScene === s.id))
                            .map(u => { return { letter: u.name[0], color: u.color } });
                        if (folder && users.length)
                            folder.users = (folder.users || []).concat(users);
                        if (folder && s.active)
                            folder.active = true;

                        let data = s.toObject();
                        let navName = data.navName || data.name;
                        let realName = data.name;
                        let name = (setting("display-realname") && game.user.isGM ? realName : navName);
                        data.name = TextEditor.truncateText(name, { maxLength: 30 });
                        let tooltip = (game.user.isGM ? (setting("display-realname") ? navName : realName) : navName);
                        data.tooltip = tooltip != data.name ? tooltip : null;
                        data.users = users;
                        data.visible = (game.user.isGM || s.isOwner || s.active);
                        data.css = [
                            s.isView ? "view" : null,
                            s.active ? "active" : null,
                            data.ownership?.default === 0 ? "gm" : null,
                            name != tooltip ? "italic" : null
                        ].filter(c => !!c).join(" ");
                        return data;
                    } else if (game.user.isGM || setting("player-folders")) { //only tranverse the folders if it's the GM
                        let data = s.toObject();
                        data.name = TextEditor.truncateText(data.navName || data.name, { maxLength: 32 });
                        data.navopen = game.user.getFlag("monks-scene-navigation", "navopen" + data._id);
                        debug('folder check', data.navopen, data);
                        data.css = [
                            data.navopen ? "expanded" : null, "gm"
                        ].filter(c => !!c).join(" ");
                        data.directory = true;
                        data.scenes = mapScenes(data);

                        data.visible = (data.scenes.find(s => { return !s.directory || s.visible }) != undefined); //(data.scenes.length > 0); //(game.user.isGM && data.scenes.length > 0);

                        if (folder && data.users?.length)
                            folder.users = (folder.users || []).concat(data.users);
                        if (folder && data.active)
                            folder.active = true;

                        return data;
                    }
                });

                return scenes;
            }

            let makeGroup = function (parent) {
                let group = { folder: parent };
                groups.push(group);

                let folder = parent.scenes.find(s => s.directory && s.navopen && s.visible);
                if (folder) {
                    makeGroup(folder);
                }
            }

            let scenes = mapScenes();
            makeGroup({ scenes: scenes });

            if (groups.length == 0)
                groups = [{}];

            debug('get data', allscenes, groups);

            // Return data for rendering
            let color = game?.user?.flags?.PF2e?.settings?.color || 'blue';
            return {
                collapsed: this._collapsed,
                cssClass: [
                    setting('display-background') ? "background" : null,
                    color,
                    (this._collapsed ? 'collapsed' : null)
                ].filter(c => c !== null).join(" "),
                backButton: setting("add-back-button") == "everyone" || (setting("add-back-button") == "true" && game.user.isGM),
                groups: groups,
                isGM: game.user.isGM
            }
        }

        activateListeners(html) {
            super.activateListeners(html);

            // Click event listener
            const folders = html.find('.folder');
            folders.click(this._onClickFolder.bind(this));

            const scenes = html.find('.scene');
            scenes.dblclick(this._onClickScene2.bind(this));

            $('#nav-back').click(this._previousScene.bind(this));
        }

        /**
     * Expand the SceneNavigation menu, sliding it down if it is currently collapsed
     */
        expand() {
            if (!setting('modify-scene-bar'))
                return super.expand();

            if (!this._collapsed) return true;
            const nav = this.element;
            const icon = nav.find("#nav-toggle i.fas");
            const ul = $(".monks-scene-navigation .scene-list", nav);
            nav.removeClass("collapsed");
            return new Promise(resolve => {
                ul.slideDown(200, () => {
                    icon.removeClass("fa-caret-down").addClass("fa-caret-up");
                    this._collapsed = false;
                    Hooks.callAll("collapseSceneNavigation", this, this._collapsed);
                    return resolve(true);
                });
            });
        }

        /* -------------------------------------------- */

        /**
         * Collapse the SceneNavigation menu, sliding it up if it is currently expanded
         * @return {Promise<boolean>}
         */
        async collapse() {
            if (!setting('modify-scene-bar'))
                return super.collapse();

            if (this._collapsed) return true;
            const nav = this.element;
            const icon = nav.find("#nav-toggle i.fas");
            const ul = $(".monks-scene-navigation .scene-list", nav);
            return new Promise(resolve => {
                ul.slideUp(200, () => {
                    nav.addClass("collapsed");
                    icon.removeClass("fa-caret-up").addClass("fa-caret-down");
                    this._collapsed = true;
                    Hooks.callAll("collapseSceneNavigation", this, this._collapsed);
                    return resolve(true);
                });
            });
        }

        _getContextMenuOptions() {
            let contextmenu = super._getContextMenuOptions();
            let menu = contextmenu.findSplice(m => { return m.name == "SCENES.ToggleNav" });

            contextmenu.push(...[
                {
                    name: "MonksSceneNavigation.RemoveNav",
                    icon: '<i class="fas fa-compass"></i>',
                    condition: li => {
                        const scene = game.scenes.get(li.data("sceneId"));
                        return game.user.isGM && (!scene.active) && scene.navigation;
                    },
                    callback: li => {
                        const scene = game.scenes.get(li.data("sceneId"));
                        scene.update({ navigation: !scene.navigation });
                    }
                },
                {
                    name: "SCENES.ToggleNav",
                    icon: '<i class="fas fa-compass"></i>',
                    condition: li => {
                        const scene = game.scenes.get(li.data("sceneId"));
                        return game.user.isGM && (!scene.active) && !scene.navigation;
                    },
                    callback: li => {
                        const scene = game.scenes.get(li.data("sceneId"));
                        scene.update({ navigation: !scene.navigation });
                    }
                },
                {
                    name: "Set View Position",
                    icon: '<i class="fas fa-crop-alt"></i>',
                    condition: li => game.user.isGM && game.scenes.get(li.data("sceneId"))._view,
                    callback: li => {
                        let scene = game.scenes.get(li.data("sceneId"));
                        let x = parseInt(canvas.stage.pivot.x);
                        let y = parseInt(canvas.stage.pivot.y);
                        let scale = canvas.stage.scale.x;
                        scene.update({ initial: { x: x, y: y, scale: scale } }, { diff: false });
                        ui.notifications.info("Captured canvas position as initial view.")
                    }
                }
            ]);

            return contextmenu;
        }

        _onDragStart(event) {
            const folderId = event.currentTarget.dataset.folderId;
            if (folderId) {
                const folder = game.folders.get(folderId);
                event.dataTransfer.setData("text/plain", JSON.stringify(folder.toDragData()));
            } else
                super._onDragStart(event);
        }

        async _onDrop(event) {
            if (!setting('modify-scene-bar'))
                return super._onDrop(event);

            let dropTarget = ($(event.target).hasClass('scene-list') ? $('.scene:last', event.target).get(0) : event.target.closest(".scene")) || null;

            // Process drop data
            const data = TextEditor.getDragEventData(event);
            if (data.type == "Scene") {
                // Identify the document, the drop target, and the set of siblings
                const scene = await Scene.implementation.fromDropData(data);
                const sibling = dropTarget ? game.scenes.get(dropTarget.dataset.sceneId) : null;
                if (sibling && (sibling.id === scene.id)) return;
                const siblings = this.scenes.filter(s => s.id !== scene.id && s.folder == scene.folder && s instanceof Scene);

                // Update the navigation sorting for each Scene
                return scene.sortRelative({
                    target: sibling,
                    siblings: siblings,
                    sortKey: "navOrder"
                });
            } else if (data.type == "Folder") {
                const folder = await Folder.implementation.fromDropData(data);
                const sibling = dropTarget ? game.folders.get(dropTarget.dataset.folderId) : null;
                if (sibling && (sibling.id === folder.id)) return;
                const siblings = game.folders.filter(f => f.id !== folder.id && f.folder == folder.folder && f.type == "Scene");

                // Update the navigation sorting for each Scene
                return folder.sortRelative({
                    target: sibling,
                    siblings: siblings,
                    sortKey: "sort"
                });
            }
        }

        _previousScene(event) {
            if (ui.nav._lastScene)
                ui.nav._lastScene.view();
        }

        _onClickScene(event) {
            //delay for a bit just in case we're double clicking
            let that = this;
            let clickScene = super._onClickScene;
            window.setTimeout(function () {
                if (!that.doubleclick && !canvas.loading)
                    clickScene.call(that, event);
                delete that.doubleclick;
            }, 400);
        }

        _onClickScene2(event) {
            if (setting("doubleclick-activate")) {
                this.doubleclick = true;
                event.preventDefault();
                let sceneId = event.currentTarget.dataset.sceneId;
                game.scenes.get(sceneId).activate();
            }
        }

        _onClickFolder(event) {
            event.preventDefault();
            let folderId = event.currentTarget.dataset.folderId;

            let navopen = game.user.getFlag("monks-scene-navigation", "navopen" + folderId) || false;

            let updates = {};
            updates["navopen" + folderId] = !navopen;

            let scenes = this.scenes;
            let folder = scenes.find(f => f.id == folderId);

            let openfolder = scenes.filter(f => {
                return f instanceof Folder && game.user.getFlag("monks-scene-navigation", "navopen" + f.id) && f.id != folderId && f.folder == folder.folder;
            });
            if (openfolder.length != 0) {
                for (let fldr of openfolder) {
                    updates["navopen" + fldr._id] = false;
                }
            }

            game.user.update({ flags: {'monks-scene-navigation': updates}}).then(() => {
                ui.nav.render();
            });
        }

        async _render(force = false, options = {}) {
            let result = await super._render(force, options);

            if (!setting('modify-scene-bar')) {
                $("#scene-list").addClass("scene-list");
                if ((setting("add-back-button") == "everyone" || (setting("add-back-button") == "true" && game.user.isGM))) {
                    if ($('#nav-back').length == 0) {
                        let container = $('<div class="nav-item nav-item-container flexcol"></div>').insertAfter($('#nav-toggle'));
                        container.append($('#nav-toggle').removeClass("nav-item")).append($('<a id="nav-back" aria-label="Go back to previous Scene" role="button" data-tooltip="MonksSceneNavigation.GoBack" alt="Go back to previous Scene"><i class="fas fa-arrow-left"></i></a>').click(this._previousScene.bind(this)));
                    }
                }
            }

            return result;
        }
    }
}

Hooks.on("init", () => {
    SceneDirectory.prototype._toggleNavigation = function (event) {
        event.preventDefault();
        event.stopPropagation();

        const scene = game.scenes.get(this.dataset.documentId);
        scene.update({ navigation: !scene.navigation });
    }

    let oldContext = SceneDirectory.prototype._getEntryContextOptions;
    SceneDirectory.prototype._getEntryContextOptions = function () {
        let options = oldContext.call(this);
        let idx = options.findIndex(o => o.name === "SIDEBAR.Duplicate");
        if (idx != -1) {
            var permission = {
                name: "PERMISSION.Configure",
                icon: '<i class="fas fa-lock"></i>',
                condition: () => game.user.isGM,
                callback: li => {
                    const document = this.constructor.collection.get(li.data("documentId"));
                    let cls = DocumentOwnershipConfig;
                    new cls(document, {
                        top: Math.min(li[0].offsetTop, window.innerHeight - 350),
                        left: window.innerWidth - 720
                    }).render(true);
                }
            };
            options.splice(idx + 1, 0, permission);
        }
        /*
        let opt = options.find(o => o.name === "SCENES.ToggleNav");
        if (opt != undefined) {
            let oldcondition = opt.condition;
            opt.condition = (li) => {
                let result = true;
                if (oldcondition != undefined)
                    result = oldcondition.call(this, li);

                const scene = game.scenes.get(li.data("documentId"));
                if (result)
                    li.name = (scene.data.navigation ? "MonksSceneNavigation.RemoveNav" : "SCENES.ToggleNav");

                return result;
            }
        }*/
    
        return options;
    }

    if (setting("click-to-view")) {
        let clickDocumentName = function (wrapped, ...args) {
            let event = args[0];
            event.preventDefault();
            const document = this.constructor.collection.get(event.currentTarget.parentElement.dataset.documentId);
            if (document instanceof Scene)
                document.view();
            else
                wrapped(...args);
        };

        patchFunc("SceneDirectory.prototype._onClickEntryName", clickDocumentName, "MIXED");
    }

    /*
    if (setting("player-scene-directory")) {
        patchFunc("Sidebar.prototype.getData", function (wrapped, ...args) {
            let data = wrapped(...args);
            return game.user.isGM ? data : {
                tabs: {
                    chat: data.tabs.chat,
                    combat: data.tabs.combat,
                    scenes: {
                        tooltip: Scene.metadata.labelPlural,
                        icon: CONFIG.Scene.sidebarIcon
                    },
                    actors: data.tabs.actors,
                    items: data.tabs.items,
                    journal: data.tabs.journal,
                    tables: data.tabs.tables,
                    cards: data.tabs.cards,
                    playlists: data.tabs.playlists,
                    compendium: data.tabs.compendium,
                    settings: data.tabs.settings
                }
            };
        });

        patchFunc("SceneDirectory.prototype._render", async function (wrapped, ...args) {
            if (!game.user.isGM) {
                // Override the render
                let [force, context] = args;
                // Only re-render the sidebar directory for certain types of updates
                const { action, data, documentType } = context;
                if (action && !["create", "update", "delete"].includes(action)) return this;
                if ((documentType !== "Folder") && (action === "update") && !data.some(d => {
                    return this.options.renderUpdateKeys.some(k => k in d);
                })) return;

                // Re-build the tree and render
                this.initialize();

                let options = context;

                await loadTemplates([this.constructor.entryPartial, this.constructor.folderPartial]);

                // Do not render under certain conditions
                const states = Application.RENDER_STATES;
                this._priorState = this._state;
                if ([states.CLOSING, states.RENDERING].includes(this._state)) return;

                // Applications which are not currently rendered must be forced
                if (!force && (this._state <= states.NONE)) return;

                // Begin rendering the application
                if ([states.NONE, states.CLOSED, states.ERROR].includes(this._state)) {
                    console.log(`${vtt} | Rendering ${this.constructor.name}`);
                }
                this._state = states.RENDERING;

                // Merge provided options with those supported by the Application class
                foundry.utils.mergeObject(this.options, options, { insertKeys: false });
                options.focus ??= force;

                // Get the existing HTML element and application data used for rendering
                const element = this.element;
                this.appId = element.data("appid") ?? ++_appId;
                if (this.popOut) ui.windows[this.appId] = this;
                const renderData = await this.getData(this.options);

                // Store scroll positions
                if (element.length && this.options.scrollY) this._saveScrollPositions(element);

                // Render the inner content
                const inner = await this._renderInner(renderData);
                let html = inner;

                // If the application already exists in the DOM, replace the inner content
                if (element.length) this._replaceHTML(element, html);

                // Otherwise render a new app
                else {

                    // Wrap a popOut application in an outer frame
                    if (this.popOut) {
                        html = await this._renderOuter();
                        html.find(".window-content").append(inner);
                    }

                    // Add the HTML to the DOM and record the element
                    this._injectHTML(html);
                }

                if (!this.popOut && this.options.resizable) new Draggable(this, html, false, this.options.resizable);

                // Activate event listeners on the inner HTML
                this._activateCoreListeners(inner);
                this.activateListeners(inner);

                // Set the application position (if it's not currently minimized)
                if (!this._minimized) {
                    foundry.utils.mergeObject(this.position, options, { insertKeys: false });
                    this.setPosition(this.position);
                }

                // Apply focus to the application, maximizing it and bringing it to the top
                if (this.popOut && (options.focus === true)) this.maximize().then(() => this.bringToTop());

                // Dispatch Hooks for rendering the base and subclass applications
                this._callHooks("render", html, renderData);

                // Restore prior scroll positions
                if (this.options.scrollY) this._restoreScrollPositions(html);
                this._state = states.RENDERED;

                if (this._popout) await this._popout._render(force, options);
            }
            return wrapped(...args);
        });
    }*/

    let sceneView = function (wrapped, ...args) {
        ui.nav._lastScene = ui.nav._currentScene;
        ui.nav._currentScene = this;
        return wrapped(...args);
    };

    if (game.modules.get("lib-wrapper")?.active) {
        libWrapper.register("monks-scene-navigation", "Scene.prototype.view", sceneView, "MIXED");
    } else {
        const oldSceneView = Scene.prototype.view;
        Scene.prototype.view = function () {
            return sceneView.call(this, oldSceneView.bind(this), ...arguments);
        }
    }
});

Hooks.on("ready", () => {
    if (setting("minimize-activate")) {
        ui.nav.collapse();
    }
})

Hooks.on("renderPermissionControl", (app, html, options) => {
    if (app.object instanceof Scene) {
        $('option[value="1"],option[value="2"]', html).remove();
        $('option[value="3"]', html).html('Observer');
    }
});

Hooks.on("renderDocumentOwnershipConfig", (app, html, options) => {
    if (app.object instanceof Scene) {
        $('option[value="1"],option[value="2"]', html).remove();
        $('option[value="3"]', html).html('Observer');
    }
});

Hooks.on("renderSceneDirectory", (app, html, options) => {
    $(".document.scene h3.document-name:not(.entry-name)", html).addClass("entry-name");

    //add scene indicators
    if (setting("scene-indicator")) {
        $('li.scene', html).each(function () {
            let id = this.dataset.documentId;
            let scene = game.scenes.contents.find(s => { return s.id == id });
            if (scene != undefined) {
                //show active, if players can navigate
                $(this).toggleClass('navigate', scene.navigation);
                $(this).toggleClass('background', setting("directory-background"));
                $('h3 a', this).attr('title', $('h3 a', this).html());
                if (scene.active)
                    $('h3 a', this).prepend($('<i>').addClass('fas fa-bullseye'));

                if (scene.navigation || setting('quick-navigation') || scene.ownership.default > 0 || Object.keys(scene.ownership).length > 1) {
                    let permissions = $('<div>').addClass('permissions flexrow');
                    if (scene.navigation || setting('quick-navigation')) {
                        if (setting('quick-navigation'))
                            permissions.append($('<a>').append($('<i>').addClass('fas fa-compass').attr('title', 'Navigatable')).click(app._toggleNavigation.bind(this)));
                        else
                            permissions.append($('<i>').addClass('fas fa-compass').attr('title', 'Navigatable'));
                    }
                    if (scene.ownership.default > 0)
                        permissions.append($('<i>').addClass('fas fa-users').attr('title', 'Everyone'));
                    else {
                        for (let [key, value] of Object.entries(scene.ownership)) {
                            let user = game.users.find(u => {
                                return u.id == key && !u.isGM;
                            });
                            if(user != undefined && value > 0)
                                permissions.append($('<div>').css({ backgroundColor: user.color }).html(user.name[0]).attr('title', user.name));
                        }
                    }
                    $('h3', this).append(permissions);
                }
            }
        });
    }
    if (setting("smaller-directory") != "false") {
        let className = setting("smaller-directory") == "none" ? "noimage-directory" : "smaller-directory";
        if (setting("smaller-directory") == "side") className += " side-icon";
        $(html).addClass(className);
    }
});

Hooks.on("updateScene", (scene, data, options, userid) => {
    if (data.navigation != undefined)
        ui.scenes.render();
});

Hooks.on("updateCombat", async function (combat, delta) {
    if (setting("minimize-combat")) {
        if ((combat && (delta.round === 1 && combat.turn === 0 && combat.started === true))) {
            if (!ui.nav._collapsed) {
                if (!setting("restore")) {
                    //record the state it was in before combat starts, don't record a false if this is the second combat to start and the nav is already collapsed
                    game.settings.set("monks-scene-navigation", "restore", true);
                }
                ui.nav.collapse();
            }
        }
    }
});

Hooks.on("deleteCombat", function (combat) {
    if (setting("minimize-combat")) {
        //check to make sure there are no longer any active combats
        if (game.combats.active == undefined) {
            if (setting("restore")) {
                ui.nav.expand();
                game.settings.set("monks-scene-navigation", "restore", false);
            }
        }
    }
});
