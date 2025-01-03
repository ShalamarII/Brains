/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 586:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   _: () => (/* binding */ shieldOfMissileAttraction)
/* harmony export */ });
async function shieldOfMissileAttraction({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  //ItemMacro, isAttacked
  if (args[0].macroPass === 'isAttacked') {
    // Check if ranged weapon attack
    let actionType = workflow.item.system.actionType;
    if (actionType === 'rwak') {
      // Get token wielding the shield
      let tokenN = item.parent.token ?? item.parent.getActiveTokens()[0];

      // Swap original target for wielding token
      workflow.targets.delete(token);
      workflow.targets.add(tokenN);

      // Simulate attack for new target
      const dummyWorkflow = await new MidiQOL.DummyWorkflow(
        workflow.actor,
        workflow.item,
        ChatMessage.getSpeaker({ token: token.document }),
        new Set([tokenN])
      ).simulateAttack(tokenN);

      // Get advantage/disadvantage, if both cancel out
      let { advantage: oldAdv, disadvantage: oldDis } = workflow;
      let { advantage: newAdv, disadvantage: newDis } = dummyWorkflow;
      if (newAdv && newDis) {
        newAdv = false;
        newDis = false;
      }

      // Get original roll
      let oldRoll = workflow.attackRoll;
      let originalD20 = oldRoll.terms[0].results;

      // Roll new attack
      let newRoll = await workflow.item.rollAttack({
        fastForward: true,
        chatMessage: false,
        isDummy: true,
        advantage: newAdv,
        disadvantage: newDis,
      });

      // Replace new roll with old roll
      newRoll.terms[0].results[0].result = originalD20[0].result;
      if (newAdv || newDis) {
        // If original & new both have 2d20 replace the 2nd roll
        if (oldAdv || oldDis) {
          newRoll.terms[0].results[1].result = originalD20[1].result;
        }
      }
      for (let i = 1; i < oldRoll.terms.length; i++) {
        let oldTerm = oldRoll.terms[i];

        // If term was temp, add to formula
        if (!newRoll.terms[i]) {
          newRoll._formula += oldTerm.expression;
        }
        newRoll.terms[i] = oldTerm;
      }

      // Calc new total and apply
      newRoll._total = eval(newRoll.result);
      await workflow.setAttackRoll(newRoll);
    }
  }

  //Missile Resistance
  //ItemMacro, isDamaged
  if (args[0].macroPass === 'isHit') {
    let actionType = workflow.item.system.actionType;

    if (actionType === 'rwak') {
      // Get target token/actor
      let token = workflow.targets?.first();
      let target = token.actor;

      // Create a resistance effect
      let effectData = {
        changes: [
          {
            key: 'system.traits.dr.all',
            mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
            value: 1,
            priority: 20,
          },
        ],
        flags: {
          dae: { specialDuration: ['isDamaged'], stackable: 'noneName' },
        },
        name: 'Missile Resistance',
        origin: target.uuid,
      };

      // Apply the effect
      await MidiQOL.socket().executeAsGM('createEffects', {
        actorUuid: target.uuid,
        effects: [effectData],
      });
    }
  }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./scripts/constants.js
const moduleName = 'midi-item-showcase-community';

;// CONCATENATED MODULE: ./scripts/actors.js
async function setupActors() {
  let folder = game.folders.find(
    (i) => i.name === 'Midi Item Showcase - Community' && i.type === 'Actor'
  );
  if (!folder) {
    folder = await Folder.create({
      name: 'Midi Item Showcase - Community',
      type: 'Actor',
      color: '#018e5f',
    });
  }
  const actorsCompendium = game.packs.get(
    'midi-item-showcase-community.misc-actors'
  );
  if (!actorsCompendium) return;
  const documents = await actorsCompendium.getDocuments();
  if (documents.length === 0) return;
  for (const actor of documents) {
    if (folder.contents.find((act) => act.name === actor.name)) {
      continue;
    }
    let actorData = actor.toObject();
    actorData.folder = folder.id;
    await Actor.create(actorData);
  }
}

;// CONCATENATED MODULE: ./scripts/automations/macros/elwinsHelpers.js
// ##################################################################################################
// Read First!!!!
// World Scripter Macro.
// Mix of helper functions for macros.
// v2.7.1
// Dependencies:
//  - MidiQOL
//
// Usage:
// Add this macro to the World Scripter compendium or macro folder, or in your own world script.
//
// Description:
// This macro exposes mutiple utility functions used by different item macros.
// Exported functions (see each function for documentation):
// - elwinHelpers.isDebugEnabled
// - elwinHelpers.setDebugEnabled
// - elwinHelpers.doThirdPartyReaction
// - elwinHelpers.getTargetDivs
// - elwinHelpers.hasItemProperty
// - elwinHelpers.reduceAppliedDamage
// - elwinHelpers.calculateAppliedDamage
// - elwinHelpers.getMidiItemChatMessage
// - elwinHelpers.insertTextIntoMidiItemCard
// - elwinHelpers.requirementsSatisfied
// - elwinHelpers.selectTargetsWithinX
// - elwinHelpers.isRangedAttack
// - elwinHelpers.isRangedWeaponAttack
// - elwinHelpers.isMeleeAttack
// - elwinHelpers.isMeleeWeaponAttack
// - elwinHelpers.isMidiHookStillValid
// - elwinHelpers.getTokenName
// - elwinHelpers.getActorSizeValue
// - elwinHelpers.getSizeValue
// - elwinHelpers.buttonDialog
// - elwinHelpers.remoteButtonDialog
// - elwinHelpers.getAttackSegment
// - elwinHelpers.getMoveTowardsPosition
// - elwinHelpers.findMovableSpaceNearDest
// - elwinHelpers.convertCriticalToNormalHit
// - elwinHelpers.getDamageRollOptions
// - elwinHelpers.getMidiOnSavePropertyName
// - elwinHelpers.getAppliedEnchantments (dnd5e v3.2+ only)
// - elwinHelpers.deleteAppliedEnchantments (dnd5e v3.2+ only)
// - elwinHelpers.ItemSelectionDialog
// - elwinHelpers.TokenSelectionDialog
//
// Third party reaction framework:
// To use this new third party reaction framework you need to define an active effect (usually a transfer effect) using the following key and value:
//   Key: flags.midi-qol.onUseMacroName
//   Change Mode: Custom
//   Value: <macroRef>,<thirdPartyReactionTrigger>|<thirdPartyReactionOptions>
//
// The value is composed of three parts, the first two are similar to those used by normal MidiQOL onUseMacroName.
//   - macroRef: this can be an item macro, a macro, or a function, it uses the same syntax MidiQOL uses.
//   - thirdPartyReactionTrigger: currently supported values
//     - tpr.isTargeted: this is called in the "midi-qol.preValidateRoll" hook, which is just before it validates a target’s range from the attacker.
//     - tpr.isPreAttacked: this is called in the "midi-qol.preAttackRoll" hook, which is called before the attacker’s d20 roll.
//     - tpr.isAttacked: this is called in the "midi-qol.preCheckHits" hook, which is called after the attacker’s d20 roll but before validating if a target was hit or missed.
//     - tpr.isHit: this is called in the "midi-qol.hitsChecked" hook, which is called after MidiQOL validated that a target was hit.
//     - tpr.isMissed: this is called in the "midi-qol.hitsChecked" hook, which is called after MidiQOL validated that a target was missed.
//     - tpr.isPreDamaged: this is called in the "midi-qol.preDamageRoll" hook, which is called before the attacker's damage roll.
//     - tpr.isDamaged: this is called in the "midi-qol.preTargetDamageApplication", which is called after MidiQOL computed the damage to be dealt to a target but before it is applied.
//     - tpr.isHealed: this is called in the "midi-qol.preTargetDamageApplication", which is called after MidiQOL computed the healing to be done to a target but before it is applied.
//     - tpr.isPreCheckSave: this is called in the "midi-qol.preCheckSaves", which is called just before a saving throw check is asked from the target.
//     - tpr.isPostCheckSave: this is called in the "midi-qol.postCheckSaves", which is called after a saving throw check is asked from the target but before it is displayed.
//   - thirdPartyReactionOptions: The options consist of a list of parameter/value pairs separated by `;`. The parameter and its value is separated by a `=`.
//     - ignoreSelf: true or false to indicate if the owner being a target must not trigger the reaction. [default false]
//     - triggerSource: target or attacker, determines to whom the canSee option, the item’s range and target applies. [default target]
//     - canSee: true or false, if the trigger source must be seen or not by the owner. [default false]
//     - pre: true or false, indicates if a pre reaction macro should be called, its targetOnUse value will be the reaction trigger phase with a `.pre` suffix,
//            e.g.: `tpr.isHit.pre`. This macro is called in the triggering workflow.  [default false]
//     - post: true or false, indicates if a post reaction macro should be called, its targetOnUse value will be the reaction trigger phase with a `.post` suffix,
//             e.g.: `tpr.isHit.post`. This macro is called in the triggering workflow. [default false]
//
// Example: `ItemMacro,tpr.isDamaged|ignoreSelf=true;canSee=true;pre=true;post=true`
//
// TPR pre macro: It is always called before prompting, it is used to set things or cleanup things, it can also be used to add complex activation condition,
//                if it returnes the object {skip: true}, this reaction will not be prompted. This is called before the prompt in the workflow of the attacker.
// TPR post macro: It is always called after the prompt and execution of the selected reaction even it it was cancelled or a reaction was aborted.
//                 It should be used to cleanup and apply affects on the attacker's workflow if the proper reaction was chosen and was successful.
// The pre and post macros are called in the item use workflow, it means that any changes to the MidiQOL workflow are live. The macro parameters are the same as any macro call with an args[0].tag value of ‘TargetOnUse’.
//
// The TPR pre, reaction and TPR post are all executed in the same phase of the attacker's workflow. For example if tpr.isAttacked,
// they are executed after attack roll but before its evaluation for hit or miss.
//
// When the tpr reaction is called, the following attributes in options are available:
//   options.thirdPartyReaction.trigger: name of the tpr trigger, e.g.: tpr.isDamaged
//   options.thirdPartyReaction.itemUuids: array of reaction uuids that were prompted on a trigger for an actor owner of TPR reactions.
//   options.thirdPartyReaction.triggerSource: target or attacker, this depends on the value configured on the thirdPartyReactionOptions of the TPR active effect
//   options.thirdPartyReaction.targetUuid: UUID of the target of the item that triggered the TPR, only set if the triggerSource is attacker.
//   options.thirdPartyReaction.attackerUuid: UUID of the actor that used the item that triggered the TPR, only set if the triggerSource is target.
//
// The reaction condition data is augmented for third party reactions. The following extra attributes are available:
//   - tpr.item: reaction item roll data.
//   - tpr.actor: reaction item owner’s roll data.
//   - tpr.actorId: actor id of the reaction item owner’s.
//   - tpr.actorUuid: actor UUID of the reaction item owner’s.
//   - tpr.tokenId: token id associated with the reaction item owner’s.
//   - tpr.tokenUuid: token UUID associated with the reaction item owner’s.
//   - tpr.canSeeTriggerSource: boolean to indicate if the owner canSee the triggerSource, usually the target but in some cases the attacker.
//   - tpr.isMeleeAttack: boolean to indicate if the item that triggered the reaction is a melee attack.
//   - tpr.isMeleeWeaponAttack: boolean to indicate if the item that triggered the reaction is a melee weapon attack.
//   - tpr.isRangedAttack: boolean to indicate if the item that triggered the reaction is a ranged attack.
//   - tpr.isRangedWeaponAttack: boolean to indicate if the item that triggered the reaction is a ranged weapon attack.
//
// ###################################################################################################

function runElwinsHelpers() {
  const VERSION = '2.7.1';
  const MACRO_NAME = 'elwin-helpers';
  const active = true;
  let debug = false;
  let depReqFulfilled = false;

  const TPR_OPTIONS = ['triggerSource', 'ignoreSelf', 'canSee', 'pre', 'post'];

  /**
   * Third party reaction options.
   * @typedef {object} TprOptions
   * @property {string} triggerSource - The trigger source, allowed values are attacker or target.
   * @property {boolean} ignoreSelf - Flag to indicate if the owner beeing a target, can trigger the reaction or not.
   * @property {boolean} canSee - Flag to indidate if the owner must see the trigger source or not.
   * @property {boolean} pre - Flag to indicate if a pre macro most be called before prompting for reactions.
   * @property {boolean} post - Flag to indicate if a post macro most be called after prompting for reactions.
   *
   */
  /**
   * Token third party reactions info.
   * @typedef {object} TokenReactionsInfo
   * @property {ReactionData[]} reactions - List of reaction data associated to a token.
   * @property {boolean} canSeeAttacker - Flag to indicate of the owner of the reaction canSee the attacker.
   * @property {Map<Token5e, boolean>} canSeeTargets - Map of flags mapped by token to indicate if the owner of the reaction canSee a target.
   */

  /**
   * Token Third party reaction data.
   * @typedef {object} ReactionData
   * @property {Token5e} token - The token having the third party reaction.
   * @property {Item5e} item - The thrird party reaction item.
   * @property {string} macroName - The name of the macro or function to be called for pre/post macros.
   * @property {string} targetOnUse - The target on use that triggers this reaction.
   * @property {string} triggerSource - The trigger source, allowed values are attacker or target.
   * @property {boolean} canSee - Flag to indidate if the owner must see the trigger source or not.
   * @property {boolean} ignoreSelf - Flag to indicate if the owner beeing a target, can trigger the reaction or not.
   * @property {boolean} preMacro - Flag to indicate if a pre macro most be called before prompting for reactions.
   * @property {boolean} postMacro - Flag to indicate if a post macro most be called after prompting for reactions.
   */

  const dependencies = ['midi-qol'];
  if (requirementsSatisfied(MACRO_NAME, dependencies)) {
    depReqFulfilled = true;

    // Set a version to facilitate dependency check
    exportIdentifier('elwinHelpers.version', VERSION);

    // Set ReactionFilter only for midi version before 11.3.13
    if (
      !foundry.utils.isNewerVersion(
        game.modules.get('midi-qol').version ?? '0.0.0',
        '11.3.12.99'
      )
    ) {
      setHook(
        'midi-qol.ReactionFilter',
        'handleReactionFilterHookId',
        handleThirdPartyReactionFilter
      );
    }

    setHook('midi-qol.postStart', 'handlePostStart', handlePostStart);
    setHook(
      'midi-qol.preValidateRoll',
      'handlePreValidateRollId',
      handlePreValidateRoll
    );
    setHook(
      'midi-qol.preAttackRoll',
      'handlePreAttackRollId',
      handlePreAttackRoll
    );
    setHook(
      'midi-qol.preCheckHits',
      'handlePreCheckHitsId',
      handlePreCheckHits
    );
    setHook('midi-qol.hitsChecked', 'handleHitsCheckedId', handleHitsChecked);
    setHook(
      'midi-qol.preDamageRoll',
      'handlePreDamageRollId',
      handlePreDamageRoll
    );
    setHook(
      'midi-qol.preTargetDamageApplication',
      'handlePreTargetDamageApplId',
      handlePreTargetDamageApplication
    );
    setHook(
      'midi-qol.preCheckSaves',
      'handlePreCheckSavesId',
      handlePreCheckSaves
    );
    setHook(
      'midi-qol.postCheckSaves',
      'handlePostCheckSavesId',
      handlePostCheckSaves
    );
    if (
      foundry.utils.isNewerVersion(
        game.modules.get('midi-qol')?.version,
        '11.6'
      )
    ) {
      // Only supported since midi 11.6+
      setHook(
        'midi-qol.dnd5ePreCalculateDamage',
        'handleMidiDnd5ePreCalculateDamageId',
        handleMidiDnd5ePreCalculateDamage
      );
      setHook(
        'midi-qol.dnd5eCalculateDamage',
        'handleMidiDnd5eCalculateDamageId',
        handleMidiDnd5eCalculateDamage
      );
    }
    exportIdentifier('elwinHelpers.isDebugEnabled', isDebugEnabled);
    exportIdentifier('elwinHelpers.setDebugEnabled', setDebugEnabled);

    // Note: keep this name to be backward compatible
    exportIdentifier('MidiQOL_doThirdPartyReaction', doThirdPartyReaction);
    exportIdentifier('elwinHelpers.doThirdPartyReaction', doThirdPartyReaction);
    exportIdentifier('elwinHelpers.getTargetDivs', getTargetDivs);
    exportIdentifier('elwinHelpers.hasItemProperty', hasItemProperty);
    exportIdentifier('elwinHelpers.reduceAppliedDamage', reduceAppliedDamage);
    exportIdentifier(
      'elwinHelpers.calculateAppliedDamage',
      calculateAppliedDamage
    );
    exportIdentifier(
      'elwinHelpers.getMidiItemChatMessage',
      getMidiItemChatMessage
    );
    exportIdentifier(
      'elwinHelpers.insertTextIntoMidiItemCard',
      insertTextIntoMidiItemCard
    );
    exportIdentifier(
      'elwinHelpers.requirementsSatisfied',
      requirementsSatisfied
    );
    exportIdentifier('elwinHelpers.selectTargetsWithinX', selectTargetsWithinX);
    exportIdentifier('elwinHelpers.isRangedAttack', isRangedAttack);
    exportIdentifier('elwinHelpers.isRangedWeaponAttack', isRangedWeaponAttack);
    exportIdentifier('elwinHelpers.isMeleeAttack', isMeleeAttack);
    exportIdentifier('elwinHelpers.isMeleeWeaponAttack', isMeleeWeaponAttack);
    exportIdentifier('elwinHelpers.isMidiHookStillValid', isMidiHookStillValid);
    exportIdentifier('elwinHelpers.getTokenName', getTokenName);
    exportIdentifier('elwinHelpers.getActorSizeValue', getActorSizeValue);
    exportIdentifier('elwinHelpers.getSizeValue', getSizeValue);
    exportIdentifier('elwinHelpers.buttonDialog', buttonDialog);
    exportIdentifier('elwinHelpers.remoteButtonDialog', remoteButtonDialog);
    exportIdentifier('elwinHelpers.getAttackSegment', getAttackSegment);
    exportIdentifier(
      'elwinHelpers.getMoveTowardsPosition',
      getMoveTowardsPosition
    );
    exportIdentifier(
      'elwinHelpers.findMovableSpaceNearDest',
      findMovableSpaceNearDest
    );
    exportIdentifier(
      'elwinHelpers.convertCriticalToNormalHit',
      convertCriticalToNormalHit
    );
    exportIdentifier('elwinHelpers.getDamageRollOptions', getDamageRollOptions);
    exportIdentifier(
      'elwinHelpers.getMidiOnSavePropertyName',
      getMidiOnSavePropertyName
    );
    exportIdentifier(
      'elwinHelpers.disableManualEnchantmentPlacingOnUsePreItemRoll',
      disableManualEnchantmentPlacingOnUsePreItemRoll
    );
    if (foundry.utils.isNewerVersion(game.system.version, '3.2')) {
      exportIdentifier(
        'elwinHelpers.getAppliedEnchantments',
        getAppliedEnchantments
      );
      exportIdentifier(
        'elwinHelpers.deleteAppliedEnchantments',
        deleteAppliedEnchantments
      );
    }

    // Note: classes need to be exported after they are declared...

    registerRemoteFunctions();
  }

  /**
   * Returns the debug flag value. When true, items made by Elwin will output debug info.
   * @returns {boolean} the current debug flag value.
   */
  function isDebugEnabled() {
    return debug;
  }

  /**
   * Sets the debug flag value.
   * @param {boolean} Enabled - The new debug flag value.
   */
  function setDebugEnabled(enabled) {
    debug = enabled;
  }

  /**
   * If the requirements are met, returns true, false otherwise.
   *
   * @param {string} name - The name of the item for which to check the dependencies.
   * @param {string[]} dependencies - The array of module ids which are required.
   *
   * @returns {boolean} true if the requirements are met, false otherwise.
   */
  function requirementsSatisfied(name, dependencies) {
    let missingDep = false;
    dependencies.forEach((dep) => {
      if (!game.modules.get(dep)?.active) {
        const errorMsg = `${name} | ${dep} must be installed and active.`;
        ui.notifications.error(errorMsg);
        console.warn(errorMsg);
        missingDep = true;
      }
    });
    return !missingDep;
  }

  /**
   * Removes the previous hook is defined and register a new hook if the macro is active.
   *
   * @param {string} hookName the name of the hook event on which to register the function.
   * @param {string} hookNameId the name of the hook, used for saving a reference to the registered hook.
   * @param {function} hookFunction the function to register on the hook event.
   */
  function setHook(hookName, hookNameId, hookFunction) {
    const hookId = foundry.utils.getProperty(
      globalThis,
      `${MACRO_NAME}.${hookNameId}`
    );
    if (hookId) {
      Hooks.off(hookName, hookId);
    }
    if (active) {
      foundry.utils.setProperty(
        globalThis,
        `${MACRO_NAME}.${hookNameId}`,
        Hooks.on(hookName, hookFunction)
      );
    }
  }

  /**
   * Removes a previously exported function or variable and exports the specifed function or variable if the macro is active.
   *
   * @param {string} exportedIdentifierName the name of the exported function.
   * @param {function} exportedValue the function or variable to export.
   */
  function exportIdentifier(exportedIdentifierName, exportedValue) {
    if (foundry.utils.getProperty(globalThis, exportedIdentifierName)) {
      const lastIndex = exportedIdentifierName.lastIndexOf('.');
      if (lastIndex < 0) {
        delete globalThis[exportedIdentifierName];
      } else {
        delete foundry.utils.getProperty(
          globalThis,
          exportedIdentifierName.substring(0, lastIndex)
        )[exportedIdentifierName.substring(lastIndex + 1)];
      }
    }
    if (active) {
      foundry.utils.setProperty(
        globalThis,
        exportedIdentifierName,
        exportedValue
      );
    }
  }

  /**
   * Filters the received reactions. If the item that triggered the manual reaction is a
   * third party reaction source item, removes all reactions that are not the source item.
   *
   * @param {Array} reactions Array of reaction items and/or Magic Items 2 references.
   * @param {object} options Reaction options (should contain the item that triggered the reaction)
   * @param {string} triggerType Type of reaction that was triggered.
   * @param {Array} reactionItemList list of reaction item UUIDs and/or Magic Items 2 references.
   *
   * @returns {boolean} true if the filtered reactions contains at least one item, false otherwise.
   */
  function handleThirdPartyReactionFilter(reactions, options, triggerType, _) {
    if (debug) {
      console.warn(`${MACRO_NAME} | handleThirdPartyReactionFilter`, {
        reactions,
        options,
        triggerType,
      });
    }
    // Only filter when reactionmanual was triggered and the item triggering it was a third party reaction.
    if (
      triggerType !== 'reactionmanual' ||
      !options?.thirdPartyReaction?.trigger ||
      !options?.thirdPartyReaction?.itemUuid
    ) {
      return true;
    }
    // Only keep manual reactions matching item uuid
    const reactionToKeep = reactions.find(
      (itemRef) =>
        itemRef instanceof CONFIG.Item.documentClass &&
        itemRef.uuid === options?.thirdPartyReaction?.itemUuid
    );
    reactions.length = 0;
    if (reactionToKeep) {
      reactions.push(reactionToKeep);
    }
    return reactions.length > 0;
  }

  /**
   * Registers all the third party reactions from all the current tokens on the scene.
   * @param {MidiQOL.Workflow} workflow - The current MidiQOL workflow.
   */
  async function handlePostStart(workflow) {
    if (debug) {
      console.warn(`${MACRO_NAME} | handlePostStart.`, workflow);
    }
    for (let token of game.canvas.tokens.placeables) {
      const actorOnUseMacros = foundry.utils.getProperty(
        token.actor ?? {},
        'flags.midi-qol.onUseMacroParts'
      );
      if (!actorOnUseMacros) {
        // Skip this actor does not have any on use macros
        continue;
      }
      await registerThirdPartyReactions(
        workflow,
        token,
        actorOnUseMacros.items.filter((m) => m.option.startsWith('tpr.'))
      );
    }
  }

  /**
   * Triggers isTargeted third party reactions.
   * @param {MidiQOL.Workflow} workflow - The current MidiQOL workflow.
   */
  async function handlePreValidateRoll(workflow) {
    if (debug) {
      console.warn(`${MACRO_NAME} | handlePreValidateRoll.`, workflow);
    }

    await handleThirdPartyReactions(workflow, ['isTargeted']);
  }

  /**
   * Triggers isPreAttacked third party reactions.
   * @param {MidiQOL.Workflow} workflow - The current MidiQOL workflow.
   */
  async function handlePreAttackRoll(workflow) {
    if (debug) {
      console.warn(`${MACRO_NAME} | handlePreAttackRoll.`, workflow);
    }

    await handleThirdPartyReactions(workflow, ['isPreAttacked']);
  }

  /**
   * Triggers isAttacked third party reactions.
   * @param {MidiQOL.Workflow} workflow - The current MidiQOL workflow.
   * @param {object} options - Options passed by midi qol.
   */
  async function handlePreCheckHits(workflow, options) {
    if (debug) {
      console.warn(`${MACRO_NAME} | handlePreCheckHits.`, {
        workflow,
        options,
      });
    }

    await handleThirdPartyReactions(workflow, ['isAttacked'], options);
  }

  /**
   * Triggers isHit and isMissed third party reactions.
   * @param {MidiQOL.Workflow} workflow - The current MidiQOL workflow.
   * @param {object} options - Options passed by midi qol.
   */
  async function handleHitsChecked(workflow, options) {
    if (debug) {
      console.warn(`${MACRO_NAME} | handleHitsChecked.`, { workflow, options });
    }

    await handleThirdPartyReactions(workflow, ['isHit', 'isMissed'], options);
  }

  /**
   * Triggers isPreDamaged third party reactions.
   * @param {MidiQOL.Workflow} workflow - The current MidiQOL workflow.
   */
  async function handlePreDamageRoll(workflow) {
    if (debug) {
      console.warn(`${MACRO_NAME} | handlePreDamageRoll.`, workflow);
    }

    await handleThirdPartyReactions(workflow, ['isPreDamaged']);
  }

  /**
   * Triggers isDamaged or isHealed third party reactions.
   *
   * @param {Token5e} target - The target that is damaged/healed.
   * @param {object} options - Options passed by midi qol.
   */
  async function handlePreTargetDamageApplication(target, options) {
    if (debug) {
      console.warn(`${MACRO_NAME} | handlePreTargetDamageApplication.`, {
        target,
        options,
      });
    }
    let appliedDamage = options?.damageItem?.appliedDamage;
    if (!appliedDamage) {
      // compute total damage applied to target
      appliedDamage = options?.damageItem?.damageDetail.reduce(
        (total, d) =>
          total + (['temphp', 'midi-none'].includes(d.type) ? 0 : d.value),
        0
      );
      appliedDamage =
        appliedDamage > 0
          ? Math.floor(appliedDamage)
          : Math.ceil(appliedDamage);
    }

    if (
      options?.damageItem &&
      appliedDamage !== 0 &&
      (options.workflow.hitTargets.has(target) ||
        options.workflow.hitTargetsEC.has(target) ||
        options.workflow.saveItem.hasSave)
    ) {
      // Set our own total damage to make sure it is available, currently midi does not provide a total of the non RAW damage
      options.damageItem.elwinHelpersEffectiveDamage = appliedDamage;
      const conditionAttr = 'workflow.damageItem?.elwinHelpersEffectiveDamage';
      if (appliedDamage > 0) {
        await handleThirdPartyReactions(options.workflow, ['isDamaged'], {
          item: options?.item,
          target,
          extraActivationCond: `${conditionAttr} > 0`,
        });
      } else {
        await handleThirdPartyReactions(options.workflow, ['isHealed'], {
          item: options?.item,
          target,
          extraActivationCond: `${conditionAttr} < 0`,
        });
      }
    }
  }

  /**
   * Triggers isPreCheckSave third party reactions.
   * @param {MidiQOL.Workflow} workflow - The current MidiQOL workflow.
   */
  async function handlePreCheckSaves(workflow) {
    if (debug) {
      console.warn(`${MACRO_NAME} | handlePreCheckSaves.`, { workflow });
    }

    await handleThirdPartyReactions(workflow, ['isPreCheckSave']);
  }

  /**
   * Handles the midi pre calculate damage hook event to cleanup any custom damage details before computing damage.
   *
   * @param {Actor5e} actor - The actor being damaged.
   * @param {DamageDescription[]} damages - Damage descriptions.
   * @param {DamageApplicationOptions} options - Additional damage application options.
   * @returns {boolean} Explicitly return `false` to prevent damage application.
   *
   */
  function handleMidiDnd5ePreCalculateDamage(actor, damages, options) {
    // Remove any custom damage prevention
    while (
      damages.find((di, idx) => {
        if (di.type === 'none' && di.active?.DP) {
          damages.splice(idx, 1);
          return true;
        }
        return false;
      })
    );
  }

  /**
   * Handles the midi calculate damage hook event to process damagePrevention option.
   *
   * @param {Actor5e} actor - The actor being damaged.
   * @param {DamageDescription[]} damages - Damage descriptions.
   * @param {DamageApplicationOptions} options - Additional damage application options.
   * @returns {boolean} Explicitly return `false` to prevent damage application.
   */
  function handleMidiDnd5eCalculateDamage(actor, damages, options) {
    if (!(options.elwinHelpers?.damagePrevention > 0)) {
      // No damage prevention or not valid
      return true;
    }
    const totalDamage = damages.reduce(
      (total, damage) =>
        total +
        (['temphp', 'midi-none'].includes(damage.type) ? 0 : damage.value),
      0
    );
    if (totalDamage <= 0) {
      // No damage to prevent, do nothing
      return true;
    }
    const damagePrevention = Math.min(
      options.elwinHelpers.damagePrevention,
      totalDamage
    );
    if (damagePrevention) {
      damages.push({
        type: 'none',
        value: -damagePrevention,
        active: { DP: true, multiplier: 1 },
        properties: new Set(),
      });
    }
    return true;
  }

  /**
   * Triggers isPostCheckSave third party reactions.
   * @param {MidiQOL.Workflow} workflow - The current MidiQOL workflow.
   */
  async function handlePostCheckSaves(workflow) {
    if (debug) {
      console.warn(`${MACRO_NAME} | handlePostCheckSaves.`, { workflow });
    }

    await handleThirdPartyReactions(workflow, ['isPostCheckSave']);
  }

  /**
   * Validates if the conditions for a reaction item are met before sending a remote request to prompt a dialog with
   * the reaction to the player associated to the reaction item's owner and execute it if the player selects it.
   *
   * @example
   *  if (args[0].tag === "TargetOnUse" && args[0].macroPass === "isAttacked") {
   *    const targetToken = token; // or options.token
   *
   *    // TODO Check required conditions for the reaction to trigger
   *
   *    const result = await elwinHelpers.doThirdPartyReaction(
   *      workflow.item,
   *      targetToken,
   *      macroItem,
   *      "isAttacked",
   *      {attackRoll: workflow.attackRoll}
   *    );
   *    if (result?.uuid === macroItem.uuid) {
   *      // Do things that must be done in the attackers workflow
   *    }
   *  }
   *
   * The reaction item can protect against manual triggering with a preTargeting on use item by validating
   * the workflow.options:
   *  if (args[0].tag === "OnUse" && args[0].macroPass === "preTargeting") {
   *    if (
   *      workflow.options?.thirdPartyReaction?.trigger !== "isAttacked" ||
   *      workflow.options?.thirdPartyReaction?.itemUuid !== rolledItem.uuid
   *    ) {
   *      // Reaction should only be triggered by aura
   *      const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature of the owner is targeted by a ranged attack.`;
   *      ui.notifications.warn(msg);
   *      return false;
   *    }
   *    return true;
   *  }
   *
   * @see {@link https://discord.com/channels/915186263609454632/1178366243812684006/1178366243812684006} Arrow-Catching Shield
   *
   *
   * @param {Item5e} triggerItem the item that triggered the reaction, usually the item used (workflow.item).
   * @param {Token5e} triggerToken the token which initiated the third party reaction, usually the target of an attack (options.token).
   * @param {Item5e} reactionItem the reaction item to be prompted.
   * @param {string} reactionTriggerName name of the TargetOnUse macroPass on which the reaction that was triggered.
   * @param {object} options reaction options
   * @param {boolean} options.debug  if true will also log some warnings that are considered normal conditions, false by default.
   * @param {Token5e} options.reactionTokenUuid token UUID from which the reaction will executed,
   *                                            if not specified MidiQOL.tokenForActor(reactionItem.actor)?.document.uuid will be used.
   * @param {boolean} options.attackRoll current attackRoll, used to display the reaction flavor depending on the trigger, undefined by default.
   * @param {boolean|undefined} options.showReactionAttackRoll flag to indicate if the attack roll should be shown to the reaction or not,
   *                                                           if undefined the midi setting is used.
   * @param {object} options.reactionOptions options that will be merged with the default ones and passed to the remote reaction.
   *
   * @returns {{name: string, uuid: string, ac: number}} reaction result properties.
   */
  async function doThirdPartyReaction(
    triggerItem,
    triggerToken,
    reactionItem,
    reactionTriggerName,
    options = {
      debug: false,
      reactionTokenUuid: undefined,
      attackRoll: undefined,
    }
  ) {
    // Copied from midi-qol because this utility function is not exposed
    function getReactionSetting(user) {
      if (!user) {
        return 'none';
      }
      return user.isGM
        ? MidiQOL.configSettings().gmDoReactions
        : MidiQOL.configSettings().doReactions;
    }

    const noResult = { name: 'None', uuid: undefined };

    const reactionActor = reactionItem?.actor;
    if (!reactionActor?.flags) {
      console.warn(
        `${MACRO_NAME} | Missing reaction actor or actor flags.`,
        reactionActor
      );
      return noResult;
    }

    let reactionToken = null;
    let reactionTokenUuid = options?.reactionTokenUuid;
    if (reactionTokenUuid) {
      reactionToken = fromUuidSync(reactionTokenUuid);
    } else {
      reactionToken = MidiQOL.tokenForActor(reactionActor);
      reactionTokenUuid = reactionToken?.document.uuid;
    }
    if (!reactionToken) {
      console.warn(
        `${MACRO_NAME} | No token for the reaction actor could be found.`,
        {
          reactionActor,
          reactionTokenUuid,
        }
      );
      return noResult;
    }

    if (MidiQOL.checkRule('incapacitated')) {
      if (MidiQOL.checkIncapacitated(reactionActor)) {
        if (options?.debug) {
          console.warn(
            `${MACRO_NAME} | Actor is incapacitated.`,
            reactionActor
          );
        }
        return noResult;
      }
    }

    const usedReaction = MidiQOL.hasUsedReaction(reactionActor);
    if (usedReaction) {
      if (options?.debug) {
        console.warn(
          `${MACRO_NAME} | Reaction already used for actor.`,
          reactionActor
        );
      }
      return noResult;
    }

    // If the target is associated to a GM user roll item in this client, otherwise send the item roll to user's client
    let player = MidiQOL.playerForActor(reactionActor);
    if (getReactionSetting(player) === 'none') {
      if (options?.debug) {
        console.warn(
          `${MACRO_NAME} | Reaction settings set to none for player.`,
          player
        );
      }
      return noResult;
    }

    if (!player?.active) {
      // Find first active GM player
      player = game.users?.activeGM;
    }
    if (!player?.active) {
      console.warn(
        `${MACRO_NAME} | No active player or GM for actor.`,
        reactionActor
      );
      return noResult;
    }

    // Note: there is a bug in utils.js that put targetConfirmation but not at the workflowOptions level, remove when fixed (see reactionDialog)
    const reactionOptions = foundry.utils.mergeObject(
      {
        itemUuid: triggerItem.uuid,
        thirdPartyReaction: {
          trigger: reactionTriggerName,
          itemUuid: reactionItem.uuid,
        },
        workflowOptions: { targetConfirmation: 'none' },
      },
      options?.reactionOptions ?? {}
    );
    const data = {
      tokenUuid: reactionTokenUuid,
      reactionItemList: [reactionItem.uuid],
      triggerTokenUuid: triggerToken.document.uuid,
      reactionFlavor: getReactionFlavor({
        user: player,
        reactionTriggerName,
        triggerToken,
        triggerItem,
        reactionToken,
        roll: options.attackRoll,
        showReactionAttackRoll: options.showReactionAttackRoll,
      }),
      triggerType: 'reactionmanual',
      options: reactionOptions,
    };

    return MidiQOL.socket().executeAsUser('chooseReactions', player.id, data);
  }

  /**
   * Returns the reaction flavor for the reaction dialog.
   * @param {object} data - The parameters for the reaction flavor.
   * @param {User} data.user - The user to which the reaction dialog will be displayed.
   * @param {string} data.reactionTriggerName - Name of the TargetOnUse macroPass on which the reaction that was triggered.
   * @param {Token5e} data.triggerToken - The token which initiated the third party reaction, usually the target of an attack (options.token).
   * @param {Item5e} data.triggerItem - The item that triggered the reaction, usually the item used (workflow.item).
   * @param {Token5e} data.reactionToken - The token for which the reaction dialog will be displayed.
   * @param {Roll} data.roll - Current D20 roll (attack roll, saving throw or ability test).
   * @param {boolean|undefined} data.showReactionAttackRoll - Option of what detail of the roll should be shown for the reaction,
   *                                                          if undefined the midi setting is used.
   *
   * @returns {string} the flavor for the reaction trigger.
   */
  function getReactionFlavor(data) {
    const {
      user,
      reactionTriggerName,
      triggerToken,
      triggerItem,
      reactionToken,
      roll,
      showReactionAttackRoll,
    } = data;

    let reactionFlavor = 'Unknow reaction trigger!';
    switch (reactionTriggerName) {
      case 'isPreAttacked':
      case 'preAttack':
        reactionFlavor =
          '{actorName} is about to be attacked by {itemName} and {reactionActorName} can use a reaction';
        break;
      case 'isAttacked':
        reactionFlavor =
          '{actorName} is attacked by {itemName} and {reactionActorName} can use a reaction';
        break;
      case 'isPreDamaged':
        reactionFlavor =
          '{actorName} is about to be damaged by {itemName} and {reactionActorName} can use a reaction';
        break;
      case 'isDamaged':
      case 'preTargetDamageApplication':
        reactionFlavor =
          '{actorName} is damaged by {itemName} and {reactionActorName} can use a reaction';
        break;
      case 'isHealed':
        reactionFlavor =
          '{actorName} is healed by {itemName} and {reactionActorName} can use a reaction';
        break;
      case 'isTargeted':
      case 'prePreambleComplete':
        reactionFlavor =
          '{actorName} is targeted by {itemName} and {reactionActorName} can use a reaction';
        break;
      case 'isMissed':
        reactionFlavor =
          '{actorName} is missed by {itemName} and {reactionActorName} can use a reaction';
        break;
      case 'isCriticalHit':
        reactionFlavor =
          '{actorName} is critically hit by {itemName} and {reactionActorName} can use a reaction';
        break;
      case 'isFumble':
        reactionFlavor =
          '{actorName} is attacked by {itemName} which fumbled and {reactionActorName} can use a reaction';
        break;
      case 'preTargetSave':
      case 'isAboutToSave':
      case 'isPreCheckSave':
      case 'isPostCheckSave':
        reactionFlavor =
          '{actorName} must save because of {itemName} and {reactionActorName} can use a reaction';
        break;
      case 'isSaveSuccess':
        reactionFlavor =
          '{actorName} succeeded on a save because of {itemName} and {reactionActorName} can use a reaction';
        break;
      case 'isSaveFailure':
        reactionFlavor =
          '{actorName} failed on a save because of {itemName} and {reactionActorName} can use a reaction';
        break;
      case 'isMoved':
        reactionFlavor =
          '{actorName} is moved and {reactionActorName} can use a reaction';
        break;
      case 'postTargetEffectApplication':
        reactionFlavor =
          '{actorName} has been applied effects because of {itemName} and {reactionActorName} can use a reaction';
        break;
      case 'isHit':
      default:
        reactionFlavor =
          '{actorName} is hit by {itemName} and {reactionActorName} can use a reaction';
        break;
    }
    reactionFlavor = game.i18n.format(reactionFlavor, {
      itemName: triggerItem?.name ?? 'unknown',
      actorName: getTokenPlayerName(user, triggerToken, user?.isGM),
      reactionActorName: reactionToken?.name ?? 'unknown',
    });

    //{none: 'Attack Hits', d20: 'd20 roll only', all: 'Attack Roll Total', allCrit: 'Attack Roll Total + Critical'}
    if (
      ['isHit', 'isMissed', 'isCrit', 'isFumble', 'isAttacked'].includes(
        reactionTriggerName
      )
    ) {
      const showAttackRoll =
        showReactionAttackRoll ??
        MidiQOL.configSettings().showReactionAttackRoll;
      const rollOptions = getI18nOptions('ShowReactionAttackRollOptions');
      switch (showAttackRoll) {
        case 'all':
          reactionFlavor = `<h4>${reactionFlavor} - ${rollOptions.all} ${
            roll?.total ?? ''
          }</h4>`;
          break;
        case 'allCrit': {
          const criticalString = roll?.isCritical
            ? `<span style="color: green">(${getI18n('DND5E.Critical')})</span>`
            : '';
          reactionFlavor = `<h4>${reactionFlavor} - ${rollOptions.all} ${
            roll?.total ?? ''
          } ${criticalString}</h4>`;
          break;
        }
        case 'd20': {
          const theRoll = roll?.terms[0]?.results
            ? roll.terms[0].results.find((r) => r.active)?.result ??
              roll.terms[0]?.total
            : roll?.terms[0]?.total ?? '';
          reactionFlavor = `<h4>${reactionFlavor} - ${rollOptions.d20} ${theRoll}</h4>`;
          break;
        }
        default:
      }
    }
    if (['isPostCheckSave'].includes(reactionTriggerName)) {
      // Note: we use the same config as the attack to determine is the TPR owner can see of the Roll.
      const showAttackRoll =
        showReactionAttackRoll ??
        MidiQOL.configSettings().showReactionAttackRoll;
      const rollOptions = getI18nOptions('ShowReactionAttackRollOptions');
      switch (showAttackRoll) {
        case 'all':
        case 'allCrit':
          reactionFlavor = `<h4>${reactionFlavor} - ${rollOptions.all} ${
            roll?.total ?? ''
          }</h4>`;
          break;
        case 'd20': {
          const theRoll = roll?.terms[0]?.results
            ? roll.terms[0].results.find((r) => r.active)?.result ??
              roll.terms[0]?.total
            : roll?.terms[0]?.total ?? '';
          reactionFlavor = `<h4>${reactionFlavor} - ${rollOptions.d20} ${theRoll}</h4>`;
          break;
        }
        default:
      }
    }

    return reactionFlavor;
  }

  /**
   * Handles third party reactions for the specied triggers.
   *
   * @param {MidiQOL.Workflow} workflow - The current MidiQOL workflow.
   * @param {string[]} triggerList - List of reaction triggers needing to be handled.
   * @param {object} options - Options to override some defaults or change the execution behavior.
   */
  async function handleThirdPartyReactions(workflow, triggerList, options) {
    options ??= workflow.options;
    if (
      !(MidiQOL.configSettings().allowUseMacro && !options.noTargetOnuseMacro)
    ) {
      return;
    }

    for (let trigger of triggerList) {
      // Add Third Party Reactions trigger prefix
      trigger = 'tpr.' + trigger;
      for (let tokenUuid of Object.keys(workflow.thirdPartyReactions ?? {})) {
        const tokenReactionsInfo = workflow.thirdPartyReactions[tokenUuid];
        await handleThirdPartyReactionsForToken(
          workflow,
          trigger,
          tokenUuid,
          tokenReactionsInfo,
          options
        );
      }
    }
  }

  /**
   * Handles the evaluation and execution of reactions, if the conditions are met, associated to the specified token uuid.
   *
   * @param {MidiQOL.Workflow} workflow - The current MidiQOL workflow.
   * @param {string} trigger - The current trigger for which to evaluate possible reaction executions.
   * @param {string} reactionTokenUuid - The token uuid of the reaction's owner.
   * @param {TokenReactionsInfo} tokenReactionsInfo - Contains the reactions info associated to the reaction token uuid.
   * @param {object} options - Options used for the evaluation and execution of the third party reactions.
   */
  async function handleThirdPartyReactionsForToken(
    workflow,
    trigger,
    reactionTokenUuid,
    tokenReactionsInfo,
    options = {}
  ) {
    let filteredReactions = tokenReactionsInfo.reactions.filter(
      (reactionData) =>
        trigger === reactionData.targetOnUse &&
        reactionData.item.uuid !== workflow.itemUuid
    );
    if (!filteredReactions.length) {
      return;
    }

    const reactionToken = fromUuidSync(reactionTokenUuid)?.object;
    if (!reactionToken) {
      console.warn(
        `${MACRO_NAME} | Missing reaction token.`,
        reactionTokenUuid
      );
      return;
    }

    const reactionActor = reactionToken.actor;
    if (!reactionActor?.flags) {
      console.warn(
        `${MACRO_NAME} | Missing reaction actor or actor flags.`,
        reactionToken
      );
      return;
    }

    if (MidiQOL.checkRule('incapacitated')) {
      if (MidiQOL.checkIncapacitated(reactionActor)) {
        if (debug) {
          console.warn(
            `${MACRO_NAME} | Actor is incapacitated.`,
            reactionActor
          );
        }
        return;
      }
    }

    // Copied from midi-qol because this utility function is not exposed
    function getReactionSetting(user) {
      if (!user) {
        return 'none';
      }
      return user.isGM
        ? MidiQOL.configSettings().gmDoReactions
        : MidiQOL.configSettings().doReactions;
    }

    // If the target is associated to a GM user roll item in this client, otherwise send the item roll to user's client
    let player = MidiQOL.playerForActor(reactionActor);
    if (getReactionSetting(player) === 'none') {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | Reaction settings set to none for player.`,
          player
        );
      }
      return;
    }

    if (!player?.active) {
      // Find first active GM player
      player = game.users?.activeGM;
    }
    if (!player?.active) {
      console.warn(
        `${MACRO_NAME} | No active player or GM for actor.`,
        reactionActor
      );
      return;
    }

    const regTrigger = trigger.replace('tpr.', '');
    const maxLevel = maxReactionCastLevel(reactionActor);
    const reactionUsed = MidiQOL.hasUsedReaction(reactionActor);
    filteredReactions = filteredReactions.filter((reactionData) =>
      itemReaction(reactionData.item, regTrigger, maxLevel, reactionUsed)
    );
    if (!filteredReactions.length) {
      return;
    }

    let targets;
    let triggerItem = workflow.item;
    let roll = workflow.attackRoll;

    switch (regTrigger) {
      case 'isHealed':
      case 'isDamaged':
        targets = options.target ? [options.target] : [];
        break;
      case 'isHit':
      case 'isPreDamaged':
      case 'isPreCheckSave':
      case 'isPostCheckSave':
        targets = [...workflow.hitTargets, ...workflow.hitTargetsEC];
        break;
      case 'isMissed':
        targets = [
          ...workflow.targets
            .difference(workflow.hitTargets)
            .difference(workflow.hitTargetsEC),
        ];
        break;
      case 'isTargeted':
      case 'isPreAttacked':
      case 'isAttacked':
      default:
        targets = [...workflow.targets];
        break;
    }
    // TODO
    //if (["preTargetSave"???, "isAboutToSave", "isSaveSuccess", "isSaveFailure"].includes(regTrigger)) {
    //  triggerItem = workflow.saveItem;
    //}

    let first = true;
    for (let target of targets) {
      // Check each call after first in case the the status changed or the reaction was used
      if (!first) {
        if (
          MidiQOL.checkRule('incapacitated') &&
          MidiQOL.checkIncapacitated(reactionActor)
        ) {
          if (debug) {
            console.warn(
              `${MACRO_NAME} | Actor is incapacitated.`,
              reactionActor
            );
          }
          return;
        }

        const reactionUsed = MidiQOL.hasUsedReaction(reactionActor);
        filteredReactions = filteredReactions.filter((reactionData) =>
          itemReaction(reactionData.item, regTrigger, maxLevel, reactionUsed)
        );
        if (!filteredReactions.length) {
          return;
        }
      }
      if (['isPostCheckSave'].includes(regTrigger)) {
        roll = workflow.saveRolls?.find(
          (r) => r.data.tokenUuid === target.document.uuid
        );
      }
      const allowedReactions = filteredReactions.filter((reactionData) =>
        canTriggerReaction(
          workflow,
          triggerItem,
          reactionToken,
          tokenReactionsInfo,
          target,
          reactionData,
          options
        )
      );
      await callReactionsForToken(
        workflow,
        reactionToken,
        player,
        trigger,
        target,
        allowedReactions,
        roll,
        options
      );
      first = false;
    }
  }

  /**
   * Validates if a reaction should be triggered. Some of the validation are the range and disposition between the reaction owner's
   * and the trigger source, and the reaction activation condition.
   *
   * @param {MidiQOL.Workflow} workflow - The current MidiQOL workflow.
   * @param {Item5e} triggerItem - The item that triggered a possible reaction.
   * @param {Token5e} reactionToken - The token of the reaction's owner.
   * @param {TokenReactionsInfo} tokenReactionsInfo - Contains the reactions info associated to the reaction token uuid.
   * @param {Token5e} target - The target of the trigger item.
   * @param {object} reactionData - The reaction data of the possible reaction.
   * @param {object} options - Options that can be used in the different validations.
   * @param {string} options.extraActivationCond - Extra activation condition to be evaluated.
   *
   * @returns {boolean} true if the reaction can be triggered, false otherwise.
   */
  function canTriggerReaction(
    workflow,
    triggerItem,
    reactionToken,
    tokenReactionsInfo,
    target,
    reactionData,
    options = {}
  ) {
    const self = reactionToken.document.uuid === target.document.uuid;

    // Check self condition
    if (reactionData.ignoreSelf && self) {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | canTriggerReaction- ${reactionData.item.name}: self not allowed.`
        );
      }
      return false;
    }

    const triggerToken =
      reactionData.triggerSource === 'attacker' ? workflow.token : target;

    // Check allowed disposition condition
    let allowedDisposition;
    const disposition = getReactionDisposition(reactionData);
    if (disposition) {
      allowedDisposition = reactionToken.document.disposition * disposition;
    }
    if (
      disposition &&
      allowedDisposition !== triggerToken.document.disposition
    ) {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | canTriggerReaction - ${reactionData.item.name}: disposition not allowed.`,
          {
            allowedDisposition,
            triggerTokenDisp: triggerToken.document.disposition,
          }
        );
      }
      return false;
    }

    // Check range condition
    const range = getReactionRange(reactionData);
    if (range) {
      const tmpDist = foundry.utils.isNewerVersion(
        game.modules.get('midi-qol').version ?? '0.0.0',
        '11.6.25'
      )
        ? MidiQOL.computeDistance(reactionToken, triggerToken, {
            wallsBlock: range.wallsBlock,
          })
        : MidiQOL.computeDistance(
            reactionToken,
            triggerToken,
            range.wallsBlock
          );
      if (tmpDist < 0 || tmpDist > range.value) {
        if (debug) {
          console.warn(
            `${MACRO_NAME} | canTriggerReaction - ${reactionData.item.name}: invalid distance.`,
            {
              distance: tmpDist,
              allowedDistance: range,
            }
          );
        }
        return false;
      }
    }

    // Check visibility condition
    // Cache canSee results in reactionsInfo
    let canSeeTriggerSource;
    if (reactionData.triggerSource === 'attacker') {
      canSeeTriggerSource = tokenReactionsInfo.canSeeAttacker ??=
        MidiQOL.canSee(reactionToken, workflow.token);
    } else {
      if (!tokenReactionsInfo.canSeeTargets?.has(target)) {
        (tokenReactionsInfo.canSeeTargets ??= new Map()).set(
          target,
          MidiQOL.canSee(reactionToken, target)
        );
      }
      canSeeTriggerSource = tokenReactionsInfo.canSeeTargets.get(target);
    }

    if (!self && reactionData.canSee && !canSeeTriggerSource) {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | canTriggerReaction - ${reactionData.item.name}: can't see trigger token.`
        );
      }
      return false;
    }

    const reactionCondition = foundry.utils.getProperty(
      reactionData.item ?? {},
      'flags.midi-qol.reactionCondition'
    );
    if (!reactionCondition && !options?.extraActivationCond) {
      return true;
    }

    const extraData = {
      reaction: reactionData.targetOnUse,
      tpr: {
        item: reactionData.item?.getRollData()?.item ?? {},
        actor: reactionToken?.actor.getRollData() ?? {},
        actorId: reactionToken?.actor?.id,
        actorUuid: reactionToken?.actor?.uuid,
        tokenId: reactionToken?.id,
        tokenUuid: reactionToken?.document.uuid,
        canSeeTriggerSource,
        get isMeleeAttack() {
          return isMeleeAttack(workflow.item, workflow.token, target);
        },
        get isMeleeWeaponAttack() {
          return isMeleeWeaponAttack(workflow.item, workflow.token, target);
        },
        get isRangedAttack() {
          return isRangedAttack(workflow.item, workflow.token, target);
        },
        get isRangedWeaponAttack() {
          return isRangedWeaponAttack(workflow.item, workflow.token, target);
        },
      },
    };

    // Check extra activation condition for this trigger
    if (options?.extraActivationCond) {
      const returnValue = evalReactionActivationCondition(
        workflow,
        options.extraActivationCond,
        target,
        {
          item: triggerItem,
          extraData,
        }
      );
      if (!returnValue) {
        if (debug) {
          console.warn(
            `${MACRO_NAME} | canTriggerReaction - ${reactionData.item.name}: extra activation condition not met.`,
            {
              extraActivationCond: options.extraActivationCond,
            }
          );
        }
        return false;
      }
    }

    // Check reaction activation condition
    if (reactionCondition) {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | Filter reaction for ${reactionToken.name} ${reactionData.item?.name} using condition ${reactionCondition}`,
          { extraData }
        );
      }

      if (
        !evalReactionActivationCondition(workflow, reactionCondition, target, {
          item: triggerItem,
          extraData,
        })
      ) {
        if (debug) {
          console.warn(
            `${MACRO_NAME} | canTriggerReaction - ${reactionData.item.name}: reaction condition not met.`,
            reactionCondition
          );
        }
        return false;
      }
    }
    return true;
  }

  /**
   * Returns the disposition if any found for the specified reaction data.
   *
   * @param {object} reactionData - The reaction data for which to retrived the disposition.
   *
   * @returns {number} the relative disposition compared to the trigger source.
   */
  function getReactionDisposition(reactionData) {
    const targetType = foundry.utils.getProperty(
      reactionData.item,
      'system.target.type'
    );
    if (targetType === 'ally') {
      return CONST.TOKEN_DISPOSITIONS.FRIENDLY;
    } else if (targetType === 'enemy') {
      return CONST.TOKEN_DISPOSITIONS.HOSTILE;
    }
    return undefined;
  }

  /**
   * Returns the range data if any found for the specified reaction data.
   *
   * @param {object} reactionData - The reaction data for which to retrived the range data.
   *
   * @returns {{value: number, wallsBlock: {boolean}}} range data for the specified reaction data,
   * the data is composed of a value which is the range and wallsBlock, a boolean to indicate
   * if walls should block or not the distance computation.
   */
  function getReactionRange(reactionData) {
    const range = {};
    range.value = getRangeFromItem(reactionData.item);
    range.wallsBlock = !foundry.utils.getProperty(
      reactionData.item,
      'flags.midiProperties.ignoreTotalCover'
    );

    return range.value ? range : undefined;
  }

  /**
   * Returns the range data if any found for the specified item.
   *
   * Note: the code was inspired from the checkRange function from midi-qol utils.ts.
   *
   * @param {Item5e} item - The item for which to retrieve the range data.
   *
   * @returns {number} range for the specified item converted in the canvas scene grid units if possible,
   */
  function getRangeFromItem(item) {
    if (!item?.system?.range?.value) {
      return undefined;
    }
    let range = item.system.range.value;
    if (item?.system?.range?.units) {
      switch (item.system.range.units) {
        case 'mi': // miles - assume grid units are feet or miles - ignore furlongs/chains whatever
          if (
            ['feet', 'ft'].includes(
              canvas?.scene?.grid.units?.toLocaleLowerCase()
            )
          ) {
            range *= 5280;
          } else if (
            ['yards', 'yd', 'yds'].includes(
              canvas?.scene?.grid.units?.toLocaleLowerCase()
            )
          ) {
            range *= 1760;
          }
          break;
        case 'km': // kilometeres - assume grid units are meters or kilometers
          if (
            ['meter', 'm', 'meters', 'metre', 'metres'].includes(
              canvas?.scene?.grid.units?.toLocaleLowerCase()
            )
          ) {
            range *= 1000;
          }
          break;
        // "none" "self" "ft" "m" "any" "spec":
        default:
          break;
      }
    }
    return range;
  }

  /**
   * Evaluates a reaction activation condition.
   *
   * @param {MidiQOL.Workflow} workflow - the current MidiQOL workflow.
   * @param {string} condition - the condition to evaluate.
   * @param {Token5e} target - the target
   * @param {object} options - options for the condition evaluation.
   *
   * @returns {boolean} true if the condition evaluates to true, false otherwise.
   */
  function evalReactionActivationCondition(
    workflow,
    condition,
    target,
    options = {}
  ) {
    if (options.errorReturn === undefined) {
      options.errorReturn = false;
    }
    return evalActivationCondition(workflow, condition, target, options);
  }

  /**
   * Evaluates an activation condition.
   *
   * @param {MidiQOL.Workflow} workflow - the current MidiQOL workflow.
   * @param {string} condition - the condition to evaluate.
   * @param {Token5e} target - the target
   * @param {object} options - options for the condition evaluation.
   *
   * @returns {boolean} true if the condition evaluates to true, false otherwise.
   */
  function evalActivationCondition(workflow, condition, target, options = {}) {
    if (condition === undefined || condition === '') {
      return true;
    }
    MidiQOL.createConditionData({
      workflow,
      target,
      actor: workflow.actor,
      extraData: options?.extraData,
      item: options.item,
    });
    options.errorReturn ??= true;
    const returnValue = MidiQOL.evalCondition(
      condition,
      workflow.conditionData,
      options
    );
    return returnValue;
  }

  /**
   * Returns the disposition value for the specified disposition string.
   *
   * @param {string} disposition - the disposition to convert to its value.
   *
   * @returns {number} the disposition value.
   */
  function getDispositionFor(disposition) {
    if (/^-?\d+$/.test(disposition)) {
      return Number(disposition);
    }
    switch (disposition.toLocaleLowerCase()) {
      case 'SECRET'.toLocaleLowerCase():
        return CONST.TOKEN_DISPOSITIONS.SECRET;
      case 'HOSTILE'.toLocaleLowerCase():
        return CONST.TOKEN_DISPOSITIONS.HOSTILE;
      case 'NEUTRAL'.toLocaleLowerCase():
        return CONST.TOKEN_DISPOSITIONS.NEUTRAL;
      case 'FRIENDLY'.toLocaleLowerCase():
        return CONST.TOKEN_DISPOSITIONS.FRIENDLY;
      case 'all':
        return null;
    }
    const validStrings = [
      '-2',
      '-1',
      '0',
      '1',
      'FRIENDLY',
      'HOSTILE',
      'NEUTRAL',
      'SECRET',
      'all',
    ];
    throw new Error(
      `${MACRO_NAME} | Disposition ${disposition} is invalid. Disposition must be one of "${validStrings}"`
    );
  }

  /**
   * Calls MidiQOL remote chooseReactions for a token having third party reactions for the trigger.
   * Calls the associated pre macro if defined for each triggered reaction, then calls the remote chooseReactions and
   * finally calls the associated post macro if defined.
   *
   * @param {MidiQOL.Workflow} workflow - the current MidiQOL workflow.
   * @param {Toke5e} reactionToken - the token having third party reactions.
   * @param {User} user - the user associated to the reaction token, or the GM is none active.
   * @param {string} reactionTrigger - the third party reaction trigger.
   * @param {Token5e} target - the target of the third party reaction trigger.
   * @param {ReactionData[]} reactions - list of reaction data from which the reaction token can choose to activate.
   * @param {Roll} roll - The D20 roll of the attack, saving throw or ability test.
   * @param {object} options - options to pass to macros.
   */
  async function callReactionsForToken(
    workflow,
    reactionToken,
    user,
    reactionTrigger,
    target,
    reactions,
    roll,
    options = {}
  ) {
    if (!reactions?.length) {
      return;
    }
    const reactionsByTriggerSources = [];
    const reactionsByAttacker = reactions.filter(
      (rd) => rd.triggerSource === 'attacker'
    );
    if (reactionsByAttacker.length) {
      reactionsByTriggerSources.push(reactionsByAttacker);
    }
    const reactionsByTarget = reactions.filter(
      (rd) => rd.triggerSource === 'target'
    );
    if (reactionsByTarget.length) {
      reactionsByTriggerSources.push(reactionsByTarget);
    }
    for (let reactionsByTriggerSource of reactionsByTriggerSources) {
      const reactionsToSkip = new Set();
      const preReactionOptions = foundry.utils.mergeObject(
        { actor: target.actor, token: target },
        options?.reactionOptions ?? {}
      );
      for (let reactionData of reactionsByTriggerSource) {
        try {
          // TODO allow return values to pass options to reaction?
          if (reactionData.macroName && reactionData.preMacro) {
            if (debug) {
              console.warn(
                `${MACRO_NAME} | calling Third Party Reaction pre macro.`,
                {
                  workflow,
                  reactionData,
                  reactionTrigger,
                  preReactionOptions,
                }
              );
            }
            let [result] = await workflow.callMacros(
              workflow.item,
              reactionData.macroName,
              'TargetOnUse',
              reactionTrigger + '.pre',
              preReactionOptions
            );
            if (result?.skip) {
              reactionsToSkip.add(reactionData);
            }
          }
        } catch (error) {
          console.error(`${MACRO_NAME} | error in preReaction.`, error);
          reactionsToSkip.add(reactionData);
        }
      }
      const validReactions = reactionsByTriggerSource.filter(
        (rd) => !reactionsToSkip.has(rd)
      );

      const noResult = { name: 'None', uuid: undefined };
      let result = noResult;
      try {
        if (!validReactions.length) {
          continue;
        }
        // Note: there is a bug in utils.js that put targetConfirmation but not at the workflowOptions level, remove when fixed (see reactionDialog)
        const reactionUuids = validReactions.map((rd) => rd.item?.uuid);
        const reactionOptions = foundry.utils.mergeObject(
          {
            itemUuid: options?.item?.uuid ?? workflow.itemUuid,
            thirdPartyReaction: {
              trigger: reactionTrigger,
              itemUuids: reactionUuids,
            },
            workflowOptions: { targetConfirmation: 'none' },
          },
          options?.reactionOptions ?? {}
        );
        let reactionTargetUuid;
        foundry.utils.setProperty(
          reactionOptions.thirdPartyReaction,
          'triggerSource',
          validReactions[0].triggerSource
        );
        if (validReactions[0].triggerSource === 'attacker') {
          foundry.utils.setProperty(
            reactionOptions.thirdPartyReaction,
            'targetUuid',
            target.document.uuid
          );
          reactionTargetUuid = workflow.tokenUuid;
        } else {
          foundry.utils.setProperty(
            reactionOptions.thirdPartyReaction,
            'attackerUuid',
            workflow.tokenUuid
          );
          reactionTargetUuid = target.document.uuid;
        }

        const data = {
          tokenUuid: reactionToken.document.uuid,
          reactionItemList: reactionUuids,
          triggerTokenUuid: reactionTargetUuid,
          reactionFlavor: getReactionFlavor({
            user,
            reactionTriggerName: reactionTrigger.replace('tpr.', ''),
            triggerToken: target,
            triggerItem: workflow.item,
            reactionToken,
            roll,
          }),
          triggerType: 'reaction',
          options: reactionOptions,
        };

        result = await MidiQOL.socket().executeAsUser(
          'chooseReactions',
          user.id,
          data
        );
      } finally {
        const postReactionOptions = foundry.utils.mergeObject(
          {
            actor: target.actor,
            token: target,
            thirdPartyReactionResult: result,
          },
          options?.reactionOptions ?? {}
        );
        for (let reactionData of reactionsByTriggerSource) {
          try {
            if (reactionData.macroName && reactionData.postMacro) {
              if (debug) {
                console.warn(
                  `${MACRO_NAME} | calling Third Party Reaction post macro.`,
                  {
                    workflow,
                    reactionData,
                    reactionTrigger,
                    postReactionOptions,
                  }
                );
              }
              await workflow.callMacros(
                workflow.item,
                reactionData.macroName,
                'TargetOnUse',
                reactionTrigger + '.post',
                postReactionOptions
              );
            }
          } catch (error) {
            console.error(`${MACRO_NAME} | error in postReaction.`, error);
          }
        }
      }
    }
  }

  /**
   * Returns the token name that can be displayed for the specified user.
   * Note: Extended from MidiQOL to allow passing a user instead of taking game.user.
   *
   * @param {User} user - The user to which the token name will be displayed.
   * @param {Token5e} token - The token for which to display the name.
   * @param {boolean} checkGM - If true, indicate that a GM user should be shown the token.name.
   *
   * @returns {string} The token name to be displayed to the specified user.
   */
  function getTokenPlayerName(user, token, checkGM = false) {
    if (!token) {
      return game.user?.name;
    }
    let name = getTokenName(token);
    if (checkGM && user?.isGM) {
      return name;
    }
    if (game.modules.get('anonymous')?.active) {
      const api = game.modules.get('anonymous')?.api;
      return api.playersSeeName(token.actor) ? name : api.getName(token.actor);
    }
    return name;
  }

  /**
   * Returns a string containing two midi target divs, one to be displayed to GM and another one to be displayed to players.
   *
   * @param {Token5e} targetToken - The token for which to display the name.
   * @param {string} textTemplate - The text template which should contain the target variable (${tokenName}) to replaced by the proper one.
   *
   * @returns {string} Div texts for GM and non GM player.
   */
  function getTargetDivs(targetToken, textTemplate) {
    const gmText = textTemplate.replace(
      '${tokenName}',
      getTokenName(targetToken)
    );
    const targetName = MidiQOL.getTokenPlayerName(targetToken);
    const playerText = textTemplate.replace('${tokenName}', targetName);
    if (foundry.utils.isNewerVersion(game.system.version, '3')) {
      return `<div class="midi-qol-gmTokenName">${gmText}</div><div class="midi-qol-playerTokenName">${playerText}</div>`;
    }
    return `<div class="midi-qol-target-npc-GM">${gmText}</div><div class="midi-qol-target-npc-Player">${playerText}</div>`;
  }

  /**
   * Returns true if the item has the property.
   *
   * @param {Item5e} item - Item to test for a property
   * @param {string} propName - Name of the property to test.
   *
   * @returns {boolean} true if the item has the property, false otherwise.
   */
  function hasItemProperty(item, propName) {
    if (foundry.utils.isNewerVersion(game.system.version, '3')) {
      return item.system?.properties?.has(propName);
    }
    return item.system?.properties?.[propName];
  }

  /**
   * Reduces the applied damage from the damageItem by preventedDmg.
   *
   * @param {object} damageItem - The MidiQOL damageItem to be updated.
   * @param {number} preventedDmg - The amount of damage prevented.
   * @param {Item5e} sourceItem - Source item of the damage prevention. (optional)
   */
  function reduceAppliedDamage(damageItem, preventedDmg, sourceItem) {
    if (!(preventedDmg > 0)) {
      // Only values greater than 0 are applied.
      console.warn(
        `${MACRO_NAME} | Only greater than 0 damage prevention is supported.`,
        {
          damageItem,
          preventedDmg,
          sourceItem,
        }
      );
      return;
    }
    if (
      foundry.utils.isNewerVersion(
        game.modules.get('midi-qol')?.version,
        '11.6'
      )
    ) {
      const currentDamagePrevention =
        foundry.utils.getProperty(
          damageItem.calcDamageOptions,
          'elwinHelpers.damagePrevention'
        ) ?? 0;
      foundry.utils.setProperty(
        damageItem.calcDamageOptions,
        'elwinHelpers.damagePrevention',
        currentDamagePrevention + preventedDmg
      );
      const actor = fromUuidSync(damageItem.actorUuid);
      damageItem.damageDetail = actor?.calculateDamage(
        damageItem.rawDamageDetail,
        damageItem.calcDamageOptions
      );
      calculateAppliedDamage(damageItem);
      if (sourceItem && damageItem.details) {
        damageItem.details.push(`${sourceItem.name} - DP`);
      }
      return;
    }

    let effectiveDamagePrevented;
    if (foundry.utils.hasProperty(damageItem, 'appliedDamage')) {
      let amount = damageItem.damageDetail.reduce(
        (amount, d) =>
          amount +
          (['temphp', 'midi-none'].includes(d.type) ? 0 : d.value ?? d.damage),
        0
      );
      amount = amount > 0 ? Math.floor(amount) : Math.ceil(amount);

      // Adjust value for overflow damage, reduce the prevented damage by the amount of damage overflow
      if (amount > damageItem.appliedDamage) {
        preventedDmg -= amount - damageItem.appliedDamage;
      }
      const previousHpDmg = damageItem.appliedDamage;
      let remainingPrevDmg = Math.min(previousHpDmg, preventedDmg);
      damageItem.appliedDamage -= remainingPrevDmg;
      if (remainingPrevDmg > 0 && damageItem.hpDamage > 0) {
        const hpPrevDmg = Math.min(damageItem.hpDamage, remainingPrevDmg);
        damageItem.hpDamage -= hpPrevDmg;
        damageItem.newHP += hpPrevDmg;
        remainingPrevDmg -= hpPrevDmg;
      }
      if (remainingPrevDmg > 0 && damageItem.tempDamage > 0) {
        const tempHpPrevDmg = Math.min(damageItem.tempDamage, remainingPrevDmg);
        damageItem.tempDamage -= tempHpPrevDmg;
        damageItem.newTempHP += tempHpPrevDmg;
        remainingPrevDmg -= tempHpPrevDmg;
      }
      effectiveDamagePrevented = Math.max(0, preventedDmg - remainingPrevDmg);
    } else {
      let { amount, temp, dp } = damageItem.damageDetail.reduce(
        (acc, d) => {
          if (d.type === 'temphp') {
            acc.temp += d.value;
          } else if (
            d.type !== 'midi-none' &&
            !(d.type === 'none' && d.active?.DP)
          ) {
            acc.amount += d.value;
          } else if (d.type === 'none' && d.active?.DP) {
            acc.dp += d.value;
          }
          return acc;
        },
        { amount: 0, temp: 0, dp: 0 }
      );
      amount = amount > 0 ? Math.floor(amount) : Math.ceil(amount);

      const damagePrevention = Math.min(
        -dp + preventedDmg,
        amount >= 0 ? amount : 0
      );
      if (damagePrevention) {
        const dpDamage = damageItem.damageDetail.find(
          (d) => d.type === 'none' && d.active?.DP
        );
        if (dpDamage) {
          dpDamage.value = damagePrevention;
        } else {
          damageItem.damageDetail.push({
            type: 'none',
            value: -damagePrevention,
            active: { DP: true, multiplier: 1 },
            properties: new Set(),
          });
        }
        amount -= damagePrevention;
      }

      const token = fromUuidSync(damageItem.tokenUuid);
      const as = token.actor?.system;
      if (!as || !as.attributes.hp) {
        if (debug) {
          console.warn(
            `${MACRO_NAME} | Missing damaged token or hp attribute.`,
            { damageItem }
          );
        }
        return;
      }

      // Recompute damage
      const deltaTemp = amount > 0 ? Math.min(damageItem.oldTempHP, amount) : 0;
      const deltaHP = Math.clamp(
        amount - deltaTemp,
        -as.attributes.hp.damage,
        damageItem.oldHP
      );
      damageItem.newHP = damageItem.oldHP - deltaHP;
      damageItem.hpDamage = deltaHP;
      damageItem.newTempHP = Math.floor(
        Math.max(0, damageItem.oldTempHP - deltaTemp, temp)
      );
      damageItem.tempDamage = damageItem.oldTempHP - damageItem.newTempHP;
      damageItem.elwinHelpersEffectiveDamage = amount;
      // TODO should this reflect raw or not???
      //damageItem.totalDamage = amount;

      effectiveDamagePrevented = Math.min(damagePrevention + dp, 0);
    }
    if (sourceItem && damageItem.details) {
      damageItem.details.push(
        `${sourceItem.name} - DP [-${effectiveDamagePrevented}]`
      );
    }
  }

  /**
   * Calculates the applied damage from the damageItem.
   *
   * @param {object} damageItem - The MidiQOL damageItem to be updated.
   */
  function calculateAppliedDamage(damageItem) {
    if (!damageItem) {
      if (debug) {
        console.warn(`${MACRO_NAME} | Missing damaged item.`, { damageItem });
      }
      return;
    }
    let { amount, temp } = damageItem.damageDetail.reduce(
      (acc, d) => {
        if (d.type === 'temphp') acc.temp += d.value ?? d.damage;
        else if (d.type !== 'midi-none') acc.amount += d.value ?? d.damage;
        return acc;
      },
      { amount: 0, temp: 0 }
    );
    const actor = fromUuidSync(damageItem.actorUuid);
    const as = actor?.system;
    if (!as || !as.attributes.hp) {
      if (debug) {
        console.warn(`${MACRO_NAME} | Missing damaged actor or hp attribute.`, {
          damageItem,
        });
      }
      return;
    }

    // Recompute damage
    amount = amount > 0 ? Math.floor(amount) : Math.ceil(amount);
    const deltaTemp = amount > 0 ? Math.min(damageItem.oldTempHP, amount) : 0;
    const deltaHP = Math.clamp(
      amount - deltaTemp,
      -as.attributes.hp.damage,
      damageItem.oldHP
    );
    damageItem.newHP = damageItem.oldHP - deltaHP;
    damageItem.hpDamage = deltaHP;
    damageItem.newTempHP = Math.floor(
      Math.max(0, damageItem.oldTempHP - deltaTemp, temp)
    );
    damageItem.tempDamage = damageItem.oldTempHP - damageItem.newTempHP;
    damageItem.elwinHelpersEffectiveDamage = amount;
    // TODO should this reflect raw or not???
    //damageItem.totalDamage = amount;
    if (foundry.utils.hasProperty(damageItem, 'appliedDamage')) {
      damageItem.appliedDamage = deltaHP;
    }
  }

  /**
   * Returns true if the attack is a ranged attack. It also supports melee weapons with the thrown property.
   *
   * @param {Item5e} item - The item used to attack.
   * @param {Token5e} sourceToken - The attacker's token.
   * @param {Token5e} targetToken - The target's token.
   * @param {boolean} checkThrownWeapons - Flag to indicate if the distance must be validated for thrown weapons.
   *
   * @returns {boolean} true if the attack is a ranged attack.
   */
  function isRangedAttack(
    item,
    sourceToken,
    targetToken,
    checkThrownWeapons = true
  ) {
    return isRangedAttackByType(
      ['rwak', 'rsak'],
      item,
      sourceToken,
      targetToken,
      checkThrownWeapons
    );
  }

  /**
   * Returns true if the attack is a ranged weapon attack that hit. It also supports melee weapons
   * with the thrown property.
   *
   * @param {Item5e} item - The item used to attack.
   * @param {Token5e} sourceToken - The attacker's token.
   * @param {Token5e} targetToken - The target's token.
   * @param {boolean} checkThrownWeapons - Flag to indicate if the distance must be validated for thrown weapons.
   *
   * @returns {boolean} true if the attack is a ranged weapon attack that hit
   */
  function isRangedWeaponAttack(
    item,
    sourceToken,
    targetToken,
    checkThrownWeapons = true
  ) {
    return isRangedAttackByType(
      ['rwak'],
      item,
      sourceToken,
      targetToken,
      checkThrownWeapons
    );
  }

  /**
   * Returns true if the attack is a ranged attack. It also supports melee weapons with the thrown property.
   *
   * @param {string[]} actionType - Array of supported ranged action types.
   * @param {Item5e} item - The item used to attack.
   * @param {Token5e} sourceToken - The attacker's token.
   * @param {Token5e} targetToken - The target's token.
   * @param {boolean} checkThrownWeapons - Flag to indicate if the distance must be validated for thrown weapons.
   *
   * @returns {boolean} true if the attack is a ranged attack.
   */
  function isRangedAttackByType(
    actionTypes,
    item,
    sourceToken,
    targetToken,
    checkThrownWeapons = true
  ) {
    if (actionTypes.includes(item?.system?.actionType)) {
      return true;
    }
    if (!checkThrownWeapons) {
      return false;
    }
    if (item?.system?.actionType !== 'mwak' || !hasItemProperty(item, 'thr')) {
      return false;
    }

    const distance = foundry.utils.isNewerVersion(
      game.modules.get('midi-qol').version ?? '0.0.0',
      '11.6.25'
    )
      ? MidiQOL.computeDistance(sourceToken, targetToken, { wallsBlock: true })
      : MidiQOL.computeDistance(sourceToken, targetToken, true);
    // TODO how to support creature with reach, or creatures with reach and thrown weapon?
    const meleeDistance = 5 + (hasItemProperty(item, 'rch') ? 5 : 0);
    return distance > meleeDistance;
  }

  /**
   * Returns true if the attack was a successful melee attack. It also handle the case of
   * weapons with the thrown property on a target that is farther than melee distance.
   *
   * @param {Item5e} item - The item the item used to attack.
   * @param {Token5e} sourceToken - The source token.
   * @param {Token5e} targetToken - The target token.
   * @param {boolean} checkThrownWeapons - Flag to indicate if the distance must be validated for thrown weapons.
   *
   * @returns {boolean} true if the attack was a successful melee weapon attack, false otherwise.
   */
  function isMeleeAttack(
    item,
    sourceToken,
    targetToken,
    checkThrownWeapons = true
  ) {
    return isMeleeAttackByType(
      ['mwak', 'msak'],
      item,
      sourceToken,
      targetToken,
      checkThrownWeapons
    );
  }

  /**
   * Returns true if the attack was a successful melee weapon attack. It also handle the case of
   * weapons with the thrown property on a target that is farther than melee distance.
   *
   * @param {Item5e} item - The item the item used to attack.
   * @param {Token5e} sourceToken - The source token.
   * @param {Token5e} targetToken - The target token.
   * @param {boolean} checkThrownWeapons - Flag to indicate if the distance must be validated for thrown weapons.
   *
   * @returns {boolean} true if the attack was a successful melee weapon attack, false otherwise.
   */
  function isMeleeWeaponAttack(
    item,
    sourceToken,
    targetToken,
    checkThrownWeapons = true
  ) {
    return isMeleeAttackByType(
      ['mwak'],
      item,
      sourceToken,
      targetToken,
      checkThrownWeapons
    );
  }

  /**
   * Returns true if the attack was a successful melee attack. It also handle the case of
   * weapons with the thrown property on a target that is farther than melee distance.
   *
   * @param {string[]} actionType - Array of supported melee action types.
   * @param {Item5e} item - The item the used for the attack.
   * @param {Token5e} sourceToken - The source token.
   * @param {Token5e} targetToken - The target token.
   * @param {boolean} checkThrownWeapons - Flag to indicate if the distance must be validated for thrown weapons.
   * @returns {boolean} true if the attack was a successful melee weapon attack, false otherwise.
   */
  function isMeleeAttackByType(
    actionTypes,
    item,
    sourceToken,
    targetToken,
    checkThrownWeapons = true
  ) {
    if (!actionTypes.includes(item?.system?.actionType)) {
      return false;
    }

    if (!checkThrownWeapons) {
      return true;
    }

    if (item?.system?.actionType !== 'mwak' || !hasItemProperty(item, 'thr')) {
      return true;
    }

    const distance = foundry.utils.isNewerVersion(
      game.modules.get('midi-qol').version ?? '0.0.0',
      '11.6.25'
    )
      ? MidiQOL.computeDistance(sourceToken, targetToken, { wallsBlock: true })
      : MidiQOL.computeDistance(sourceToken, targetToken, true);
    // TODO how to support creature with reach, or creatures with reach and thrown weapon?
    const meleeDistance = 5 + (hasItemProperty(item, 'rch') ? 5 : 0);
    return distance >= 0 && distance <= meleeDistance;
  }

  /**
   * Selects all the tokens that are within X distance of the source token for the current game user.
   *
   * @param {Token} sourceToken - The reference token from which to compute the distance.
   * @param {number} distance - The distance from the reference token.
   * @param {object} options - Optional parameters.
   * @param {number} [options.disposition=null] - The disposition of tokens: same(1), opposite(-1), neutral(0), ignore(null).
   * @param {boolean} [options.includeSource=false] - Flag to indicate if the reference token should be included or not in the selected targets.
   * @param {boolean} [options.updateSelected=true] - Flag to indicate if the user's target selection should be updated.
   * @param {boolean} [options.isSeen=false] - Flag to indicate if the targets must be sensed by the source token.
   *
   * @returns {Token5e[]} An array of Token instances that were selected.
   */
  function selectTargetsWithinX(
    sourceToken,
    distance,
    options = {
      disposition: null,
      includeSource: false,
      updateSelected: true,
      isSeen: false,
    }
  ) {
    options.disposition ??= null;
    options.includeSource ??= false;
    options.updateSelected ??= true;
    options.isSeen ??= false;

    let aoeTargets = MidiQOL.findNearby(
      options.disposition,
      sourceToken,
      distance,
      {
        isSeen: options.isSeen,
        includeToken: options.includeSource,
      }
    );

    const aoeTargetIds = aoeTargets.map((t) => t.document.id);
    if (options.updateSelected) {
      game.user?.updateTokenTargets(aoeTargetIds);
      game.user?.broadcastActivity({ targets: aoeTargetIds });
    }
    return aoeTargets;
  }

  /**
   * Returns the Midi item chat message for the specified workflow.
   *
   * @param {MidiQOL.workflow} workflow - The current MidiQOL workflow for which to get the item chat message.
   *
   * @returns {ChatMessage5e} - The Midi item chat message for the specified workflow.
   */
  function getMidiItemChatMessage(workflow) {
    if (
      foundry.utils.isNewerVersion(
        game.modules.get('midi-qol').version ?? '0.0.0',
        '11.4.1'
      )
    ) {
      return MidiQOL.getCachedChatMessage(workflow.itemCardUuid);
    }
    return game.messages.get(workflow.itemCardId);
  }

  /**
   * Inserts text into a Midi item chat message before the card buttons div and updates it.
   *
   * @param {string} position - The position where to insert the text, supported values: beforeButtons, beforeHitsDisplay.
   * @param {ChatMessage5e} chatMessage - The MidiQOL item chat message to update
   * @param {string} text - The text to insert in the chat message.
   */
  async function insertTextBeforeButtonsIntoMidiItemChatMessage(
    position,
    chatMessage,
    text
  ) {
    let content = foundry.utils.deepClone(chatMessage.content);
    let searchRegex = undefined;
    let replaceString = `$1\n${text}\n$2`;
    switch (position) {
      case 'beforeHitsDisplay':
        searchRegex = /(<\/div>)(\s*<div class="midi-qol-hits-display">)/m;
        break;
      case 'beforeButtons':
      default:
        searchRegex =
          /(<\/section>)(\s*<div class="card-buttons midi-buttons">)/m;
        if (!foundry.utils.isNewerVersion(game.system.version, '3')) {
          searchRegex = /(<\/div>)(\s*<div class="card-buttons">)/m;
        }
        break;
    }
    if (!foundry.utils.isNewerVersion(game.system.version, '3')) {
      replaceString = `$1\n<br/>${text}\n$2`;
    }
    content = content.replace(searchRegex, replaceString);
    await chatMessage.update({ content: content });
  }

  /**
   * Inserts text into a Midi item chat message before the card buttons div and updates it.
   *
   * @param {string} position - The position where to insert the text, supported values: beforeButtons, beforeHitsDisplay.
   * @param {MidiQOL.workflow} workflow - The current MidiQOL workflow for which to update the item card.
   * @param {string} text - The text to insert in the MidiQOL item card.
   */
  async function insertTextIntoMidiItemCard(position, workflow, text) {
    const chatMessage = getMidiItemChatMessage(workflow);
    if (!chatMessage) {
      console.error(`${MACRO_NAME} | Could not find workflow item card`, {
        workflow,
      });
      return;
    }
    await insertTextBeforeButtonsIntoMidiItemChatMessage(
      position,
      chatMessage,
      text
    );
  }

  /**
   * Validates the workflow on which a Midi hook was registered is the same as the one when it is called
   * and that the workflow was not aborted.
   *
   * @param {string} itemName - The name of the item which registered the hook.
   * @param {string} hookName - The name of the Midi hook.
   * @param {string} actionName - The name of the item to be called in the hook.
   * @param {MidiQOL.Workflow} originWorkflow - The workflow during which the hook was registered.
   * @param {MidiQOL.Workflow} currentWorkflow - The workflow when the hook is called.
   * @param {boolean} [debug=false] - Flag to indicate if debug info must be written to the console.
   *
   * @returns {boolean} true is the hook is still valid, false otherwise.
   */
  function isMidiHookStillValid(
    itemName,
    hookName,
    actionName,
    originWorkflow,
    currentWorkflow,
    debug = false
  ) {
    if (originWorkflow !== currentWorkflow) {
      if (debug) {
        // Not same workflow do nothing
        console.warn(
          `${itemName} | ${hookName} hook called from a different workflow.`
        );
      }
      return false;
    }
    if (currentWorkflow.aborted) {
      if (debug) {
        // Workflow was aborted do not trigger action
        console.warn(
          `${itemName} | workflow was aborted, ${actionName} is also cancelled.`
        );
      }
      return false;
    }
    return true;
  }

  /**
   * Converts a workflow's critical into a normal hit.
   *
   * @param {MidiQOL.Workflow} workflow - The current MidiQOL workflow.
   */
  async function convertCriticalToNormalHit(workflow) {
    if (!workflow.isCritical) {
      // Not a critical hit, do nothing
      return;
    }

    workflow.isCritical = false;
    // Set flag for other feature to not put back a critical or least consider it...
    workflow.options.noCritical = true;

    const configSettings = MidiQOL.configSettings();
    for (let tokenUuid of Object.keys(workflow.hitDisplayData)) {
      if (
        !workflow.hitTargets.some((t) => t.document.uuid === tokenUuid) &&
        !workflow.hitTargetsEC.some((t) => t.document.uuid === tokenUuid)
      ) {
        // Skip targets that are not hit.
        continue;
      }
      const hitDisplay = workflow.hitDisplayData[tokenUuid];
      // TODO remove? seems to not be used anymore...
      hitDisplay.hitResultNumeric = workflow.useActiveDefence
        ? ''
        : `${workflow.attackTotal}/${
            hitDisplay.ac ? Math.abs(workflow.attackTotal - hitDisplay.ac) : '-'
          }`;

      if (
        game.user?.isGM &&
        ['hitDamage', 'all'].includes(configSettings.hideRollDetails)
      ) {
        hitDisplay.hitSymbol = 'fa-tick';
      } else {
        hitDisplay.hitSymbol = 'fa-check';
      }
    }
    // Redisplay roll and hits with the new data
    if (debug) {
      console.warn(`${MACRO_NAME} | Hit display data after updates.`, {
        hitDisplayData: workflow.hitDisplayData,
      });
    }

    await workflow.displayAttackRoll(configSettings.mergeCard);
    await workflow.displayHits(
      workflow.whisperAttackCard,
      configSettings.mergeCard
    );
  }

  /**
   * Returns the damage roll options based on the ones set on the first damage roll of the worflow.
   *
   * @param {MidiQOL.Workflow} worflow - The MidiQOL workflow from which to get the first damage roll options.
   *
   * @returns {object} The damage roll options based on the ones set on the first damage roll of the worflow.
   */
  function getDamageRollOptions(workflow) {
    const rollOptions = workflow.damageRolls[0]?.options ?? {};
    const isCritical = !workflow.isCritical
      ? rollOptions.critical
      : workflow.isCritical;
    const options = {
      critical: isCritical,
      criticalBonusDamage: rollOptions.criticalBonusDamage,
      criticalBonusDice: rollOptions.criticalBonusDice,
      criticalMultiplier: rollOptions.criticalMultiplier,
      multiplyNumeric: rollOptions.multiplyNumeric,
      powerfulCritical: rollOptions.powerfulCritical,
    };
    return options;
  }

  /**
   * Returns the MidiQOL property name for damage on save multiplier.
   *
   * @param {string} [onSave="none"] - The name of the multiplier to apply to damage if a save is sucessfull,
   *                          one of: none, half, full.
   * @returns {string} This MidiQOL property name for damage on save multiplier.
   */
  function getMidiOnSavePropertyName(onSave) {
    let onSavePropName = 'nodam';
    if (onSave) {
      switch (onSave) {
        case 'half':
          onSavePropName = 'halfdam';
          break;
        case 'full':
          onSavePropName = 'fulldam';
          break;
        default:
          onSavePropName = 'nodam';
      }
    }
    return onSavePropName;
  }

  /**
   * Gets the applied enchantments for the specified item uuid if any exist.
   *
   * @param {string} itemUuid - The UUID of the item for which to find associated enchantments.
   * @returns {ActiveEffect5e[]} list of applied enchantments.
   */
  function getAppliedEnchantments(itemUuid) {
    return CONFIG.Item.dataModels.consumable.schema.fields.enchantment.model.appliedEnchantments(
      itemUuid
    );
  }

  /**
   * Deletes the applied enchantments on the specified item uuid.
   *
   * @param {string} itemUuid - The UUID of the item for which to delete the associated enchantments.
   * @returns {ActiveEffect5e[]} the list of applied enchantments that was deleted.
   */
  async function deleteAppliedEnchantments(itemUuid) {
    const appliedEnchantements = getAppliedEnchantments(itemUuid);
    for (let activeEffect of appliedEnchantements) {
      await activeEffect.delete();
    }
    return appliedEnchantements;
  }

  /**
   * Disables manual enchantment placing (for dnd5e v3.2+).
   * This prevents the drop area that allows to select or remove the item to which an enchantment is applied.
   *
   * @param {object} parameters - The MidiQOL function macro parameters.
   */
  function disableManualEnchantmentPlacingOnUsePreItemRoll({ workflow, args }) {
    if (debug) {
      console.warn(
        MACRO_NAME,
        {
          phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0],
        },
        arguments
      );
    }

    if (foundry.utils.isNewerVersion(game.system.version, '3.2')) {
      // Disables enchantment drop area
      workflow.config.promptEnchantment = false;
      workflow.config.enchantmentProfile = null;
    }
  }

  /**
   * Utility dialog to select an item from a list of items.
   *
   * @example
   * const items = _token.actor.itemTypes.weapon;
   * const selectedItem = await ItemSelectionDialog.createDialog("Select a Weapon", items, items?.[0]);
   */
  class ItemSelectionDialog extends Dialog {
    /**
     * Returns the html content for the dialog generated using the specified values.
     *
     * @param {Item5e[]} items - List of items
     * @param {Item5e} defaultItem - Default item, if null or not part of items, the first one is used.
     *
     * @returns {string} the html content to display in the dialog.
     */
    static getContent(items, defaultItem) {
      if (!defaultItem || !items.find((t) => t.id === defaultItem?.id)) {
        defaultItem = items[0];
      }
      let itemContent = '';
      for (let item of items) {
        if (!item?.id) {
          continue;
        }
        const ctx = {};
        ctx.selected =
          defaultItem && defaultItem.id === item.id ? ' checked' : '';
        if (foundry.utils.isNewerVersion(game.system.version, '3.2')) {
          if (item.system.attunement) {
            ctx.attunement = item.system.attuned
              ? {
                  cls: 'attuned',
                  title: game.i18n.localize('DND5E.AttunementAttuned'),
                }
              : {
                  cls: 'not-attuned',
                  title: game.i18n.localize(
                    CONFIG.DND5E.attunementTypes[item.system.attunement]
                  ),
                };
          }
        } else {
          ctx.attunement = {
            [CONFIG.DND5E.attunementTypes.REQUIRED]: {
              cls: '',
              tooltip: game.i18n.localize('DND5E.AttunementRequired'),
            },
            [CONFIG.DND5E.attunementTypes.ATTUNED]: {
              cls: 'active',
              tooltip: game.i18n.localize('DND5E.AttunementAttuned'),
            },
          }[item.system.attunement];
        }
        if ('equipped' in item.system) {
          ctx.equip = {
            cls: item.system.equipped ? 'active' : '',
            tooltip: game.i18n.localize(
              item.system.equipped ? 'DND5E.Equipped' : 'DND5E.Unequipped'
            ),
          };
        }
        ctx.quantity =
          item.type === 'consumable' ? `[${item.system.quantity}]` : '';
        ctx.subtitle = [
          item.system.type?.label,
          item.isActive ? item.labels.activation : null,
        ].filterJoin(' &bull; ');
        ctx.tags =
          item.labels.properties
            ?.filter((prop) => prop.icon)
            .map(
              (prop) =>
                `<span aria-label="${prop.label}"><dnd5e-icon src="${prop.icon}"></dnd5e-icon></span>`
            )
            .join(' ') ?? '';

        itemContent += `
      <input id="radio-${item.id}" type="radio" name="item" value="${item.id}"${ctx.selected}>
        <label class="item" for="radio-${item.id}">
          <div class="item-name">
            <img class="item-image" src="${item.img}" alt="${item.name}">
            <div class="name name-stacked">
              <span class="title">${item.name}${ctx.quantity}</span>
              <span class="subtitle">${ctx.subtitle}</span>
            </div>
            <div class="tags">
              ${ctx.tags}
            </div>
          </div>
          <div class="item-controls">
      `;
        if (ctx.attunement) {
          itemContent += `
            <a class="item-control ${ctx.attunement.cls}" data-tooltip="${ctx.attunement.tooltip}">
              <i class="fas fa-sun"></i>
            </a>
        `;
        }
        if (ctx.equip) {
          itemContent += `
            <a class="item-control ${ctx.equip.cls}" data-tooltip="${ctx.equip.tooltip}">
              <i class="fas fa-shield-halved"></i>
            </a>
        `;
        }
        itemContent += `
          </div>
        </label>
      </input>
      `;
      }
      const content = `
          <style>
            .selectItem .item {
              display: flex;
              flex-direction: row;
              align-items: stretch;
              margin: 4px;
            }

            .selectItem input {
              opacity: 0;
              position: absolute;
              z-index: -1;
            }
      
            .selectItem .item .item-name {
              flex: 1;
              display: flex;
              gap: 0.5rem;
              align-items: center;
              line-height: 1;
              position: relative;
            }            
      
            .selectItem .item .item-image {
              border: 2px solid var(--dnd5e-color-gold, ##9f9275);
              box-shadow: 0 0 4px var(--dnd5e-shadow-45, rgb(0 0 0 / 45%));
              border-radius: 0;
              background-color: var(--dnd5e-color-light-gray, #3d3d3d);
              width: 32px;
              height: 32px;
              flex: 0 0 32px;
              cursor: pointer;
              object-fit: cover;
            }

            .selectItem .name-stacked {
              display: flex;
              flex-direction: column;
            }
                 
            .selectItem .item .item-name .title {
              transition: text-shadow 250ms ease;
              font-size: var(--font-size-13);
            }

            .selectItem .name-stacked .subtitle {
              font-family: var(--dnd5e-font-roboto, Roboto, sans-serif);
              font-size: var(--font-size-10, 0.625rem);
              color: var(--color-text-dark-5);
            }
            
            .selectItem .item .item-controls {
              display: flex;
              width: 40px;
              align-items: stretch;
              justify-content: center;
              gap: 0.375rem;
              color: var(--color-text-light-6);
              padding: 0 1.5rem 0 0.25rem;
              position: relative;
            }

            .selectItem .item .item-controls .item-control {
              display: flex;
              align-items: center;
            }

            .selectItem .item .item-controls .item-control.active {
              color: var(--dnd5e-color-black, #4b4a44);
            }

            /* CHECKED STYLES */
            .selectItem [type=radio]:checked + label {
              outline: 3px solid #f00;
            }
          </style>
          
          <form>
            <div class="selectItem">
              <dl>
                ${itemContent}
              </dl>
            </div>
          </form>
      `;
      return content;
    }

    /**
     * A helper constructor function which displays the item selection dialog.
     *
     * @param {string} title - The title to display.
     * @param {Token5e[]} items - List of items from which to select an item.
     * @param {Token5e} defaultItem - If specified, item to be selected by default,
     *                                if null or not part of items, the first one is used.
     *
     * @returns {Promise<Item5e|null>}  Resolves with the selected item, if any.
     */
    static createDialog(title, items, defaultItem) {
      if (!(items?.length > 0)) {
        return null;
      }
      return new Promise((resolve, reject) => {
        const dialog = new this(
          {
            title,
            content: this.getContent(items, defaultItem),
            buttons: {
              ok: {
                icon: '<i class="fas fa-check"></i>',
                label: 'Select',
                callback: (html) => {
                  const selectedItemId = html.find(
                    "input[type='radio'][name='item']:checked"
                  )[0]?.value;
                  resolve(items.find((t) => t.id === selectedItemId));
                },
              },
            },
            default: 'ok',
            close: () => resolve(null),
          },
          { classes: ['dnd5e', 'dialog'] }
        );
        dialog.render(true);
      });
    }
  }

  // Export class
  if (depReqFulfilled) {
    exportIdentifier('elwinHelpers.ItemSelectionDialog', ItemSelectionDialog);
  }

  /**
   * Utility dialog to select a token from a list of tokens.
   *
   * @example
   * const targets = game.canvas.tokens.placeables;
   * const selectedTarget = await TokenSelectionDialog.createDialog("Select Target", targets, targets?.[0]);
   */
  class TokenSelectionDialog extends Dialog {
    /**
     * Returns the html content for the dialog generated using the specified values.
     *
     * @param {Token5e[]} tokens - List of tokens
     * @param {Token5e} defaultToken - Default token, if null or not part of tokens, the first one is used.
     *
     * @returns {string} the html content to display in the dialog.
     */
    static async getContent(tokens, defaultToken) {
      let tokenContent = '';
      if (!defaultToken || !tokens.find((t) => t.id === defaultToken?.id)) {
        defaultToken = tokens[0];
      }
      for (let token of tokens) {
        if (!token?.id) {
          continue;
        }
        const selected =
          defaultToken && defaultToken.id === token.id ? ' checked' : '';
        const tokenImg = await getTokenImage(token);
        const tokenName = MidiQOL.getTokenPlayerName(token, true);
        tokenContent += `<div style="flex-grow: 1"><label class="radio-label">
        <input type="radio" name="token" value="${token.id}"${selected}>
        <img id="${token.document.uuid}" src="${tokenImg}" style="border:0px; width: 50px; height:50px;">
        ${tokenName}
      </label></div>`;
      }

      let content = `
          <style>
            .selectToken .form-group {
              display: flex;
              flex-wrap: wrap;
              width: 100%;
              align-items: flex-start;
            }
      
            .selectToken .radio-label {
              display: flex;
              flex-direction: row;
              align-items: center;
              margin: 4px;
              text-align: center;
              justify-items: center;
              flex: 1 0 25%;
              line-height: normal;
            }
      
            .selectToken .radio-label input {
              opacity: 0;
              position: absolute;
              z-index: -1;
            }
      
            .selectToken img {
              border: 0px;
              width: 50px;
              height: 50px;
              flex: 0 0 50px;
              margin-right: 3px;
              cursor: pointer;
            }
      
            /* CHECKED STYLES */
            .selectToken [type=radio]:checked + img {
              outline: 3px solid #f00;
            }
          </style>
          
          <form>
            <div class="selectToken">
              <div class="form-group" id="tokens">
              <dl>
                  ${tokenContent}
              </dl>
              </div>
            </div>
          </form>
      `;
      return content;
    }

    /** @inheritdoc */
    activateListeners(html) {
      super.activateListeners(html);

      if (canvas) {
        let imgs = html[0].getElementsByTagName('img');
        for (let i of imgs) {
          i.style.border = 'none';
          i.closest('.radio-label').addEventListener(
            'click',
            async function () {
              const token = getToken(i.id);
              //@ts-expect-error .ping
              if (token) await canvas?.ping(token.center);
            }
          );
          i.closest('.radio-label').addEventListener('mouseover', function () {
            const token = getToken(i.id);
            if (token) {
              //@ts-expect-error .ping
              token.hover = true;
              token.refresh();
            }
          });
          i.closest('.radio-label').addEventListener('mouseout', function () {
            const token = getToken(i.id);
            if (token) {
              //@ts-expect-error .ping
              token.hover = false;
              token.refresh();
            }
          });
        }
      }
    }

    /**
     * A helper constructor function which displays the token selection dialog.
     *
     * @param {string} title - The title to display.
     * @param {Token5e[]} tokens - List of tokens from which to select a token.
     * @param {Token5e} defaultToken - If specified, token to be selected by default,
     *                                 if null or not part of tokens, the first one is used.
     *
     * @returns {Promise<Token5e|null>}  Resolves with the selected token, if any.
     */
    static async createDialog(title, tokens, defaultToken) {
      if (!(tokens?.length > 0)) {
        return null;
      }
      const content = await this.getContent(tokens, defaultToken);
      return new Promise((resolve, reject) => {
        const dialog = new this(
          {
            title,
            content,
            buttons: {
              ok: {
                icon: '<i class="fas fa-check"></i>',
                label: 'Select', // TODO localize
                callback: (html) => {
                  const selectedTokenId = html.find(
                    "input[type='radio'][name='token']:checked"
                  )[0]?.value;
                  resolve(tokens.find((t) => t.id === selectedTokenId));
                },
              },
            },
            default: 'ok',
            close: () => resolve(null),
          },
          { classes: ['dnd5e', 'dialog'] }
        );
        dialog.render(true);
      });
    }
  }

  // Export class
  if (depReqFulfilled) {
    exportIdentifier('elwinHelpers.TokenSelectionDialog', TokenSelectionDialog);
  }

  /**
   * Returns the numeric value of the specified actor's size value.
   *
   * @param {Actor5e} actor actor for which to get the size value.
   *
   * @returns {number} the numeric value of the specified actor's size value.
   */
  function getActorSizeValue(actor) {
    return getSizeValue(actor?.system?.traits?.size ?? 'med');
  }

  /**
   * Returns the numeric value of the specified size.
   *
   * @param {string} size  the size name for which to get the size value.
   *
   * @returns {number} the numeric value of the specified size.
   */
  function getSizeValue(size) {
    return Object.keys(CONFIG.DND5E.actorSizes).indexOf(size ?? 'med');
  }

  /**
   * Helper function to create a simple dialog with labeled buttons and associated data.
   *
   * @param {object} data - The dialog's data.
   * @param {{label: string, value: object}[]} [data.buttons] - Buttons to be displayed in the dialog.
   * @param {string} [data.title] - Dialog's title.
   * @param {string} [data.content] - Dialog's html content.
   * @param {object} [data.options] - Dialog's options.
   * @param {string} [direction = 'row'] - Controls layout direction of the dialog's buttons. 'column' or 'row' accepted.
   *
   * @returns {object} the value associated to the selected button.
   */
  async function buttonDialog(data, direction) {
    const buttons = {};

    data.buttons.forEach((button) => {
      buttons[button.label] = {
        label: button.label,
        callback: () => button.value,
      };
    });

    const render = (html) => {
      const app = html.closest('.app');
      app.find('.dialog-buttons').css({ 'flex-direction': direction });
    };

    return await Dialog.wait(
      {
        title: data.title,
        content: data.content ?? '',
        buttons,
        render,
        close: () => null,
      },
      { classes: ['dnd5e', 'dialog'], height: '100%', ...data.options },
      {}
    );
  }

  /**
   * Helper function to create a simple dialog with labeled buttons and associated data.
   *
   * @param {object} data - The dialog's data.
   * @param {{label: string, value: object}[]} [data.buttons] - Buttons to be displayed in the dialog.
   * @param {string} [data.title] - Dialog's title.
   * @param {string} [data.content] - Dialog's html content.
   * @param {object} [data.options] - Dialog's options.
   * @param {string} [direction = 'row'] - Controls layout direction of the dialog's buttons. 'column' or 'row' accepted.
   *
   * @returns {object} the value associated to the selected button.
   */
  async function remoteButtonDialog(userId, data, direction) {
    return globalThis.elwinHelpers.socket.executeAsUser(
      'elwinHelpers.remoteButtonDialog',
      userId,
      data,
      direction
    );
  }

  /**
   * Returns the intersection point on the target token between the source token and target token and the ray used to compute the intersection.
   * The possible segments are computed using the same algo as MidiQOL uses to compute attack distances.
   *
   * @param {Token5e} sourceToken - The source token.
   * @param {Token5e} targetToken - The target token.
   *
   * @returns {{point: {x: number, y: number}, ray: Ray}} the intersection point between the source token and target token and the ray used to compute the intersection.
   */
  function getAttackSegment(sourceToken, targetToken) {
    if (!canvas || !canvas.scene || !canvas.grid || !canvas.dimensions) {
      return undefined;
    }
    if (!sourceToken || !targetToken) {
      return undefined;
    }

    const segments = getDistanceSegments(sourceToken, targetToken, true);
    if (debug) {
      console.warn(`${MACRO_NAME} | getAttackSegment (getDistanceSegments)`, {
        sourceToken,
        targetToken,
        segments,
      });
    }
    if (segments.length === 0) {
      return undefined;
    }
    const segmentDistances = simpleMeasureDistances(segments, {
      gridSpaces: true,
    });
    if (MidiQOL.configSettings()?.optionalRules.distanceIncludesHeight) {
      const heightDifference = calculateTokeHeightDifference(
        sourceToken,
        targetToken
      );
      segmentDistances.forEach(
        (distance, index, arr) =>
          (arr[index] = getDistanceAdjustedByVerticalDist(
            distance,
            heightDifference
          ))
      );
    }
    if (debug) {
      console.warn(
        `${MACRO_NAME} | getAttackSegment (simpleMeasureDistances)`,
        {
          segments,
          segmentDistances,
        }
      );
    }
    const idxShortestSegment = segmentDistances.indexOf(
      Math.min(...segmentDistances)
    );
    if (idxShortestSegment < 0) {
      return undefined;
    }
    const targetRect = new PIXI.Rectangle(
      targetToken.x,
      targetToken.y,
      targetToken.w,
      targetToken.h
    ).getBounds();
    const targetRay = segments[idxShortestSegment].ray;
    const intersectSegments = targetRect.segmentIntersections(
      targetRay.A,
      targetRay.B
    );
    if (debug) {
      console.warn(`${MACRO_NAME} | getAttackSegment (insersectSegments)`, {
        targetRect,
        targetRay,
        intersectSegments,
      });
    }
    if (!intersectSegments?.length) {
      return undefined;
    }
    return { point: intersectSegments[0], ray: targetRay };
  }

  /**
   * Get the distance segments between two objects. Based on midi-qol code used in getDistance.
   *
   * @param {Token5e} t1 - The first token.
   * @param {Token5e} t2 - The second token.
   * @param {boolean} wallBlocking - Whether to consider walls as blocking.
   *
   * @return {{ray: Ray}[]} an array of segments representing the distance between the two tokens.
   */
  function getDistanceSegments(t1, t2, wallBlocking = false) {
    const actor = t1.actor;
    const ignoreWallsFlag = foundry.utils.getProperty(
      actor,
      'flags.midi-qol.ignoreWalls'
    );
    if (ignoreWallsFlag) {
      wallBlocking = false;
    }

    const t1StartX = t1.document.width >= 1 ? 0.5 : t1.document.width / 2;
    const t1StartY = t1.document.height >= 1 ? 0.5 : t1.document.height / 2;
    const t2StartX = t2.document.width >= 1 ? 0.5 : t2.document.width / 2;
    const t2StartY = t2.document.height >= 1 ? 0.5 : t2.document.height / 2;

    let x, x1, y, y1;
    let segments = [];
    for (x = t1StartX; x < t1.document.width; x++) {
      for (y = t1StartY; y < t1.document.height; y++) {
        const origin = new PIXI.Point(
          //        ...canvas.grid.getCenter(
          Math.round(t1.document.x + canvas.dimensions.size * x),
          Math.round(t1.document.y + canvas.dimensions.size * y)
          //       )
        );
        for (x1 = t2StartX; x1 < t2.document.width; x1++) {
          for (y1 = t2StartY; y1 < t2.document.height; y1++) {
            const dest = new PIXI.Point(
              //            ...canvas.grid.getCenter(
              Math.round(t2.document.x + canvas.dimensions.size * x1),
              Math.round(t2.document.y + canvas.dimensions.size * y1)
              //          )
            );
            const r = new Ray(origin, dest);
            if (wallBlocking) {
              const collisionCheck =
                CONFIG.Canvas.polygonBackends.move.testCollision(origin, dest, {
                  mode: 'any',
                  type: 'move',
                });
              if (debug) {
                console.warn(`${MACRO_NAME} | getDistanceSegments`, {
                  segment: { ray: r },
                  collisionCheck,
                });
              }
              if (collisionCheck) {
                continue;
              }
            }
            segments.push({ ray: r });
          }
        }
      }
    }
    return segments;
  }

  /**
   * Based on midi-qol measureDistances function.
   * Measure distances for given segments with optional grid spaces.
   *
   * @param {{{ray: Ray}}[]} segments - Array of segments to measure distances for.
   * @param {object} options - Optional object with grid spaces configuration.
   *
   * @return {number[]} Array of distances for each segment.
   */
  function simpleMeasureDistances(segments, options = {}) {
    if (
      canvas?.grid?.grid.constructor.name !== 'BaseGrid' ||
      !options.gridSpaces
    ) {
      const distances = canvas?.grid?.measureDistances(segments, options);
      return distances;
    }

    const rule = canvas?.grid.diagonalRule;
    if (!options.gridSpaces || !['555', '5105', 'EUCL'].includes(rule)) {
      return canvas?.grid?.measureDistances(segments, options);
    }
    // Track the total number of diagonals
    let nDiagonal = 0;
    const d = canvas?.dimensions;

    const grid = canvas?.scene?.grid;
    if (!d || !d.size) return 0;

    // Iterate over measured segments
    return segments.map((s) => {
      const r = s.ray;
      // Determine the total distance traveled
      const nx = Math.ceil(Math.max(0, Math.abs(r.dx / d.size)));
      const ny = Math.ceil(Math.max(0, Math.abs(r.dy / d.size)));
      // Determine the number of straight and diagonal moves
      const nd = Math.min(nx, ny);
      const ns = Math.abs(ny - nx);
      nDiagonal += nd;

      if (rule === '5105') {
        // Alternative DMG Movement
        const nd10 =
          Math.floor(nDiagonal / 2) - Math.floor((nDiagonal - nd) / 2);
        const spaces = nd10 * 2 + (nd - nd10) + ns;
        return spaces * d.distance;
      } else if (rule === 'EUCL') {
        // Euclidean Measurement
        const nx = Math.max(0, Math.abs(r.dx / d.size));
        const ny = Math.max(0, Math.abs(r.dy / d.size));
        return Math.ceil(Math.hypot(nx, ny) * grid?.distance);
      } else {
        // Standard PHB Movement
        return Math.max(nx, ny) * grid.distance;
      }
    });
  }

  /**
   * Calculate the height difference between two tokens based on their elevation and dimensions.
   *
   * @param {Token5e} t1 - The first token.
   * @param {Token5e} t2 - The second token.
   *
   * @return {number} the height difference between the two tokens
   */
  function calculateTokeHeightDifference(t1, t2) {
    const t1Elevation = t1.document.elevation ?? 0;
    const t2Elevation = t2.document.elevation ?? 0;
    const t1TopElevation =
      t1Elevation +
      Math.max(t1.document.height, t1.document.width) *
        (canvas?.dimensions?.distance ?? 5);
    const t2TopElevation =
      t2Elevation +
      Math.min(t2.document.height, t2.document.width) *
        (canvas?.dimensions?.distance ?? 5); // assume t2 is trying to make itself small

    let heightDifference = 0;
    if (
      (t2Elevation > t1Elevation && t2Elevation < t1TopElevation) ||
      (t1Elevation > t2Elevation && t1Elevation < t2TopElevation)
    ) {
      //check if bottom elevation of each token is within the other token's elevation space, if so make the height difference 0
      heightDifference = 0;
    } else if (t1Elevation < t2Elevation) {
      // t2 above t1
      heightDifference =
        Math.max(0, t2Elevation - t1TopElevation) +
        (canvas?.dimensions?.distance ?? 5);
    } else if (t1Elevation > t2Elevation) {
      // t1 above t2
      heightDifference =
        Math.max(0, t1Elevation - t2TopElevation) +
        (canvas?.dimensions?.distance ?? 5);
    }

    return heightDifference;
  }

  /**
   * Returns the total measured distance for the specified horizDistance and vertDistance.
   *
   * @param {number} horizDistance - Horizontal distance.
   * @param {number} vertDistance - Vertical distance.
   *
   * @returns {number} the total measured distance including the vertical distance.
   */
  function getDistanceAdjustedByVerticalDist(horizDistance, vertDistance) {
    const rule = canvas.grid.diagonalRule;
    let distance = horizDistance;
    if (['555', '5105'].includes(rule)) {
      let nd = Math.min(horizDistance, vertDistance);
      let ns = Math.abs(horizDistance - vertDistance);
      distance = nd + ns;
      let dimension = canvas?.dimensions?.distance ?? 5;
      if (rule === '5105') {
        distance = distance + Math.floor(nd / 2 / dimension) * dimension;
      }
    } else {
      distance = Math.sqrt(
        vertDistance * vertDistance + horizDistance * horizDistance
      );
    }
    return distance;
  }

  /**
   * Returns the position where to move the token so its border is next to the specified point.
   *
   * @param {Token5e} token - The token to be moved.
   * @param {{x: number, y: number}} point - The point next to which to move the token.
   * @param {object} options - Options
   * @param {boolean} [options.snapToGrid] - If the the returned position will be snapped to grid or not.
   *
   * @returns {{x: number, y: number}} the position where to move the token so its border is next to the specified point.
   */
  function getMoveTowardsPosition(
    token,
    point,
    options = { snapToGrid: true }
  ) {
    const moveTowardsRay = new Ray(token.center, point);
    const tokenIntersects = token.bounds.segmentIntersections(
      moveTowardsRay.A,
      moveTowardsRay.B
    );
    if (!tokenIntersects?.length) {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | getMoveTowardsPosition no segmentIntersections found`,
          {
            tokenBounds: token.bounds,
            moveTowardsRay,
          }
        );
      }
      return undefined;
    }
    const centerToBounds = new Ray(moveTowardsRay.A, tokenIntersects[0]);

    const rayToCenter = Ray.towardsPoint(
      moveTowardsRay.A,
      moveTowardsRay.B,
      moveTowardsRay.distance - centerToBounds.distance
    );
    const tokenPos = {
      x: rayToCenter.B.x - token.w / 2,
      y: rayToCenter.B.y - token.h / 2,
    };
    let tokenPosSnapped = undefined;
    if (options?.snapToGrid && canvas.grid.type !== CONST.GRID_TYPES.GRIDLESS) {
      const isTiny = token.document.width < 1 && token.document.height < 1;
      const interval = canvas.grid.isHex ? 1 : isTiny ? 2 : 1;
      tokenPosSnapped = canvas.grid.getSnappedPosition(
        tokenPos.x,
        tokenPos.y,
        interval,
        { token }
      );
    }
    if (debug) {
      console.warn(`${MACRO_NAME} | getMoveTowardsPosition`, {
        tokenPos,
        tokenPosSnapped,
      });
    }
    return tokenPosSnapped ? tokenPosSnapped : tokenPos;
  }

  /**
   * Returns a position near the specified destPos where the specified token can be moved.
   * There must be no collision betwen the token current position and the token destination position,
   * if the destination position is occupied an altenative position can be returned but there must be no
   * collision between the initial destination position and the new proposed one.
   * An unoccupied space will be prioritized over an occupied one. If a nearToken is specified
   * the position returned must be adjacent to this token.
   *
   * @param {Token5e} token - The token for which to find a space where it could be moved.
   * @param {{x: number, y: number}} destPos - The token's tentative destination position.
   * @param {Token5e} nearToken - If defined, the final position of the token must be adjacent to this token.
   *
   * @returns {{pos: {x: number, y: number}, occupied: boolean}} the token's preferred final destination with a flag to indicate if its already occupied by another token.
   */
  function findMovableSpaceNearDest(token, destPos, nearToken) {
    const tokenInitialDestBounds = new PIXI.Rectangle(
      destPos.x,
      destPos.y,
      token.w,
      token.h
    ).getBounds();
    if (
      token.checkCollision(tokenInitialDestBounds.center, {
        type: 'move',
        mode: 'any',
      })
    ) {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | findMovableSpaceNearDest (wall collision initial destination)`,
          {
            tokenCenterPos: token.center,
            tokenDestCenterPos: tokenInitialDestBounds.center,
            wallCollision: true,
          }
        );
      }
      return undefined;
    }

    const size = Math.max(token.document.width, token.document.height);
    const isTiny = size < 1;
    let interval = 0;
    let gridIncrement = 1;
    let gridDistance = size;
    if (canvas.grid.type !== CONST.GRID_TYPES.GRIDLESS) {
      interval = canvas.grid.isHex ? 1 : isTiny ? 2 : 1;
      gridIncrement = canvas.grid.isHex || !isTiny ? 1 : size;
      gridDistance = isTiny ? 1 : size;
    }

    const posGen = nearbyPositionsGenerator(
      destPos,
      gridIncrement,
      gridDistance
    );

    let nearTokenShape = undefined;
    if (nearToken) {
      if (canvas.grid.isHex) {
        // Use padded poly otherwise overlaps does not work for certain adjacent grid spaces.
        const points = canvas.grid.grid.getBorderPolygon(
          nearToken.document.width,
          nearToken.document.height,
          CONFIG.Canvas.objectBorderThickness
        );
        nearTokenShape = new PIXI.Polygon(points).translate(
          nearToken.x,
          nearToken.y
        );
      } else {
        nearTokenShape = nearToken.bounds;
      }
    }

    const quadtree = canvas.tokens.quadtree;
    let collisionTest = (o, r) => o.t.id !== token.id && o.r.intersects(r);
    if (canvas.grid.isHex) {
      collisionTest = (o, _) => {
        if (o.t.id === token.id) {
          return false;
        }
        const points = canvas.grid.grid.getBorderPolygon(
          o.t.document.width,
          o.t.document.height,
          -CONFIG.Canvas.objectBorderThickness
        );
        const currentTokenShape = new PIXI.Polygon(points).translate(
          o.t.x,
          o.t.y
        );
        return currentTokenShape.overlaps(token.testCollisitionShape);
      };
    }
    let testIter = null;
    const unoccupiedDestinations = [];
    const occupiedDestinations = [];

    while (!(testIter = posGen.next()).done) {
      const testPos = testIter.value;
      const testPosSnapped = canvas.grid.getSnappedPosition(
        testPos.x,
        testPos.y,
        interval,
        { token }
      );
      let adjTargetShape;
      let adjTargetForNeighborTestShape;

      if (canvas.grid.isHex) {
        if (isTiny) {
          // For Tiny in hex grid we use a complete grid space to test touches near token
          const tmpPos = canvas.grid.getSnappedPosition(
            testPos.x,
            testPos.y,
            interval
          );
          const tmpPoints = canvas.grid.grid.getBorderPolygon(1, 1, 0);
          adjTargetForNeighborTestShape = new PIXI.Polygon(tmpPoints).translate(
            tmpPos.x,
            tmpPos.y
          );
        }
        const points = canvas.grid.grid.getBorderPolygon(
          token.document.width,
          token.document.height,
          0
        );
        adjTargetShape = new PIXI.Polygon(points).translate(
          testPosSnapped.x,
          testPosSnapped.y
        );
      } else {
        adjTargetShape = new PIXI.Rectangle(
          testPosSnapped.x,
          testPosSnapped.y,
          token.w,
          token.h
        ).getBounds();
      }

      const paddedAdjTargetShape = adjTargetShape
        .clone()
        .pad(-CONFIG.Canvas.objectBorderThickness);
      const paddedAdjTargetBounds =
        paddedAdjTargetShape instanceof PIXI.Rectangle
          ? paddedAdjTargetShape
          : paddedAdjTargetShape.getBounds();

      let touchesNearToken = true;
      let insideNearToken = false;
      if (nearToken) {
        adjTargetForNeighborTestShape ??= adjTargetShape;
        touchesNearToken = nearTokenShape.overlaps(
          adjTargetForNeighborTestShape
        );
        insideNearToken = nearTokenShape.overlaps(paddedAdjTargetShape);
      }
      if (debug) {
        console.warn(`${MACRO_NAME} | findMovableSpaceNearDest iter`, {
          testPos,
          testPosSnapped,
          testGrid: canvas.grid.grid.getGridPositionFromPixels(
            testPosSnapped.x,
            testPosSnapped.y
          ),
          touchesNearToken,
          insideNearToken,
          nearTokenShape,
          adjTargetShape,
          paddedAdjTargetShape,
        });
      }
      if (!touchesNearToken || insideNearToken) {
        continue;
      }
      const testPosCenter = paddedAdjTargetBounds.center;
      // Test if token can move from destPost to this new position
      const wallCollision = token.checkCollision(testPosCenter, {
        origin: tokenInitialDestBounds.center,
        type: 'move',
        mode: 'any',
      });
      if (wallCollision) {
        if (debug) {
          console.warn(
            `${MACRO_NAME} | findMovableSpaceNearDest (wall collision)`,
            {
              testPos,
              testPosCenter,
              origin: token.center,
              wallCollision,
            }
          );
        }
        continue;
      }
      // Set shape on current token to be used by grid collision test
      token.testCollisitionShape = paddedAdjTargetShape;
      const overlappingTokens = quadtree.getObjects(paddedAdjTargetBounds, {
        collisionTest,
      });
      if (debug) {
        console.warn(
          `${MACRO_NAME} | findMovableSpaceNearDest (token collision)`,
          {
            testPos,
            testPosSnapped,
            testPosCenter,
            origin: token.center,
            tokenCollision: !!overlappingTokens.size,
            overlappingTokens,
          }
        );
      }
      if (overlappingTokens.size) {
        // Location occupied by other token keep it in case no other not blocked by wall found
        occupiedDestinations.push(testPosSnapped);
      } else {
        unoccupiedDestinations.push(testPosSnapped);
      }
    }

    if (debug) {
      console.warn(`${MACRO_NAME} | findMovableSpaceNearDest (destinations)`, {
        unoccupiedDestinations,
        occupiedDestinations,
      });
    }
    return unoccupiedDestinations.length
      ? { pos: unoccupiedDestinations[0], occupied: false }
      : occupiedDestinations.length
      ? { pos: occupiedDestinations[0], occupied: true }
      : undefined;
  }

  /**
   * Generator of positions that are around the specified startingPoint up to the specified grid distance.
   * Note: this was inspired by warpgate's PlaceableFit.
   *
   * @param {{x: number, y: number}} startingPoint - The starting position from which to find positions around the starting point.
   * @param {number} gridIncrement - The grid increment to use around the starting point to include in the iteration,
   *                                 fractions of grid distance is allowed but only for square grids, e.g.: 0.5.
   * @param {number} gridDistance - The maximum grid distance around the starting point to include in the iteration.
   *
   * @returns the generator function of positions around the specific startingPoint.
   */
  function* nearbyPositionsGenerator(
    startingPoint,
    gridIncrement,
    gridDistance
  ) {
    const gridLoc = canvas.grid.grid.getGridPositionFromPixels(
      startingPoint.x,
      startingPoint.y
    );
    // Adjust starting location for partial grid distance increment on square grids only
    if (gridIncrement < 1 && canvas.grid.type === CONST.GRID_TYPES.SQUARE) {
      const dim = canvas.dimensions.size;
      gridLoc[0] += (startingPoint.y % dim) / dim;
      gridLoc[1] += (startingPoint.x % dim) / dim;
    }
    // partial grid distance is not supported for types of Grid other than Square
    if (gridIncrement < 1 && canvas.grid.type !== CONST.GRID_TYPES.SQUARE) {
      gridIncrement = 1;
    }
    const positions = new Set();

    const seen = (position) => {
      const key = position.join('.');
      if (positions.has(key)) return true;

      positions.add(key);
      return false;
    };

    seen(gridLoc);
    let queue = [gridLoc];
    let ring = 0;

    /* include seed point in iterator */
    yield { x: startingPoint.x, y: startingPoint.y, ring: -1 };

    while (queue.length > 0 && ring < gridDistance) {
      const next = queue.flatMap((loc) => getNeighbors(loc, gridIncrement));
      queue = next.filter((loc) => !seen(loc));

      for (const loc of queue) {
        const [x, y] = canvas.grid.grid.getPixelsFromGridPosition(...loc);
        yield { x, y, ring };
      }

      ring += gridIncrement;
    }

    return { x: null, y: null, ring: null };
  }

  /**
   * Returns an array of grid locations corresponding to the specified location neighbors.
   *
   * @param {number[]} loc - Array containing a grid location's a row and column.
   * @param {number} gridIncrement - The grid increment, should be 1 for small or larger creatures and 0.5 for tiny ones.
   *
   * @returns {number[][]} array containing the grid locations' row and column of the specified loc neighbors.
   */
  function getNeighbors(loc, gridIncrement) {
    const [row, col] = loc;
    if (gridIncrement < 1 && canvas.grid.type === CONST.GRID_TYPES.SQUARE) {
      let offsets = [
        [-gridIncrement, -gridIncrement],
        [-gridIncrement, 0],
        [-gridIncrement, gridIncrement],
        [0, -gridIncrement],
        [0, gridIncrement],
        [gridIncrement, -gridIncrement],
        [gridIncrement, 0],
        [gridIncrement, gridIncrement],
      ];
      return offsets.map((o) => [row + o[0], col + o[1]]);
    } else {
      return canvas.grid.grid.getNeighbors(row, col);
    }
  }

  /**
   * Registers third party reactions for the specified token.
   *
   * @param {MidiQOL.Workflow} workflow - The current MidiQL workflow.
   * @param {Token5e} reactionToken - The token for which to register third party reactions.
   * @param {OnUseMacros} onUseMacros - On use macros of the token matching the current trigger from which to extract the reaction data.
   */
  async function registerThirdPartyReactions(
    workflow,
    reactionToken,
    onUseMacros
  ) {
    if (!onUseMacros?.length) {
      return;
    }
    if (debug) {
      console.warn(`${MACRO_NAME} | registerThirdPartyReactions.`, {
        workflow,
        reactionToken,
        onUseMacros,
      });
    }
    for (let onUseMacro of onUseMacros) {
      const optionParts = onUseMacro.option.split(/\s*\|\s*/);
      let [targetOnUse, tprOptions] = optionParts;
      const options = {};
      if (tprOptions) {
        const tprOptionParts = tprOptions.split(/\s*;\s*/);
        for (let tprOptionPart of tprOptionParts) {
          const [name, value] = tprOptionPart.split(/\s*=\s*/);

          if (name && value) {
            if (!TPR_OPTIONS.includes(name)) {
              // Skip unknown options
              continue;
            }
            switch (name) {
              case 'canSee':
              case 'ignoreSelf':
              case 'pre':
              case 'post':
                options[name] = /true/.test(value.trim());
                break;
              default:
                options[name] = value.trim();
                break;
            }
          }
        }
      }
      await registerThirdPartyReaction(
        workflow,
        reactionToken,
        onUseMacro.macroName,
        targetOnUse,
        options
      );
    }
  }

  /**
   * Registers the reaction associated to macroName that can be triggered by the specified targetOnUse and token,
   * in the current workflow.
   *
   * @param {MidiQOL.Workflow} workflow - The current MidiQOL workflow.
   * @param {Token5e} reactionToken - The token for which to register third party reactions.
   * @param {string} macroName - The macroName
   * @param {string} targetOnUse - The targetOnUse trigger
   * @param {TprOptions} options - Options for the reaction registration.
   */
  async function registerThirdPartyReaction(
    workflow,
    reactionToken,
    macroName,
    targetOnUse,
    options = {}
  ) {
    if (debug) {
      console.warn(`${MACRO_NAME} | registerThirdPartyReaction.`, {
        workflow,
        reactionToken,
        macroName,
        targetOnUse,
        options,
      });
    }
    if (!reactionToken?.actor) {
      console.warn(
        `${MACRO_NAME} | No actor for reaction token.`,
        reactionToken
      );
      return;
    }
    let reactionItem = await getItemFromMacroName(
      macroName,
      workflow.item,
      workflow.actor
    );
    if (options.itemUuid) {
      reactionItem = await fromUuid(options.itemUuid);
    }

    if (
      !reactionItem ||
      !reactionItem?.system?.activation?.type?.includes('reaction')
    ) {
      console.warn(
        `${MACRO_NAME} | No reaction item found, skipping registration.`,
        {
          workflow,
          reactionToken,
          macroName,
          targetOnUse,
          options,
        }
      );
      return;
    }

    workflow.thirdPartyReactions ??= {};
    const tokenReactionsInfo = (workflow.thirdPartyReactions[
      reactionToken.document.uuid
    ] ??= { reactions: [] });
    tokenReactionsInfo.reactions.push({
      token: reactionToken,
      item: reactionItem,
      macroName,
      targetOnUse,
      triggerSource: options.triggerSource ?? 'target',
      canSee: options.canSee ?? false,
      ignoreSelf: options.ignoreSelf ?? false,
      preMacro: options.pre ?? false,
      postMacro: options.post ?? false,
    });
  }

  /**
   * Returns the item associated to the specifed macro name.
   *
   * Note: this uses the same logic has MidiQOL in Workflow.callMacro.
   *
   * @param {string} macroName - Name of the macro which should be associated to an item.
   * @param {Item5e} item - The current used item.
   * @param {Actor5e} actor - The current workflow actor.
   *
   * @returns {Item5e} the item associated to the specifed macroName.
   */
  async function getItemFromMacroName(macroName, item, actor) {
    let MQItemMacroLabel = getI18n('midi-qol.ItemMacroText');
    if (MQItemMacroLabel === 'midi-qol.ItemMacroText') {
      MQItemMacroLabel = 'ItemMacro';
    }

    let [name, uuid] = macroName?.trim().split('|') ?? [undefined, undefined];
    let macroItem = undefined;
    if (uuid?.length > 0) {
      macroItem = fromUuidSync(uuid);
      if (
        macroItem instanceof ActiveEffect &&
        macroItem.parent instanceof Item
      ) {
        macroItem = macroItem.parent;
      }
    }
    if (!name) {
      return undefined;
    }
    if (name.startsWith('function.')) {
      // Do nothing, use the macroItem UUID contained in the macroName
    } else if (
      name.startsWith(MQItemMacroLabel) ||
      name.startsWith('ItemMacro')
    ) {
      if (name === MQItemMacroLabel || name === 'ItemMacro') {
        if (!item) {
          return undefined;
        }
        macroItem = item;
      } else {
        const parts = name.split('.');
        const itemNameOrUuid = parts.slice(1).join('.');
        macroItem = await fromUuid(itemNameOrUuid);
        // ItemMacro.name
        if (!macroItem) {
          macroItem = actor.items.find(
            (i) =>
              i.name === itemNameOrUuid &&
              (foundry.utils.getProperty(i.flags, 'dae.macro') ??
                foundry.utils.getProperty(i.flags, 'itemacro.macro'))
          );
        }
        if (!macroItem) {
          return undefined;
        }
      }
    } else {
      // get a world/compendium macro.
      if (name.startsWith('Macro.')) {
        name = name.replace('Macro.', '');
      }
      const macro = game.macros?.getName(name);
      if (!macro) {
        const itemOrMacro = await fromUuid(name);
        if (itemOrMacro instanceof Item) {
          macroItem = itemOrMacro;
        } else if (itemOrMacro instanceof Macro) {
          return undefined;
        }
      }
    }
    return macroItem;
  }

  //----------------------------------
  // Copied from midi-qol because its not exposed in the API
  function getI18n(key) {
    return game.i18n.localize(key);
  }

  function getI18nOptions(key) {
    const translations = game.i18n.translations['midi-qol'] ?? {};
    const fallback = game.i18n._fallback['midi-qol'] ?? {};
    return translations[key] ?? fallback[key] ?? {};
  }

  /**
   * Returns the token name to be displayed in messages.
   * @param {Token5e} entity
   * @returns {string} the token name to be displayed.
   */
  function getTokenName(entity) {
    if (!entity) {
      return '<unknown>';
    }
    if (!(entity instanceof Token)) {
      return '<unknown>';
    }
    if (MidiQOL.configSettings().useTokenNames) {
      return entity.name ?? entity.actor?.name ?? '<unknown>';
    } else {
      return entity.actor?.name ?? entity.name ?? '<unknown>';
    }
  }

  function getToken(tokenRef) {
    if (!tokenRef) {
      return undefined;
    }
    if (tokenRef instanceof Token) {
      return tokenRef;
    }
    if (tokenRef instanceof TokenDocument) {
      return tokenRef.object;
    }
    if (typeof tokenRef === 'string') {
      const entity = MidiQOL.MQfromUuid(tokenRef);
      //@ts-expect-error return cast
      if (entity instanceof TokenDocument) {
        return entity.object;
      }
      if (entity instanceof Actor) {
        return MidiQOL.tokenForActor(entity);
      }
      return undefined;
    }
    if (tokenRef instanceof Actor) {
      return MidiQOL.tokenForActor(tokenRef);
    }
    return undefined;
  }

  /**
   * Returns the token image to display.
   * @param {Token5e} token the token for which to determine the image.
   * @returns {Promise<String>} the token image to display.
   */
  async function getTokenImage(token) {
    let img = token.document?.texture.src ?? token.actor?.img;
    if (
      MidiQOL.configSettings().usePlayerPortrait &&
      token.actor?.type === 'character'
    ) {
      img = token.actor?.img ?? token.document?.texture.src;
    }
    if (VideoHelper.hasVideoExtension(img ?? '')) {
      img = await game.video.createThumbnail(img ?? '', {
        width: 100,
        height: 100,
      });
    }
    return img;
  }

  /**
   * Returns the actor's maximum cast level for reactions.
   *
   * @param {Actor5e} actor - Actor for which to get the maximum cast level allowed for reactions.
   * @returns {integer} the actor's maximum cast level for reactions.
   */
  function maxReactionCastLevel(actor) {
    if (MidiQOL.maxReactionCastLevel) {
      return MidiQOL.maxReactionCastLevel(actor);
    }

    if (MidiQOL.configSettings().ignoreSpellReactionRestriction) {
      return 9;
    }
    const spells = actor.system.spells;
    if (!spells) {
      return 0;
    }
    let pactLevel = spells.pact?.value ? spells.pact?.level : 0;
    for (let i = 9; i > pactLevel; i--) {
      if (spells[`spell${i}`]?.value > 0) {
        return i;
      }
    }
    return pactLevel;
  }

  function itemReaction(item, triggerType, maxLevel, onlyZeroCost) {
    if (MidiQOL.itemReaction && MidiQOL.enableNotifications) {
      try {
        MidiQOL.enableNotifications(false);
        return MidiQOL.itemReaction(item, triggerType, maxLevel, onlyZeroCost);
      } finally {
        MidiQOL.enableNotifications(true);
      }
    }

    if (!item.system.activation?.type?.includes('reaction')) {
      return false;
    }
    if (item.system.activation?.cost > 0 && onlyZeroCost) {
      return false;
    }
    if (item.type === 'spell') {
      if (MidiQOL.configSettings().ignoreSpellReactionRestriction) {
        return true;
      }
      if (item.system.preparation?.mode === 'atwill') {
        return true;
      }
      if (item.system.level === 0) {
        return true;
      }
      if (
        item.system.preparation?.prepared !== true &&
        item.system.preparation?.mode === 'prepared'
      ) {
        return false;
      }
      if (item.system.preparation?.mode !== 'innate') {
        return item.system.level <= maxLevel;
      }
    }
    if (foundry.utils.isNewerVersion(game.system.version, '3.2')) {
      if (!item.system.attuned && item.system.attunement === 'required') {
        return false;
      }
    } else {
      if (item.system.attunement === CONFIG.DND5E.attunementTypes.REQUIRED) {
        return false;
      }
    }

    if (
      !checkUsage(item, {
        consumeUsage: item.hasLimitedUses,
        consumeResource: item.hasResource,
        slotLevel: false,
      })
    ) {
      return false;
    }

    return true;
  }

  //----------------------------------
  // Adapted from dnd5e because Item5e._getUsageUpdates displays ui notifications.

  /**
   * Verify that the consumed resources used by an Item are available.
   * If required resources are not available return false.
   * *Note:* based on dnd5e Item5e._getUsageUpdates
   *
   * @param {Item5e} item - The item for which to validation usage.
   * @param {ItemUseConfiguration} config - Configuration data for an item usage.
   * @returns {boolean} Returns false if an item cannot be used.
   */
  function checkUsage(item, config) {
    // Consume own limited uses or recharge
    if (config.consumeUsage) {
      const canConsume = canConsumeUses(item);
      if (canConsume === false) {
        return false;
      }
    }

    // Consume Limited Resource
    if (config.consumeResource) {
      const canConsume = canConsumeResource(item, config);
      if (canConsume === false) {
        return false;
      }
    }

    // Consume Spell Slots
    if (config.consumeSpellSlot) {
      const spellData = item.actor?.system.spells ?? {};
      const level = spellData[config.slotLevel];
      const spells = Number(level?.value ?? 0);
      if (spells === 0) {
        const isLeveled = /spell\d+/.test(config.slotLevel || '');
        const labelKey = isLeveled
          ? `DND5E.SpellLevel${this.system.level}`
          : `DND5E.SpellProg${config.slotLevel?.capitalize()}`;
        const label = game.i18n.localize(labelKey);
        if (debug) {
          console.warn(
            `${MACRO_NAME} | ${game.i18n.format('DND5E.SpellCastNoSlots', {
              name: item.name,
              level: label,
            })}`
          );
        }
        return false;
      }
    }

    // Determine whether the item can be used by testing for available concentration.
    if (config.beginConcentrating) {
      const { effects } = item.actor.concentration;

      // Case 1: Replacing.
      if (config.endConcentration) {
        const replacedEffect = effects.find(
          (i) => i.id === config.endConcentration
        );
        if (!replacedEffect) {
          if (debug) {
            console.warn(
              `${MACRO_NAME} | ${game.i18n.localize(
                'DND5E.ConcentratingMissingItem'
              )}`
            );
          }
          return false;
        }
      }

      // Case 2: Starting concentration, but at limit.
      else if (
        effects.size >= item.actor.system.attributes.concentration.limit
      ) {
        if (debug) {
          console.warn(
            `${MACRO_NAME} | ${game.i18n.localize(
              'DND5E.ConcentratingLimited'
            )}`
          );
        }
        return false;
      }
    }

    return true;
  }

  /**
   * Validates if consuming an item's uses or recharge is possible.
   * *Note:* based on Item5e._handleConsumeUses
   *
   * @param {Item5e} item The item for which to validate uses consumption.
   * @returns {boolean}   Return false to block further progress, or return true to continue.
   */
  function canConsumeUses(item) {
    const recharge = item.system.recharge || {};
    const uses = item.system.uses || {};
    const quantity = item.system.quantity ?? 1;
    let used = false;

    // Consume recharge.
    if (recharge.value) {
      if (recharge.charged) {
        used = true;
      }
    }

    // Consume uses (or quantity).
    else if (uses.max && uses.per && uses.value > 0) {
      const remaining = Math.max(uses.value - 1, 0);

      if (remaining > 0 || (!remaining && !uses.autoDestroy)) {
        used = true;
      } else if (quantity >= 2) {
        used = true;
      } else if (quantity === 1) {
        used = true;
      }
    }

    // If the item was not used, return a warning
    if (!used) {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | ${game.i18n.format('DND5E.ItemNoUses', {
            name: item.name,
          })}`
        );
      }
    }
    return used;
  }

  /**
   * Verifies if consuming an external resource is possible.
   * *Note:* based on Item5e._handleConsumeResource
   *
   * @param {Item5e} item - Item for which to validate resource consumption.
   * @param {ItemUseConfiguration} usageConfig - Configuration data for an item usage being prepared.
   * @returns {boolean} Return false to block further progress, or return true to continue.
   */
  function canConsumeResource(item, usageConfig) {
    const consume = item.system.consume || {};
    if (!consume.type) {
      return true;
    }

    // No consumed target
    const typeLabel = CONFIG.DND5E.abilityConsumptionTypes[consume.type];
    if (!consume.target) {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | ${game.i18n.format(
            'DND5E.ConsumeWarningNoResource',
            { name: item.name, type: typeLabel }
          )}`
        );
      }
      return false;
    }

    const as = item.actor.system;
    // Identify the consumed resource and its current quantity
    let resource = null;
    let amount = usageConfig.resourceAmount
      ? usageConfig.resourceAmount
      : consume.amount || 0;
    if (as.spells && amount in as.spells) {
      amount = consume.amount || 0;
    }
    let quantity = 0;
    switch (consume.type) {
      case 'attribute': {
        const amt = usageConfig.resourceAmount;
        const target =
          as.spells && amt in as.spells
            ? `spells.${amt}.value`
            : consume.target;
        resource = foundry.utils.getProperty(as, target);
        quantity = resource || 0;
        break;
      }
      case 'ammo':
      case 'material':
        resource = item.actor.items.get(consume.target);
        quantity = resource ? resource.system.quantity : 0;
        break;
      case 'hitDice': {
        const denom = !['smallest', 'largest'].includes(consume.target)
          ? consume.target
          : false;
        resource = Object.values(item.actor.classes).filter(
          (cls) => !denom || cls.system.hitDice === denom
        );
        quantity = resource.reduce(
          (count, cls) => count + cls.system.levels - cls.system.hitDiceUsed,
          0
        );
        break;
      }
      case 'charges': {
        resource = item.actor.items.get(consume.target);
        if (!resource) {
          break;
        }
        const uses = resource.system.uses;
        if (uses.per && uses.max) {
          quantity = uses.value;
        } else if (resource.system.recharge?.value) {
          quantity = resource.system.recharge.charged ? 1 : 0;
          amount = 1;
        }
        break;
      }
    }

    // Verify that a consumed resource is available
    if (resource === undefined) {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | ${game.i18n.format('DND5E.ConsumeWarningNoSource', {
            name: item.name,
            type: typeLabel,
          })}`
        );
      }
      return false;
    }

    // Verify that the required quantity is available
    let remaining = quantity - amount;
    if (remaining < 0) {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | ${game.i18n.format(
            'DND5E.ConsumeWarningNoQuantity',
            { name: item.name, type: typeLabel }
          )}`
        );
      }
      return false;
    }
    return true;
  }

  ////////////////// Remote functions ///////////////////////////////

  function registerRemoteFunctions() {
    const socket = socketlib.registerSystem(game.system.id);
    socket.register('elwinHelpers.remoteButtonDialog', _remoteButtonDialog);

    exportIdentifier('elwinHelpers.socket', socket);
  }

  async function _remoteButtonDialog(data, direction) {
    return await buttonDialog(data, direction);
  }
}

;// CONCATENATED MODULE: ./scripts/automations/macros/elwinsHelpersCoating.js
// ##################################################################################################
// Read First!!!!
// World Scripter Macro.
// Coating item helper functions for macros.
// v1.0.1
// Dependencies:
//  - ElwinHelpers
//  - MidiQOL
//
// Usage:
// Add this macro to the World Scripter compendium or macro folder, or in your own world script (it must be placed after elwin-helpers).
//
// Description:
// This macro exposes mutiple utility functions used by different item macros.
// Exported functions (see each function for documentation):
// - elwinHelpers.coating.getCoatingWeaponFilter
// - elwinHelpers.coating.getCoatingAmmoFilter
// - elwinHelpers.coating.handleCoatingItemOnUsePostActiveEffects
// - elwinHelpers.coating.getDefaultCoatingEffectItemData
// - elwinHelpers.coating.handleCoatedItemOnUsePostActiveEffects
// - elwinHelpers.coating.handleCoatingItemEffectOnUsePreActiveEffects
// - elwinHelpers.coating.handleCoatedItemOnUsePostDamageRoll
//
// To use this coating framwork you must a create a consumable with the following pattern:
//   - Consumable Type: Poison [or any other type]
//   - Poison Type: Injury [or any other subtype supported by the consumable type]
//   - Activation cost: 1 Action [or Bonus]
//   - Target: Self
//   - Range: None
//   - Duration: [your coating application specific duration, e.g.: 1 Minutes]
//   - Limited Uses: 1 of [your amount of doses] per Charges
//   - Uses Prompt: (checked)
//   - Destroy on Empty: (checked) [if desired]
//   - Action type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       function.elwinHelpers.disableManualEnchantmentPlacingOnUsePreItemRoll | Called before targeting is resolved
//       function.elwinHelpers.coating.handleCoatingItemOnUsePostActiveEffects | After Active Effects
// One effect must also be added:
//   - [your consumable coating's name]:
//      - Transfer Effect to Actor on ItemEquip (unchecked)
//      - Don't apply the effect: (checked)
//      - Duration empty
//      - Effects:
//          - flags.[world|midi-item-showcase-community].appliedCoating | Override | <JSON format of applied coating, see below>
//
// JSON format of applied coating effect:
//  name - Name of the temporary coating effect item (defaults to item's name).
//  img - The image of the temporary coating effect item (defaults to item's image).
//  allowedWeaponTypes - Array of weapon types allowed to be coated
//                       (true means all types allowed, null or undefined means default ["simpleM", "martialM", "simpleR", "martialR"]).
//  allowedDamageTypes - Array of damage types allowed to be coated
//                       (true means all types allowed, null or undefined means default ["slashing", "piercing"]).
//  allowedAmmoTypes - Array of ammo types allowed to be coated
//                     (true means all types allowed, undefined means use default mapping of damage type to ammo type).
//  maxWeaponHits - The maximum number of hits allowed before the coating wears off. (default value of 1, 0 means no limit)
//  maxAmmo - The maximum number of ammos than can be coated with one dose (default value of 1, 0 means ammo not allowed).
//  type - Type of the consumable temporary coating effect item, ex: poison
//         (defaults to item's system type if defined, otherwise it's poison)
//  subtype - Subtype of the consumable temporary coating effect item, ex: injury
//            (defaults to item's system subtype if defined, otherwise it's injury)
//  coatingLabel - The label to use to describe what was applied to the weapon or ammo.
//                 (defaults to "Poisoned" if type or damageType is poison otherwise it's "Coated")
//  coatingDuration - The coating application duration.
//                     (defaults to item's duration if defined, otherwise it's 60 seconds)
//    seconds - The number of seconds.
//    rounds - The number of rounds.
//    turns - The number of turns.
//  damage - Damage to be applied when a coated weapon or ammo hits.
//    formula - Damage formula of the coating item effect to be applied when a coated weapon or ammo hits.
//    type - Damage type to be applied when a coated weapon or ammo hits.
//    onSave - Damage on save, one of: none, half, full (default none).
//  otherDamage - Other damage to be applied when a coated weapon or ammo hits.
//    formula - Other damage formula of the coating item effect to be applied when a coated weapon or ammo hits.
//    type - Other damage type to be applied when a coated weapon or ammo hits (undefined means same type has coated item).
//    onSave - Damage on save, one of: none, half, full (default full).
//    condition - MidiQOL otherCondition expression to determine if the other damage should be applied or not to a target.
//  bonusDamage - Bonus damage to be applied when a coated weapon or ammo hits.
//    formula - Bonus damage formula to be applied when a coated weapon or ammo hits.
//    type - Bonus damage type to be applied when a coated weapon or ammo hits (undefined means same type has coated item).
//    canCrit - Flag to indicate if the bonus damage can do extra damage on a critical hit (default false).
//    condition - MidiQOL condition expression to determine if the bonus damage should be applied or not.
//  save - The save information if needed to apply effect or damage when a coated weapon or ammo hits.
//    ability - The save ability to resist to the coating item effect (default con).
//    dc - The save DC to resist to the coating item effect (default 10).
//  effect - Information on the effect to be applied when a coated weapon or ammo hits.
//    statuses - Statuses of an active effect of the coating item effect.
//    duration - The duration of the active effect.
//    specialDurations - Array of DAE special durations for the active effect.
//    condition - MidiQOL effectCondition expression to determine if the active effect should be applied or not to a target.
//  conditionalStatuses - Array of conditional statuses to be added to the coating item effect AE when a coated weapon or ammo hits if the condition is met.
//    status - Status that can be added to the coating item effect AE.
//    condition - MidiQOL condition expression to determine if the conditional status can be added or not to the statuses of the coating item active effect.
//
// Note: the condition for the conditionalStatuses contains extra data that contains the target save total and DC,
//       this allows for example to add an extra status depending on the level of save failure.
//  targetData:
//    saveDC - The save DC of the coating item effect.
//    saveTotal - The save total of the hit target.
//
// Examples of appliedCoating flag value:
//  1. Basic Poison with damage applied on failed save (DC 10) on a hit.
//  {
//    "damage": {
//      "formula": "1d4",
//      "type": "poison",
//    },
//    "save": {
//    }
//  }
//
//  2. Poison with half damage applied on successful save on a hit.
//  {
//    "damage": {
//      "formula": "12d6",
//      "type": "poison",
//      "onSave": "half"
//    },
//    "save": {
//      "dc": 19
//    }
//  }
//
//  3. Poison with status applied on failed save and extra status in case of failure by 5 or more on a hit.
//  {
//    "save": {
//      "dc": 13
//    },
//    "effect": {
//      "statuses": ["poisoned"],
//      "duration": {"seconds": 3600}
//    },
//    "conditionalStatuses": [
//      {
//        "status": "unconscious",
//        "condition": "(targetData?.saveTotal + 5) <= targetData?.saveDC"
//      }
//    ]
//  }
//
// 4. Oil that adds conditional bonus damage on a hit.
//  {
//    "coatingLabel": "Oiled",
//    "type": "potion",
//    "maxWeaponHits": 3,
//    "maxAmmo": 3,
//    "allowedDamageTypes": true,
//    "bonusDamage": {
//      "formula": "6d6",
//      "canCrit": true,
//      "condition": "raceOrType === 'dragon'"
//    }
//  }
// ###################################################################################################

function runElwinsHelpersCoating() {
  const VERSION = '1.0.1';
  const MACRO_NAME = 'elwin-helpers-coating';
  const MODULE_ID = 'midi-item-showcase-community';
  const WORLD_MODULE_ID = 'world';
  const MISC_MODULE_ID = 'midi-item-showcase-community';
  const active = true;
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? true;

  const COATING_EFFECT_NAME_PREFIX = 'CoatingAppliedTo';
  const AMMO_TRACKER_MOD = 'ammo-tracker-fvtt';

  // Default allowed weapon types
  const DEFAULT_ALLOWED_WEAPON_TYPES = [
    'simpleM',
    'martialM',
    'simpleR',
    'martialR',
  ];
  // Default allowed weapon damage types
  const DEAULT_ALLOWED_DMG_TYPES = ['slashing', 'piercing'];
  // Default mapping between damage type and ammo type
  const DEFAULT_ALLOWED_AMMO_TYPES_BY_DMG_TYPE = new Map([
    ['piercing', ['arrow', 'crossbowBolt', 'blowgunNeedle', 'firearmBullet']],
    ['bludgeoning', ['slingBullet']],
  ]);

  /**
   * Active effect duration
   * @typedef Duration
   * @property {number} seconds - The number of seconds.
   * @property {number} rounds - The number of rounds.
   * @property {number} turns - The number of turns.
   */

  /**
   * Applied coating damage data.
   * @typedef AppliedCoatingDamage
   * @property {string} formula - Damage formula of the coating item effect to be applied when a coated weapon or ammo hits.
   * @property {string} type - Damage type to be applied when a coated weapon or ammo hits.
   * @property {string} [onSave="none"] - Damage on save, one of: none, half, full.
   */

  /**
   * Applied coating damage data.
   * @typedef AppliedCoatingOtherDamage
   * @property {string} formula - Other damage formula of the coating item effect to be applied when a coated weapon or ammo hits.
   * @property {string|undefined} type - Other damage type to be applied when a coated weapon or ammo hits (undefined means same type has coated item).
   * @property {string} [onSave="full"] - Damage on save, one of: none, half, full.
   * @property {string|undefined} condition - MidiQOL otherCondition expression to determine if the other damage should be applied or not to a target.
   */

  /**
   * Applied coating bonus damage data.
   * @typedef AppliedCoatingBonusDamage
   * @property {string} formula - Bonus damage formula to be applied when a coated weapon or ammo hits.
   * @property {string|undefined} type - Bonus damage type to be applied when a coated weapon or ammo hits (undefined means same type has coated item).
   * @property {boolean} [canCrit=false] - Flag to indicate if the bonus damage can do extra damage on a critical hit.
   * @property {string} condition - MidiQOL condition expression to determine if the bonus damage should be applied or not.
   */

  /**
   * Applied coating save data.
   * @typedef AppliedCoatingSave
   * @property {string} [ability="con"] - The save ability to resist to the coating item effect.
   * @property {number} [dc=10] - The save DC to resist to the coating item effect.
   */

  /**
   * Applied coating item active effect data.
   * @typedef AppliedCoatingActiveEffect
   * @property {string[]} statuses - Statuses of an active effect of the coating item effect.
   * @property {Duration} duration - The duration of the active effect.
   * @property {string[]} [specialDurations=[]] - Array of DAE special durations for the active effect.
   * @property {string|undefined} condition - MidiQOL effectCondition expression to determine if the active effect should be applied or not to a target.
   */

  /**
   * Conditional statuses that can be added to the coating item effect AE.
   * @typedef ConditionalAppliedCoatingStatuses
   * @property {string} status - Status that can be added to the coating item effect AE.
   * @property {string} condition - MidiQOL condition expression to determine if the conditional status can be added or not to the statuses of the coating item active effect.
   */

  /**
 * Applied coating effect values.
 * @typedef {object} AppliedCoating
 * @property {string} origin - The UUID of the item that was used to apply the coating. [forced value]
 * @property {string} name - Name of the temporary coating effect item (defaults to item's name).
 * @property {string} img - The image of the temporary coating effect item (defaults to item's image).
 * @property {string[]|undefined|null|true} [allowedWeaponTypes=undefined] - Array of weapon types allowed to be coated
 *                                                          (true means all types allowed, null or undefined means default DEFAULT_ALLOWED_WEAPON_TYPES).
 * @property {string[]|undefined|null|true} [allowedDamageTypes=undefined] - Array of damage types allowed to be coated
 *                                                          (true means all types allowed, null or undefined means default DEAULT_ALLOWED_DMG_TYPES).

 * @property {string[]|undefined|null|true} [allowedAmmoTypes=undefined] - Array of ammo types allowed to be coated
 *                  (true means all types allowed, undefined means use mapping of damage type to ammo type from DEFAULT_ALLOWED_AMMO_TYPES_BY_DMG_TYPE).
 * @property {number} [maxWeaponHits=1] - The maximum number of hits allowed before the coating wears off. (0 means no limit)
 * @property {number} [maxAmmo=1] - The maximum number of ammos than can be coated in one use (0 means ammo not allowed).
 * @property {string} type - Type of the consumable temporary coating effect item, ex: poison
 *                           (defaults to item's system type if defined, otherwise it's poison)
 * @property {string} subtype - Subtype of the consumable temporary coating effect item, ex: injury
 *                              (defaults to item's system subtype if defined, otherwise it's injury)
 * @property {string} coatingLabel - The label to use to describe what was applied to the weapon or ammo.
 *                                   (defaults to "Poisoned" if type or damageType is poison otherwise it's "Coated")
 * @property {Duration} coatingDuration - The coating application duration.
 *                                        (defaults to item's duration if defined, otherwise it's 60 seconds)
 * @property {AppliedCoatingDamage} damage - Damage to be applied when a coated weapon or ammo hits.
 * @property {AppliedCoatingOtherDamage} otherDamage - Other damage to be applied when a coated weapon or ammo hits.
 * @property {AppliedCoatingBonusDamage} bonusDamage - Bonus damage to be applied when a coated weapon or ammo hits.
 * @property {AppliedCoatingSave} save - The save information if needed to apply effect or damage when a coated weapon or ammo hits.
 * @property {AppliedCoatingActiveEffect} effect - Information on the effect to be applied when a coated weapon or ammo hits.
 * @property {ConditionalAppliedCoatingStatuses[]} conditionalStatuses - Array of conditional statuses to be added to the coating item effect AE when a coated weapon or ammo hits.
 */

  const dependencies = ['midi-qol'];
  if (
    hasValidElwinHelpersVersion() &&
    globalThis.elwinHelpers?.requirementsSatisfied(MACRO_NAME, dependencies)
  ) {
    // Set a version to facilitate dependency check
    exportIdentifier('elwinHelpers.coating.version', VERSION);

    exportIdentifier(
      'elwinHelpers.coating.getCoatingWeaponFilter',
      getCoatingWeaponFilter
    );
    exportIdentifier(
      'elwinHelpers.coating.getCoatingAmmoFilter',
      getCoatingAmmoFilter
    );
    exportIdentifier(
      'elwinHelpers.coating.handleCoatingItemOnUsePostActiveEffects',
      handleCoatingItemOnUsePostActiveEffects
    );
    exportIdentifier(
      'elwinHelpers.coating.getDefaultCoatingEffectItemData',
      getDefaultCoatingEffectItemData
    );
    exportIdentifier(
      'elwinHelpers.coating.handleCoatedItemOnUsePostActiveEffects',
      handleCoatedItemOnUsePostActiveEffects
    );
    exportIdentifier(
      'elwinHelpers.coating.handleCoatingItemEffectOnUsePreActiveEffects',
      handleCoatingItemEffectOnUsePreActiveEffects
    );
    exportIdentifier(
      'elwinHelpers.coating.handleCoatedItemOnUsePostDamageRoll',
      handleCoatedItemOnUsePostDamageRoll
    );
  }

  /**
   * Returns true if elwin helpers' version is valid for this world script.
   * @returns {boolean} true if elwin helpers' version is valid for this world script.
   */
  function hasValidElwinHelpersVersion() {
    if (
      !foundry.utils.isNewerVersion(
        globalThis?.elwinHelpers?.version ?? '1.1',
        '2.7'
      )
    ) {
      const errorMsg = `${MACRO_NAME}: The Elwin Helpers world script must be installed, active and have a version greater than or equal 2.7.0`;
      ui.notifications.error(errorMsg);
      return false;
    }
    return true;
  }

  /**
   * Removes a previously exported function or variable and exports the specifed function or variable if the macro is active.
   *
   * @param {string} exportedIdentifierName the name of the exported function.
   * @param {function} exportedValue the function or variable to export.
   */
  function exportIdentifier(exportedIdentifierName, exportedValue) {
    if (foundry.utils.getProperty(globalThis, exportedIdentifierName)) {
      const lastIndex = exportedIdentifierName.lastIndexOf('.');
      delete foundry.utils.getProperty(
        globalThis,
        exportedIdentifierName.substring(0, lastIndex)
      )[exportedIdentifierName.substring(lastIndex + 1)];
    }
    if (active) {
      foundry.utils.setProperty(
        globalThis,
        exportedIdentifierName,
        exportedValue
      );
    }
  }

  /**
   * Returns a weapon filter function for the specified options.
   * The filter will receive as a param, a weapon item.
   * It returns true if the weapon does not have ammo and both of allowedWeaponTypes and allowedDamageTypes options are true (AND between options).
   *
   * @param {object} options - The options for the weapon filter.
   * @param {string[]|true} options.allowedWeaponTypes - The allowed weapon types (true means all types allowed).
   * @param {string[]|true} options.allowedDamageTypes - The allowed damage types (true means all types allowed).
   * @returns {function} a weapon filter for the specified options.
   */
  function getCoatingWeaponFilter({ allowedWeaponTypes, allowedDamageTypes }) {
    return function (item) {
      return (
        !item.system?.properties?.has('amm') &&
        (allowedWeaponTypes === true ||
          allowedWeaponTypes.includes(item.system?.type?.value)) &&
        (allowedDamageTypes === true ||
          item.system?.damage?.parts?.some((part) =>
            allowedDamageTypes.includes(part[1])
          ))
      );
    };
  }

  /**
   * Returns an ammo filter function for the specified options.
   * The filter will receive as a param, a consumable item of type ammo.
   * It returns true if either of allowedAmmoTypes or allowedDamageTypes options are true (OR between options).
   *
   * @param {object} options - The options for the ammo filter.
   * @param {string[]|true} options.allowedAmmoTypes - The allowed ammo types (true means all types allowed).
   * @param {string[]|true} options.allowedDamageTypes - The allowed damage types (true means all types allowed).
   * @returns {function} an ammo filter for the specified options.
   */
  function getCoatingAmmoFilter({ allowedAmmoTypes, allowedDamageTypes }) {
    return function (item) {
      return (
        (allowedAmmoTypes === true && allowedDamageTypes === true) ||
        (allowedAmmoTypes !== true &&
          allowedAmmoTypes.includes(item.system.type?.subtype)) ||
        (allowedDamageTypes !== true &&
          item.system?.damage?.parts?.some((part) =>
            allowedDamageTypes.includes(part[1])
          ))
      );
    };
  }

  /**
   * Handles the coating of a weapon or ammo.
   * Selects a weapon or ammunition on which to apply the coating defined on the item's AE (in the appliedCoating flag).
   * Once selected, creates a macro to handle the coated item and coating effect and mutate (dnd5e < v3.2) or apply an
   * enchantment on the selected item to be coated. If the Ammo Tracker module is active, updates its values if necessary.
   *
   * @param {object} parameters - The midi macro parameters and custom optional ones for coating application.
   * @param {Actor5e} parameters.actor - The actor that used the item.
   * @param {Token5e} parameters.token - The token associated to the actor.
   * @param {Item5e} parameters.rolledItem - The item used.
   * @param {MidiQOL.Workflow} parameters.workflow - The MidiQOL current workflow.
   * @param {function|undefined} parameters.weaponFilter - A custom weapon filter to be used to select allowed weapons.
   *                            (by default one is created using the values from the appliedCoating effect flag using getCoatingWeaponFilter)
   * @param {function|undefined} parameters.ammoFilter - A custom ammo filter to be used to select allowed ammos.
   *                            (by default one is created using the values from the appliedCoating effect flag using getCoatingAmmoFilter)
   * @param {function|undefined} parameters.getCoatingEffectItemData - A custom function to retrieve the temporary coating effect item.
   *                            (by default one is created using the values from the appliedCoating effect flag using getDefaultCoatingEffectItemData)
   */
  async function handleCoatingItemOnUsePostActiveEffects({
    actor,
    token,
    workflow,
    rolledItem,
    weaponFilter,
    ammoFilter,
    getCoatingEffectItemData,
  }) {
    const appliedCoating = getAppliedCoating(workflow, rolledItem);
    if (!appliedCoating) {
      return;
    }
    const {
      allowedWeaponTypes,
      allowedDamageTypes,
      allowedAmmoTypes,
      maxAmmo,
      maxWeaponHits,
    } = appliedCoating;
    weaponFilter ??= getCoatingWeaponFilter({
      allowedWeaponTypes,
      allowedDamageTypes,
    });
    if (!ammoFilter && maxAmmo) {
      ammoFilter = getCoatingAmmoFilter({
        allowedAmmoTypes,
        allowedDamageTypes,
      });
    }
    console.warn(`${MACRO_NAME} | filters`, {
      weaponFilter,
      ammoFilter,
      maxAmmo,
    });
    const { selectedItem, coatedItem } = await selectCoatingWeaponOrAmmo(
      actor,
      rolledItem,
      {
        weaponFilter,
        ammoFilter,
        maxAmmo,
      }
    );
    if (!selectedItem || !coatedItem) {
      return;
    }

    const effectName = `${COATING_EFFECT_NAME_PREFIX}-${coatedItem.id}`;
    const macroName = `${effectName}-by-${actor.uuid}`;

    if (coatedItem.type === 'weapon' && maxWeaponHits) {
      appliedCoating.uses = maxWeaponHits;
    } else if (coatedItem.type === 'consumable') {
      appliedCoating.uses = Math.max(0, coatedItem.system?.quantity ?? 0);
    }

    // Create macro to handle poison effect (this is done to allow existing item macro to be untouched),
    // but delete if it already exists.
    await game.macros.getName(macroName)?.delete();
    const [coatingMacro] = await Macro.createDocuments([
      {
        name: macroName,
        type: 'script',
        scope: 'global',
        command: getCoatingItemMacro(
          appliedCoating,
          getCoatingEffectItemData ?? getDefaultCoatingEffectItemData,
          macroName
        ),
      },
    ]);

    let mainEffect;
    if (foundry.utils.isNewerVersion(game.system.version, '3.2')) {
      const enchantmentEffectData = getCoatingApplicationEnchantment(
        rolledItem,
        appliedCoating,
        macroName
      );

      // Removes previous enchantment if it exists
      await elwinHelpers.deleteAppliedEnchantments(rolledItem.uuid);
      // Add enchantment to weapon or ammo
      mainEffect = await ActiveEffect.create(enchantmentEffectData, {
        parent: coatedItem,
        keepOrigin: true,
      });
    } else {
      mainEffect = await handleCoatingWarpgateMutation(
        rolledItem,
        actor,
        token,
        selectedItem,
        coatedItem,
        appliedCoating,
        effectName,
        macroName
      );
    }

    if (coatingMacro && mainEffect) {
      await mainEffect.addDependent(coatingMacro);
    }

    // Make the proper adjustments for Ammo Tracker
    if (
      game.modules.get(AMMO_TRACKER_MOD)?.active &&
      selectedItem.type === 'consumable' &&
      coatedItem.id !== selectedItem.id &&
      actor.type === 'character'
    ) {
      for (let combat of game.combats) {
        const actorAmmoAttr = `projectileData.${actor.id}`;
        const actorAmmo = combat.getFlag(AMMO_TRACKER_MOD, actorAmmoAttr);
        if (actorAmmo?.[selectedItem.id]) {
          const updatedActorAmmo = foundry.utils.deepClone(actorAmmo);
          updatedActorAmmo[selectedItem.id] =
            updatedActorAmmo[selectedItem.id] - appliedCoating.uses;
          updatedActorAmmo[coatedItem.id] = appliedCoating.uses;
          await combat.setFlag(
            AMMO_TRACKER_MOD,
            actorAmmoAttr,
            updatedActorAmmo
          );
        }
      }
    }
  }

  /**
   * Returns the applied coating for the specified item. The values are converted from a stringified JSON.
   * The values must be set in an active effect having the same name as the item,
   * for which 'Apply Effect to Actor' is not checked, that 'Don't apply the effect' is checked and
   * contains a change for which the key is flags.[world|"midi-item-showcase-community].apppliedCoating.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The MidiQOL current workflow.
   * @param {Item5e} itemUsed - The item used to apply the coating.
   * @returns {AppliedCoating} The applied coating value of the item.
   */
  function getAppliedCoating(currentWorkflow, itemUsed) {
    // Get applied coating default values if not defined
    const appliedCoatingValue = itemUsed.effects
      .find(
        (ae) =>
          ae.name === itemUsed.name &&
          ae.transfer === false &&
          ae.getFlag('dae', 'dontApply') === true
      )
      ?.changes.find((c) =>
        [
          `flags.${WORLD_MODULE_ID}.appliedCoating`,
          `flags.${MISC_MODULE_ID}.appliedCoating`,
        ].includes(c.key)
      )?.value;
    if (!appliedCoatingValue) {
      console.error(
        `${itemUsed.name} | Missing special AE with appliedCoating flag value.`,
        itemUsed
      );
      return undefined;
    }
    try {
      const appliedCoating = JSON.parse(appliedCoatingValue);

      appliedCoating.origin = itemUsed.uuid;
      appliedCoating.name ??= itemUsed.name;
      appliedCoating.img ??= itemUsed.img;
      appliedCoating.maxWeaponHits ??= 1;
      appliedCoating.maxAmmo ??= 1;
      appliedCoating.allowedWeaponTypes ??= DEFAULT_ALLOWED_WEAPON_TYPES;
      appliedCoating.allowedDamageTypes ??= DEAULT_ALLOWED_DMG_TYPES;
      appliedCoating.allowedAmmoTypes ??=
        appliedCoating.allowedDamageTypes === true
          ? true
          : appliedCoating.allowedDamageTypes.reduce(
              (acc, dmgType) =>
                acc.concat(
                  DEFAULT_ALLOWED_AMMO_TYPES_BY_DMG_TYPE.get(dmgType) ?? []
                ),
              []
            );
      appliedCoating.type ??= itemUsed.system.type?.value ?? 'poison';
      appliedCoating.subtype ??= itemUsed.system.type?.subtype ?? 'injury';
      if (!appliedCoating.coatingLabel) {
        if (
          appliedCoating.type === 'poison' ||
          appliedCoating.damageType === 'poison'
        ) {
          appliedCoating.coatingLabel =
            CONFIG.DND5E.conditionTypes['poisoned']?.label ?? 'Poisoned';
        } else {
          appliedCoating.coatingLabel = 'Coated';
        }
      }
      if (!appliedCoating.coatingDuration) {
        let duration =
          itemUsed.system?.duration?.value && itemUsed.system?.duration?.units
            ? itemUsed.system.duration
            : { value: 60, units: 'seconds' };
        appliedCoating.coatingDuration = DAE.convertDuration(
          duration,
          currentWorkflow.inCombat
        );
      }
      if (appliedCoating.damage) {
        appliedCoating.damage.onSave ??= 'none';
      }
      if (appliedCoating.otherDamage) {
        appliedCoating.otherDamage.onSave ??= 'full';
      }
      if (appliedCoating.bonusDamage) {
        appliedCoating.bonusDamage.canCrit ??= false;
      }
      if (appliedCoating.save) {
        appliedCoating.save.ability ??= 'con';
        appliedCoating.save.dc ??= 10;
      }
      if (appliedCoating.effect) {
        appliedCoating.effect.statuses ?? [];
        appliedCoating.effect.specialDurations ?? [];
      }
      return appliedCoating;
    } catch (error) {
      console.error(
        `${itemUsed.name} | Invalid json value in special AE with appliedCoating flag value.`,
        itemUsed,
        appliedCoatingValue,
        error
      );
      return undefined;
    }
  }

  /**
   * Returns the selected weapon or ammo to be coated and the effective item to be coated.
   * It can be different if the quantity of the selected weapon or ammo differs from what is allowed.
   * In that case a copy of the selected item is created and its quantity adjusted to the allowed one and
   * the quantity of original selected item is also adjusted.
   *
   * @param {Actor5e} actor - The actor using the item.
   * @param {Item5e} itemUsed - The item used to apply the coating.
   * @param {object} options - Options for filtering the choice of weapons and ammos.
   * @param {function} options.weaponFilter - Weapon filter.
   * @param {function} options.ammoFilter - Ammo filter.
   * @param {number} options.maxAmmo - Maximum number of ammo on which the coating can be applied in one use.
   * @returns {{selectedItem: Item5e, coatedItem: Item5e}} The selected weapon and the coated item, it may be different if the
   *          selectedItem had a greater quantity than the one allowed for coating.
   */
  async function selectCoatingWeaponOrAmmo(
    actor,
    itemUsed,
    { weaponFilter, ammoFilter, maxAmmo }
  ) {
    // Filter to remove items with 0 quantity and those already coated
    const basicFilter = (i) =>
      i.system?.quantity > 0 && !i.getFlag(MODULE_ID, 'appliedCoating.origin');
    const defaultWeaponFilter = (i) => !i.system?.properties?.has('amm');

    let itemChoices = actor.itemTypes.weapon.filter(
      (i) => basicFilter(i) && (weaponFilter ?? defaultWeaponFilter)(i)
    );
    if (maxAmmo && ammoFilter) {
      itemChoices = itemChoices.concat(
        actor.itemTypes.consumable.filter(
          (i) =>
            i.system?.type?.value === 'ammo' && basicFilter(i) && ammoFilter(i)
        )
      );
    }

    if (debug) {
      console.warn(`${MACRO_NAME} | selectWeaponOrAmmo`, { itemChoices });
    }

    const selectedItem = await elwinHelpers.ItemSelectionDialog.createDialog(
      `⚔️ ${itemUsed.name}: Choose your Weapon${
        maxAmmo && ammoFilter ? ' or Ammo' : ''
      }`,
      itemChoices,
      null
    );
    if (!selectedItem) {
      console.error(
        `${MACRO_NAME} | selectWeaponOrAmmo: Weapon or ammo selection was cancelled.`
      );
      return { selectedItem: undefined, coatedItem: undefined };
    }

    let coatedItem = selectedItem;
    const allowedQuantity =
      selectedItem.type === 'consumable'
        ? Math.min(maxAmmo ?? 1, selectedItem.system.quantity)
        : 1;

    if (allowedQuantity !== selectedItem.system.quantity) {
      // Split item with allowed quantity
      let itemData = selectedItem.toObject();
      delete itemData._id;
      itemData.system.quantity = allowedQuantity;
      await actor.updateEmbeddedDocuments('Item', [
        {
          _id: selectedItem.id,
          ['system.quantity']: selectedItem.system.quantity - allowedQuantity,
        },
      ]);
      const [newItem] = await actor.createEmbeddedDocuments('Item', [itemData]);
      coatedItem = newItem;
    }
    return { selectedItem, coatedItem };
  }

  /**
   * Returns the temporary item data for the coating effect.
   *
   * @param {AppliedCoating} appliedCoating - The basic information on the coating that was applied.
   * @param {string} macroName - The name of the macro that handles the coated item.
   *
   * @returns {object} a temporary item data for the coating effect.
   */
  function getDefaultCoatingEffectItemData(appliedCoating, macroName) {
    let coatingItemData = {
      type: 'consumable',
      // TODO use real name or generic one to not give idea of effects...
      name: `${appliedCoating.name} - Effect`,
      img: appliedCoating.img,
      system: {
        type: { value: appliedCoating.type, subtype: appliedCoating.subtype },
        actionType: 'other',
      },
    };
    if (appliedCoating.damage?.formula) {
      coatingItemData.system.damage = {
        parts: [
          [appliedCoating.damage.formula, appliedCoating.damage.type ?? ''],
        ],
      };
    }
    if (appliedCoating.otherDamage?.formula) {
      const otherDamageType = appliedCoating.otherDamage?.type
        ? `[${appliedCoating.otherDamage.type}]`
        : '';
      coatingItemData.system.formula = `${appliedCoating.otherDamage.formula}${otherDamageType}`;
      if (appliedCoating.otherDamage.condition) {
        foundry.utils.setProperty(
          coatingItemData,
          'flags.midi-qol.otherCondition',
          appliedCoating.otherDamage.condition
        );
      }
    }
    if (!foundry.utils.isEmpty(appliedCoating.save)) {
      foundry.utils.setProperty(coatingItemData, 'system.save', {
        ability: appliedCoating.save.ability,
        dc: appliedCoating.save.dc,
        scaling: 'flat',
      });
      foundry.utils.setProperty(
        coatingItemData,
        'flags.midiProperties.saveDamage',
        elwinHelpers.getMidiOnSavePropertyName(
          appliedCoating.damage?.onSave ?? 'none'
        )
      );
      foundry.utils.setProperty(
        coatingItemData,
        'flags.midiProperties.otherSaveDamage',
        elwinHelpers.getMidiOnSavePropertyName(
          appliedCoating.otherDamage?.onSave ?? 'full'
        )
      );
    }
    if (!foundry.utils.isEmpty(appliedCoating.effect)) {
      const imgPropName = game.release.generation >= 12 ? 'img' : 'icon';
      let coatingEffect = {
        statuses: appliedCoating.effect.statuses,
        transfer: false,
        [imgPropName]: appliedCoating.img,
        name: `${appliedCoating.name} - Effect`,
        duration: appliedCoating.effect.duration, // TODO set default duration?
        flags: {
          dae: { specialDuration: appliedCoating.effect.specialDurations },
          [MODULE_ID]: { coatingEffect: true },
        },
      };
      coatingItemData.effects = [coatingEffect];
    }
    if (appliedCoating.effect?.condition) {
      foundry.utils.setProperty(
        coatingItemData,
        'flags.midi-qol.effectCondition',
        appliedCoating.effect.condition
      );
    }
    if (!foundry.utils.isEmpty(appliedCoating.conditionalStatuses)) {
      foundry.utils.setProperty(
        coatingItemData,
        'flags.midi-qol.onUseMacroName',
        `[preActiveEffects]${macroName}`
      );
    }
    return coatingItemData;
  }

  /**
   * Returns the item macro to handle the coating item effect.
   *
   * @param {AppliedCoating} appliedCoating - The basic information on the applied coating.
   * @param {function} getCoatingEffectItemData - Function to retrieve the temporary item to apply the coating effect.
   * @param {string} macroName - The name of the macro that will handle the coated item.
   * @returns {string} the item macro to handle the coating item effect.
   */

  function getCoatingItemMacro(
    appliedCoating,
    getCoatingEffectItemData,
    macroName
  ) {
    let macroCmd = `
const MACRO_NAME = "${MACRO_NAME}";
const MODULE_ID = "${MODULE_ID}";
const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? true;
const COATING_EFFECT_NAME_PREFIX = "${COATING_EFFECT_NAME_PREFIX}";
if (debug) {
  console.warn(MACRO_NAME, { phase: args[0].tag ? \`\${args[0].tag}-\${args[0].macroPass}\` : args[0] }, arguments);
}

if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
  const macroData = args[0];
  if (workflow.hitTargets.size === 0 || workflow.aborted) {
    if (debug) {
      console.warn(\`\${MACRO_NAME} | No target hit or workflow was aborted.\`, workflow);
    }
    return;
  }
  await elwinHelpers.coating.handleCoatedItemOnUsePostActiveEffects(macroData, workflow, rolledItem, ${getCoatingEffectItemData.name}, "${macroName}");
}`;

    if (!foundry.utils.isEmpty(appliedCoating.conditionalStatuses)) {
      macroCmd += `
if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
  // Should only be called by temp coating item effect
  if (!workflow.options?.appliedCoating || !rolledItem?.effects.some(ae => ae.getFlag(MODULE_ID, "coatingEffect"))) {
    return;
  }
  return await elwinHelpers.coating.handleCoatingItemEffectOnUsePreActiveEffects(workflow, rolledItem, workflow.options.appliedCoating);
}
`;
    }

    if (appliedCoating.bonusDamage?.formula) {
      macroCmd += `
if (args[0].tag === "OnUse" && args[0].macroPass === "postDamageRoll") {
  return await elwinHelpers.coating.handleCoatedItemOnUsePostDamageRoll(workflow, rolledItem);
}
`;
    }

    if (!foundry.utils.isNewerVersion(game.system.version, '3.2')) {
      macroCmd += `
if (args[0] === "off") {
  // Only used for dnd5e < v3.2
  const sourceItem = fromUuidSync(lastArgValue.origin);
  const effectName = \`\${COATING_EFFECT_NAME_PREFIX}-\${sourceItem?.id}\`;
  await warpgate.revert(token.document, effectName);
  // Make sure that if other mutations were added after this one, 
  // we remove added label from the name
  if (sourceItem.name.includes(" ${appliedCoating.coatingLabel}")) {
    const newName = sourceItem.name.replace(" ${appliedCoating.coatingLabel}", "");
    await sourceItem.update({name: newName});
  }

  // Note: warpgate does not remove added flags, it nulls them, unset them is the item was not an added one
  if (sourceItem) {
    await sourceItem.unsetFlag(MODULE_ID, "appliedCoating");
  } 
}
`;
    }

    // Add functions to handle coating
    macroCmd += `

${getCoatingEffectItemData.toString()}
`;
    return macroCmd;
  }

  /**
   * Returns the enchantment data for the application of the coating on the item to be coated.
   *
   * @param {Item5e} itemUsed - The source coating item.
   * @param {AppliedCoating} appliedCoating - Info about the coating to be applied.
   * @param {string} macroName - The name of the macro created to handle the coating effect.
   * @returns {object} the enchantment data for the application of the coating on the item to be coated.
   */
  function getCoatingApplicationEnchantment(
    itemUsed,
    appliedCoating,
    macroName
  ) {
    const imgPropName = game.release.generation >= 12 ? 'img' : 'icon';
    const effectData = {
      name: `${itemUsed.name} - Application`,
      flags: {
        dnd5e: {
          type: 'enchantment',
        },
      },
      [imgPropName]: itemUsed.img,
      changes: [
        // Adjust item name
        {
          key: 'name',
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: ` [${appliedCoating.coatingLabel}]`,
          priority: 20,
        },
        // Adjust item description
        {
          key: 'system.description.value',
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: `<p><em>${appliedCoating.coatingLabel} by ${itemUsed.name}</em></p>\n{}`,
          priority: 20,
        },
        // Poison applied data
        {
          key: `flags.${MODULE_ID}.appliedCoating`,
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: JSON.stringify(appliedCoating),
          priority: 20,
        },
        // Add on use item for the coating effect
        {
          key: `flags.midi-qol.onUseMacroName`,
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: `${macroName},postActiveEffects`,
          priority: 20,
        },
      ],
      transfer: false,
      origin: itemUsed.uuid,
      duration: appliedCoating.coatingDuration,
    };
    if (appliedCoating.bonusDamage?.formula) {
      effectData.changes.push(
        // Add bonus damage for the coating effect
        {
          key: `flags.midi-qol.onUseMacroName`,
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: `${macroName},postDamageRoll`,
          priority: 20,
        }
      );
    }
    return effectData;
  }

  /**
   * Handles the warpgate mutation of the coated item and AE to keep track of the coating application's duration.
   *
   * @param {Item5e} itemUsed - The source coating item.
   * @param {Actor5e} sourceActor - The actor using the coated item.
   * @param {Token5e} sourceToken - The token associated to the source actor.
   * @param {Item5e} selectedItem - The weapon/ammo selected on which the coating is to be applied.
   * @param {Item5e} coatedItem - The weapon/ammo on which the coating is to be applied.
   *                                (it can be different than selecteWeapon if its quantity was more than the one allowed).
   * @param {AppliedCoating} appliedCoating - Info about the coating to be applied.
   * @param {string} effectName - The name of the active effect to create
   * @param {string} macroName - The name of the macro created to handle the coating effect.
   * @returns {ActiveEffect5e} the active effect created to track the coating application duration.
   */
  async function handleCoatingWarpgateMutation(
    itemUsed,
    sourceActor,
    sourceToken,
    selectedItem,
    coatedItem,
    appliedCoating,
    effectName,
    macroName
  ) {
    const newItemName = `${selectedItem.name} [${appliedCoating.coatingLabel}]`;
    let onUseMacroNameValue = selectedItem.getFlag(
      'midi-qol',
      'onUseMacroName'
    );
    if (onUseMacroNameValue) {
      onUseMacroNameValue += `,[postActiveEffects]${macroName}`;
    } else {
      onUseMacroNameValue = `[postActiveEffects]${macroName}`;
    }
    if (appliedCoating.bonusDamage?.formula) {
      onUseMacroNameValue += `,[postDamageRoll]${macroName}`;
    }
    console.warn(`${MACRO_NAME} | macro on use`, onUseMacroNameValue);
    const updates = {
      embedded: {
        Item: {
          [coatedItem.id]: {
            name: newItemName,
            system: {
              description: {
                value: `<p><em>${appliedCoating.coatingLabel} by ${
                  itemUsed.name
                }</em></p>\n${selectedItem.system?.description?.value ?? ''}`,
              },
            },
            flags: {
              [MODULE_ID]: { appliedCoating: appliedCoating },
              // Flag to handle the poison effect after an attack that hit
              'midi-qol': { onUseMacroName: onUseMacroNameValue },
            },
          },
        },
      },
    };

    const options = {
      name: effectName,
      comparisonKeys: { Item: 'id' },
    };

    // Remove previous applied AE if it exists (needs to be done before mutating otherwise the [off] callback reverts the mutation)
    await sourceActor.effects.getName(effectName)?.delete();

    if (warpgate.mutationStack(sourceToken.document).getName(effectName)) {
      await warpgate.revert(sourceToken.document, effectName);
    }

    await warpgate.mutate(sourceToken.document, updates, {}, options);

    const imgPropName = game.release.generation >= 12 ? 'img' : 'icon';
    const effectData = {
      changes: [
        // Flag to handle end of effect
        {
          key: 'macro.execute',
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: macroName,
          priority: 20,
        },
      ],
      origin: coatedItem.uuid, //flag the effect as associated to the poisoned item
      transfer: false,
      duration: appliedCoating.coatingDuration,
      [imgPropName]: itemUsed.img,
      name: effectName,
    };
    const effects = await sourceActor.createEmbeddedDocuments('ActiveEffect', [
      effectData,
    ]);
    return effects[0];
  }

  /**
   * Handles the application of the temporary coating item effect when a coated weapon or ammo hits.
   *
   * @param {object} macroData - The MidiQOL macro data param.
   * @param {MidiQOL.Workflow} currentWorkflow - The current MidiQOL workflow.
   * @param {Item5e} coatedItem - The coated item that was used.
   * @param {function} getCoatingEffectItemData - The function to retrieve the temporary item effect data.
   * @param {string} macroName - The name of the this macro.
   */
  async function handleCoatedItemOnUsePostActiveEffects(
    macroData,
    currentWorkflow,
    coatedItem,
    getCoatingEffectItemData,
    macroName
  ) {
    const appliedCoating = coatedItem.getFlag(MODULE_ID, 'appliedCoating');
    if (!appliedCoating) {
      console.error(
        `${MACRO_NAME} | Missing appliedCoating flag on coated weapon or ammo.`
      );
      return;
    }
    if (
      currentWorkflow.item?.uuid !== coatedItem.uuid &&
      currentWorkflow.ammo?.uuid !== coatedItem.uuid
    ) {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | Skip, called from a workflow on another item than the coated one.`
        );
      }
      return;
    }

    // Call complete item use with temp item on first hit target
    const coatingEffectItemData = getCoatingEffectItemData(
      appliedCoating,
      macroName
    );
    const coatingEffectItem = new CONFIG.Item.documentClass(
      coatingEffectItemData,
      {
        parent: currentWorkflow.actor,
        temporary: true,
      }
    );

    const options = {
      targetUuids: [macroData.hitTargetUuids[0]],
      workflowOptions: { targetConfirmation: 'none' },
      appliedCoating,
    };
    try {
      // Only trigger coating item effect if there is some damage or active effet that needs to be triggered by it.
      if (
        appliedCoating.damage ||
        appliedCoating.otherDamage ||
        appliedCoating.save ||
        appliedCoating.effect
      ) {
        await MidiQOL.completeItemUse(coatingEffectItem, {}, options);
      }
    } finally {
      // When the coated item has uses, update uses
      if (appliedCoating.uses) {
        const newUses = appliedCoating.uses - 1;
        if (newUses > 0) {
          if (foundry.utils.isNewerVersion(game.system.version, '3.2')) {
            appliedCoating.uses = newUses;
            await updateAppliedCoatingForEnchantment(
              appliedCoating,
              coatedItem
            );
          } else {
            await coatedItem.setFlag(MODULE_ID, 'appliedCoating.uses', newUses);
          }
        } else {
          // The maximum uses has been reached, the poisoned weapon effect expires...
          if (foundry.utils.isNewerVersion(game.system.version, '3.2')) {
            await elwinHelpers.deleteAppliedEnchantments(appliedCoating.origin);
          } else {
            const effectName = `${COATING_EFFECT_NAME_PREFIX}-${coatedItem.id}`;
            await currentWorkflow.actor.effects.getName(effectName)?.delete();
          }
        }
      }
    }
  }

  /**
   * Handles the preActiveEffects phase of a coating item effect to process conditional effects.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current MidiQOL workflow.
   * @param {Item5e} coatedItem - The coated item that was used.
   * @param {AppliedCoating} appliedCoating - Info about the coating to be applied.
   */
  async function handleCoatingItemEffectOnUsePreActiveEffects(
    currentWorkflow,
    coatedItem,
    appliedCoating
  ) {
    if (foundry.utils.isEmpty(appliedCoating?.conditionalStatuses)) {
      return;
    }
    const coatingEffect = coatedItem.effects.find(
      (ae) => !ae.transfer && ae.getFlag(MODULE_ID, 'coatingEffect')
    );
    if (!coatingEffect) {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | Could not find coatingEffect.`,
          coatedItem
        );
      }
      return;
    }
    const target = currentWorkflow.hitTargets.first();
    if (!currentWorkflow.applicationTargets.has(target)) {
      return;
    }
    const conditionData = MidiQOL.createConditionData({
      workflow: currentWorkflow,
      target,
      item: coatedItem,
      extraData: {
        targetData: {
          saveDC: currentWorkflow.saveDC,
          saveTotal: currentWorkflow.saveDisplayData?.find(
            (sdd) => sdd.target === target
          )?.rollTotal,
        },
      },
    });
    for (let conditionalStatus of appliedCoating.conditionalStatuses) {
      if (!conditionalStatus?.condition || !conditionalStatus?.status) {
        continue;
      }
      const returnValue = await MidiQOL.evalCondition(
        conditionalStatus.condition,
        conditionData,
        {
          errorReturn: false,
          async: true,
        }
      );
      if (returnValue) {
        coatingEffect.statuses.add(conditionalStatus.status);
      } else {
        if (debug) {
          console.warn(
            `${MACRO_NAME} | Condition to add conditional status was not fulfilled.`,
            {
              condition: conditionalStatus.condition,
              conditionalStatus,
              returnValue,
            }
          );
        }
      }
    }
  }

  /**
   * Handles the coating effect bonus damage that occurs during the coated item worflow.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi workflow.
   * @param {Item5e} coatedItem - The coated item that was used.
   */
  async function handleCoatedItemOnUsePostDamageRoll(
    currentWorkflow,
    coatedItem
  ) {
    if (!currentWorkflow.hitTargets.size) {
      // Not target hit, do nothing
      return;
    }
    if (currentWorkflow.hitTargets.size > 1) {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | Bonus damage can be applied to only one hit target, skip.`
        );
      }
      return;
    }
    let appliedCoating = coatedItem.getFlag(MODULE_ID, 'appliedCoating');
    if (!appliedCoating) {
      console.error(
        `${MACRO_NAME} | Missing appliedCoating flag on coated weapon or ammo.`
      );
      return;
    }

    if (appliedCoating.bonusDamage.condition) {
      const target = currentWorkflow.hitTargets.first();
      const conditionData = MidiQOL.createConditionData({
        workflow: currentWorkflow,
        target,
        item: currentWorkflow.item,
      });
      const returnValue = await MidiQOL.evalCondition(
        appliedCoating.bonusDamage.condition,
        conditionData,
        {
          errorReturn: false,
          async: true,
        }
      );
      if (!returnValue) {
        if (debug) {
          console.warn(
            `${MACRO_NAME} | Condition to apply bonus was not fulfilled.`,
            {
              condition: appliedCoating.bonusDamage.condition,
              conditionData,
              returnValue,
            }
          );
        }
        return;
      }
    }
    let options = {};
    if (appliedCoating.bonusDamage.canCrit) {
      options = elwinHelpers.getDamageRollOptions(currentWorkflow);
    }
    let damageType = appliedCoating.bonusDamage.type;
    if (!damageType && currentWorkflow.damageRolls?.length) {
      damageType = currentWorkflow.damageRolls[0].options?.type;
    }
    if (!damageType) {
      damageType = currentWorkflow.defaultDamageType ?? 'bludgeoning';
    }
    options.type = damageType;
    options.flavor = `${appliedCoating.name} - Bonus Damage`;
    const bonusDamageRoll = await new CONFIG.Dice.DamageRoll(
      appliedCoating.bonusDamage.formula,
      coatedItem?.getRollData() ?? currentWorkflow.actor.getRollData(),
      options
    ).evaluate();

    if (currentWorkflow.workflowOptions?.damageRollDSN !== false) {
      await MidiQOL.displayDSNForRoll(bonusDamageRoll, 'damageRoll');
    }

    let bonusDamageRolls = currentWorkflow.bonusDamageRolls ?? [];
    bonusDamageRolls.push(bonusDamageRoll);

    currentWorkflow.setBonusDamageRolls(bonusDamageRolls);
  }

  /**
   * Updates the appliedCoating flag of a coating enchantment on a coated item.
   *
   * @param {AppliedCoating} appliedCoating - The info about the applied coating.
   * @param {Item5e} coatedItem - The coated item for which to update its coating enchantment.
   */
  async function updateAppliedCoatingForEnchantment(
    appliedCoating,
    coatedItem
  ) {
    // Get enchantment AE
    const coatingEnchantment = coatedItem.effects.find(
      (ae) =>
        ae.transfer === false &&
        ae.origin === appliedCoating.origin &&
        ae.getFlag(game.system.id, 'type') === 'enchantment'
    );
    const appliedCoatingKey = `flags.${MODULE_ID}.appliedCoating`;
    if (!coatingEnchantment?.changes.find((c) => c.key === appliedCoatingKey)) {
      if (debug) {
        console.warn(
          `${MACRO_NAME} | Missing appliedCoating flag from enchantment AE`,
          coatedItem
        );
      }
      return;
    }
    // Update value
    const newChanges = foundry.utils.deepClone(coatingEnchantment.changes);
    newChanges.find((c) => c.key === appliedCoatingKey).value =
      JSON.stringify(appliedCoating);
    await coatingEnchantment.update({ changes: newChanges });
  }
}

;// CONCATENATED MODULE: ./scripts/automations/macros/bakanaUtils/runWorkflows.js
// ---------------------------------------------------------------------------------------------------
//                            Template Developed and Written by @bakanabaka
//
//  Generalized Midi-QOL workflow function injection utilizing a DAE effect to enable calls
//  Add a DAE effects to the actor to have them call into this macro during workflow execution.
//
//                          Don't be a baka, but do things that are bakana!
//                      No credit required for this. Just be cool to other people.
// ---------------------------------------------------------------------------------------------------

function _workflowArgs(a) {
  if (!a) throw `runWorkflow callArgs is empty`;
  return [
    a.speaker,
    a.actor,
    a.token,
    a.character,
    a.item,
    a.args,
    a.scope,
    a?.scope.workflow,
    a?.scope.options,
    a?.scope.effect,
    a?.scope.rolledItem,
    a?.scope.macroItem,
    a?.scope.midiData,
  ];
}

/**
 * Advanced error handler for Midi Macros, wraps all code in a try/catch and helps organize code.
 * @param callArgs The args value passed into the macro.
 * @param config Configurations defining how CompleteMidi will run.
 * @param config.verbose Verbose debug settings.
 * @param config.WORKFLOWNAME A function to run when the specified workflow occurs. (eg preCheckHits / off)
 * @param config.exceptionHandler(e) A function which runs before exit on a caught exception
 */
async function runWorkflows(callArgs, config) {
  const [
    speaker,
    actor,
    token,
    character,
    item,
    args,
    scope,
    workflow,
    options,
    effect,
    rolledItem,
    macroItem,
    midiData,
  ] = _workflowArgs(callArgs);

  /* ---------------------------------------------------------------------------------------------
    Below this line is the main function which runs everything else... you shouldn't need to
    modify this unless you need some additional debug information that isn't coming back.
    --------------------------------------------------------------------------------------------*/

  let workflowReturn;
  const [firstArg] = args;
  let workflowAction = firstArg.macroPass || firstArg;
  try {
    if (macroUtil.debugLevel) {
      console.group(
        `%c↳ (${macroItem.name}) [${workflowAction}]`,
        'background:black; color: white; padding:2px 5px;font-weight:bold;'
      );
    }

    if (
      firstArg.tag == 'OnUse' ||
      firstArg.tag == 'DamageBonus' ||
      firstArg.tag == 'TargetOnUse'
    ) {
      if (macroUtil.debugLevel > 2) console.warn('midiWorkflow:', workflow);
      if (!config[workflowAction])
        console.warn(
          `Undefined workflow attempting to run : ${workflowAction}`
        );
      else workflowReturn = await config[workflowAction](firstArg);

      if (macroUtil.debugLevel > 1) {
        if (workflow.aborted)
          console.warn(
            'Aborted flag on workflow is set to :',
            workflow.aborted
          );
      }
    } else {
      if (!config[workflowAction]) {
        if (workflowAction != 'on' && workflowAction != 'off')
          console.warn(
            `Undefined workflow attempting to run : ${workflowAction}`
          );
      } else workflowReturn = await config[workflowAction](args.splice(1));
    }

    if (macroUtil.debugLevel) console.groupEnd();
    return workflowReturn;
  } catch (e) {
    ui.notifications.error(
      `An unexpected error occurred in the execution of the ${macroItem.name} ItemMacro. Please press <F12> and inspect the console errors for more information.`
    );
    console.group(
      `%c❗❗ (${macroItem.name}) [Error in ${workflowAction}] ❗❗`,
      'background:black; color: white; padding:2px 5px;font-weight:bold;'
    );
    console.error('Unexpected error occurred :', e);
    if (config.exceptionHandler) await config.exceptionHandler(e);
    console.groupEnd();
    if (macroUtil.debugLevel) console.groupEnd();
  }
}

const workflowApi = { runWorkflows };

;// CONCATENATED MODULE: ./scripts/automations/macros/bakanaUtils/template.js
async function circle(positionEntity, range, color) {
  const gridScale = canvas.dimensions.distance; // distance of a tile

  const distance = Math.max(range, gridScale); // at minimum stretch to next grid
  const rangeTemplates = await canvas.scene.createEmbeddedDocuments(
    'MeasuredTemplate',
        [
            {
                t: 'circle',
                user: game.user.id,
                x: positionEntity.center?.x ?? positionEntity.x,
                y: positionEntity.center?.y ?? positionEntity.y,
                direction: 0,
                distance: distance,
                borderColor: '#000000',
                fillColor: color,
            },
        ]
  );
  return rangeTemplates[0];
}

function targets(template) {
    function getTargets(shape){
        const allTokens = canvas.tokens.placeables.filter(obj => obj);
        const targetArray = allTokens.filter(obj => {
            const c = obj.center;
            return shape.contains(c.x, c.y);
        });
        return targetArray;
    }

    let shape;
    if(template.t === CONST.MEASURED_TEMPLATE_TYPES.CIRCLE) {
        const ratio = canvas.scene.dimensions.distancePixels;
        shape = new PIXI.Circle(template.x, template.y, template.distance * ratio);
    }
    else if(template.t === CONST.MEASURED_TEMPLATE_TYPES.RECTANGLE) {
        shape = new PIXI.Rectangle(template.x, template.y, template.width, template.height);
    }
    else if(template.t === CONST.MEASURED_TEMPLATE_TYPES.CONE || template.t === CONST.MEASURED_TEMPLATE_TYPES.RAY) {
        shape = new PIXI.Polygon(template.shape.points.map((p,i) => {
            if(i%2 === 0) return p+template.x;
            else return p+template.y;
        }));
    }

    if(!shape) return;
    return getTargets(shape);
}

const templateApi = { circle, targets };

;// CONCATENATED MODULE: ./scripts/automations/macros/bakanaUtils/combat.js
/**
 * Adjusts damage formula to take critical hits into account if necessary.
 */
function damageFormula(workflow, formula) {
  // https://discord.com/channels/915186263609454632/1121049053497671761/1238084919893168188
  // Adjusts damage while ensuring damage multipliers are applied correctly
  const rollOptions = workflow.damageRolls[0].options;
  return new CONFIG.Dice.DamageRoll(formula, workflow.actor.getRollData(), {
    critical: workflow.isCritical || rollOptions.critical,
    criticalBonusDamage: rollOptions.criticalBonusDamage,
    criticalBonusDice: rollOptions.criticalBonusDice,
    criticalMultiplier: rollOptions.criticalMultiplier,
    multiplyNumeric: rollOptions.multiplyNumeric,
    powerfulCritical: rollOptions.powerfulCritical,
  }).formula;
}

function getCombatInfo() {
  return {
    active: game.combat?.active,
    round: game.combat?.round,
    turn: game.combat?.turn,
    id: game.combat?.id,
  };
}

function isSameTurn(combatInfo) {
  if (!game.combat) return false;
  if (combatInfo.id != game.combat.id) return false;
  if (combatInfo.round != game.combat.round) return false;
  return combatInfo.turn == game.combat.turn;
}

function isSameRound(combatInfo) {
  if (!game.combat) return false;
  if (combatInfo.id != game.combat.id) return false;
  return combatInfo.round == game.combat.round;
}

const combatApi = {
  damageFormula,
  getCombatInfo,
  isSameTurn,
  isSameRound,
};

;// CONCATENATED MODULE: ./scripts/automations/macros/bakanaUtils/effect.js
function find(actorEntity, effect) {
  return Array.from(actorEntity.allApplicableEffects()).find(
    (ef) => ef.name == effect?.name && ef.origin == effect?.origin
  );
}

async function create(
  entity,
  effectData,
  {
    concentrationItem,
    parentEntity,
    identifier,
    vae,
    interdependent,
    strictlyInterdependent,
    keepId,
  } = {}
) {
  macroUtil.dependsOn.required({ id: 'chris-premades', min: '0.12.27' });
  let options = {
    concentrationItem,
    parentEntity,
    identifier,
    vae,
    interdependent,
    strictlyInterdependent,
    keepId,
  };
  await chrisPremades.utils.effectUtils.createEffect(
    entity,
    effectData,
    options
  );
}

async function addDependents(entity, dependents) {
  macroUtil.dependsOn.required({ id: 'chris-premades', min: '0.12.27' });
  await chrisPremades.utils.effectUtils.addDependent(entity, dependents);
}

async function remove(actorEntity, effect) {
  let isAllEffect = find(actorEntity, effect);
  if (isAllEffect) macroUtil.generic.remove(isAllEffect);
  else await macroUtil.generic.remove(effect);
}

async function update(actorEntity, effect) {
  if (!actorEntity) return;
}

async function stack(actorEntity, effect, config) {
  let tempEffect = duplicate(effect);
  const actorEffects = Array.from(actorEntity.allApplicableEffects());
  const actorEffect = actorEffects.find((ef) => ef.name.includes(effect.name));
  let charges = 0;

  if (!actorEffect) {
    charges = config.intial || 1;
    tempEffect.name = effect.name + ` (${charges})`;
    tempEffect.flags.dae.stackCount = charges;
    return create(actorEntity, tempEffect);
  } else {
    const increment = config.increment || 1;
    charges = actorEffect.flags.dae.stackCount;
    if (charges < config.maximum) {
      charges = config.maximum
        ? Math.min(charges + increment, config.maximum)
        : charges + increment;
      tempEffect.name = effect.name + ` (${charges})`;
      tempEffect.flags.dae.stackCount = charges;

      await MidiQOL.socket().executeAsGM('removeEffects', {
        actorUuid: actorEntity.uuid,
        effects: [actorEffect.id],
      });
      return create(actorEntity, tempEffect);
    }
  }
}

const effectsApi = { create, find, remove };

;// CONCATENATED MODULE: ./scripts/automations/macros/bakanaUtils/item.js
function config(workflow, cfgs, opts) {
  for (let key of Object.keys(opts)) workflow.options[key] = opts[key];
  for (let key of Object.keys(cfgs)) workflow.config[key] = cfgs[key];
}

//---------------------------------------------------------------------------------------------------------------
// Synthetic Item Suite
//    Used to create temporary items that do not exist on the character sheet
//    These are helpful when you want to modify an item without actually modifying the item
//    Alternatively if you want to call an item on an actor that does not have that item currently
//
//  Mini-Guide:
//    https://github.com/MotoMoto1234/Midi-Wiki/wiki/Tutorials-‐-How-to-Make-CPR-Actions-in-Token-Action-Hud
//---------------------------------------------------------------------------------------------------------------

async function syntheticItem(itemData, actor, updates = {}, forceRecreate = false) {
  let item;
  foundry.utils.mergeObject(updates, { 'flags.world.syntheticItem': true });

  if (itemData.flags?.world?.syntheticItem && itemData.parent == actor && !forceRecreate) {
    item = itemData;
  } else if (
    macroUtil.dependsOn.isActivated({ id: 'chris-premades', min: '0.12.27' })
  ) {
    item = await chrisPremades.utils.itemUtils.syntheticItem(itemData, actor);
  } else {
    // Scraped from CPR 08/24/2024
    item = new CONFIG.Item.documentClass(itemData, { parent: actor });
    item.prepareData();
    item.prepareFinalAttributes();
    if (macroUtil.dependsOn.isActivated('dnd5e', '3.2'))
      item.applyActiveEffects();
  }

  return foundry.utils.mergeObject(item, updates);
}

async function syntheticItemDataRoll(
  itemData,
  actor,
  targets,
  { options = {}, config = {} } = {}
) {
  // Scraped from chrisPremades 08/24/2024 : utils.workflowUtils.syntheticItemDataRoll
  let item = await syntheticItem(itemData, actor);
  return await syntheticItemRoll(item, targets, { options, config });
}

async function syntheticItemRoll(
  item,
  targets,
  { options = {}, config = {} } = {}
) {
  if (macroUtil.dependsOn.isActivated({ id: 'chris-premades', min: '0.12.27' }))
    return chrisPremades.utils.workflowUtils.syntheticItemRoll(
      item,
      targets,
      ({ options: options, config: config } = {})
    );
  else {
    // Scraped from CPR 08/24/2024
    let defaultConfig = {
      consumeUsage: false,
      consumeSpellSlot: false,
    };
    let defaultOptions = {
      targetUuids: targets.map((i) => i.document.uuid),
      configureDialog: false,
      ignoreUserTargets: true,
      workflowOptions: {
        autoRollDamage: 'always',
        autoFastDamage: true,
        autoRollAttack: true,
      },
    };
    options = foundry.utils.mergeObject(defaultOptions, options);
    config = foundry.utils.mergeObject(defaultConfig, config);
    return await MidiQOL.completeItemUse(item, config, options);
  }
}

const preItemRoll = {
  config,
};

const itemApi = {
  syntheticItem,
  syntheticItemRoll,
  syntheticItemDataRoll,
  preItemRoll,
};

;// CONCATENATED MODULE: ./scripts/automations/macros/bakanaUtils/dependency.js
// Returns true if version A <= B <= C
function _isAscending(a, b, c) {
  return (
    !foundry.utils.isNewerVersion(a, b) && !foundry.utils.isNewerVersion(b, c)
  );
}

function _activated(dependency) {
  let isModule = game.modules.get(dependency.id);
  let entity = isModule
    ? game.modules.get(dependency.id)
    : globalThis[dependency.id];
  if (dependency.id == 'foundry') entity = game;

  if (!entity) return [false, undefined];
  if (!entity.active && isModule) return [false, undefined];
  if (!entity.version)
    ui.notifications.warn(`${entity} does not have a version field`);

  let [minimum, maximum] = [dependency.min, dependency.max];
  if (minimum == undefined) minimum = entity.version ?? '0.0.0';
  if (maximum == undefined) maximum = entity.version ?? '0.0.0';
  return [_isAscending(minimum, entity.version, maximum), entity?.version];
}

function _versionMessageAppend(dependency, version) {
  let msg = '';
  if (dependency.min) msg += `\n\tMinimum version: ${dependency.min}`;
  if (dependency.max) msg += `\n\tMaximum version: ${dependency.max}`;
  msg += '\n\tCurrent version: ' + version ? version : 0;
  return msg;
}

// Returns true if dependency exists, is active, and is inside any provided version window
function isActivated(dependency, warnMessage) {
  if (!dependency.id) return [false, undefined];
  let [isActivated, currentVersion] = _activated(dependency);
  if (!isActivated && warnMessage) {
    if (warnMessage.length) warnMessage += '\n';
    warnMessage += `Warning: ${dependency.id} is not between expected versions:`;
    warnMessage += _versionMessageAppend(dependency, currentVersion);
    console.warn(warnMessage);
  }
  return isActivated;
}

function hasRecommended(dependency) {
  return isActivated(dependency, 'Recommend installing the following:');
}

function hasSomeRecommended(dependencyList) {
  for (let dependency of dependencyList)
    if (isActivated(dependency)) return true;

  console.warn('Recommend installing one of the following:');
  for (let dependency of dependency) isActivated(dependency, '');
  return false;
}

// Throws an error if dependency does not exist, is not active, or is outside of version window
function required(dependency) {
  let [isActivated, currentVersion] = _activated(dependency);
  if (isActivated) return true;

  let errorMsg = `Requires ${dependency.id} to be installed and activated.`;
  errorMsg += _versionMessageAppend(dependency, currentVersion);
  throw errorMsg;
}

// Throws an error if no entry in dependency list exists, is active, and is inside version window
function someRequired(dependencyList) {
  let errorMsg = `Requires at least one of the following to be installed and activated:\n`;

  for (let dependency of dependencyList) {
    let [isActivated, currentVersion] = _activated(dependency);
    if (isActivated) return true;

    errorMsg += `Module Id: ${dependency.id}`;
    errorMsg += _versionMessageAppend(dependency, currentVersion);
  }
  throw errorMsg;
}

const dependencyApi = {
  isActivated,
  hasRecommended,
  hasSomeRecommended,
  required,
  someRequired,
};

;// CONCATENATED MODULE: ./scripts/automations/macros/bakanaUtils/animations/crownOfStars.js
// Original animation author Xenophes
// Rewritten animation by @bakanabaka

/**
 * @param token The token this effect should occur on
 * @param effect The active effect this should be tied to if any, undefined if none
 * @param moteCount The number of motes to space equally around the token
 * @param id A unique name if for some reason more than one of this effect is run on this actor
 * @param file A JB2A animation to swirl around you
 * @param scale Scale factor for the animation
 */
function crownOfStars_create(
  token,
  moteCount,
  {
    effect = undefined,
    id = 'Crown of Stars',
    file = 'jb2a.twinkling_stars.points07.white',
    scale = 0.5,
    radius = 0.5,
  } = {}
) {
  if (!macroUtil.dependsOn.hasRecommended({ id: 'sequencer' })) return;
  if (file.startsWith('jb2a.')) {
    if (
      !macroUtil.dependsOn.hasSomeRecommended([
        { id: 'jb2a_patreon' },
        { id: 'JB2A_DnD5e' },
      ])
    )
      return;
  }

  function rotateSprites(sequence) {
    sequence = sequence
      .effect()
      .file(file)
      .from(token, { cacheLocation: true });

    if (effect) sequence = sequence.tieToDocuments(effect);

    return sequence
      .attachTo(token)
      .scale(scale)
      .fadeIn(300)
      .fadeOut(500)
      .aboveLighting()
      .persist();
  }

  function loopDaLoop(sequence, objectName, delay) {
    return sequence.loopProperty(objectName, 'rotation', {
      from: 0,
      to: 360,
      duration: 5000,
      delay: delay,
    });
  }

  function createStarMoteEffect(sequence, idx) {
    sequence = rotateSprites(sequence);
    sequence = loopDaLoop(sequence, 'sprite', 500);
    sequence = loopDaLoop(sequence, 'spriteContainer', 0);
    return sequence
      .spriteOffset({ x: radius }, { gridUnits: true })
      .rotate((360 / moteCount) * idx)
      .name(`${id} - ${idx}`);
  }

  let starsSequence = new Sequence();
  for (let idx = 1; idx <= moteCount; ++idx)
    starsSequence = createStarMoteEffect(starsSequence, idx);
  starsSequence.play();
}

async function crownOfStars_remove(token, { id }, idx) {
  await Sequencer.EffectManager.endEffects({
    name: `${id} - ${idx}`,
    objects: token,
  });
}

async function destroy(token, { id }) {
  await Sequencer.EffectManager.endEffects({
    name: `${id} - *`,
    objects: token,
  });
}

const crownOfStars = {
  create: crownOfStars_create,
  remove: crownOfStars_remove,
  destroy: destroy,
};

;// CONCATENATED MODULE: ./scripts/automations/macros/bakanaUtils/animations.js


const animationApi = {
  crownOfStars: crownOfStars,
};

;// CONCATENATED MODULE: ./scripts/automations/macros/bakanaUtils/generic.js
function hasPermission(entity, userId) {
  let user = game.users.get(userId);
  if (!user) return false;
  return entity.testUserPermission(user, 'OWNER');
}

async function generic_remove(entity) {
  let isPermitted = hasPermission(entity, game.user.id);
  if (isPermitted) return await entity.delete();

  let [typeIs, config] = [undefined, undefined];
  if (entity instanceof ActiveEffect) {
    typeIs = 'removeEffects';
    config = { effects: [entity.id], actorUuid: entity.parent.uuid };
  }

  if (config && typeIs) await MidiQOL.socket().executeAsGM(typeIs, config);
}

const genericApi = { remove: generic_remove, hasPermission };

;// CONCATENATED MODULE: ./scripts/automations/macros/bakanaUtils/scene.js
function lightLevel(location = { x: 0, y: 0 }) {
  if (canvas.scene.globalLight) return 'bright';
  let c = Object.values(location);

  let lights = canvas.effects.lightSources.filter(
    (src) => !(src instanceof GlobalLightSource) && src.shape.contains(...c)
  );
  if (!lights.length) return 'dark';
  let inBright = lights.some((light) => {
    let {
      data: { x, y },
      ratio,
    } = light;
    let bright = ClockwiseSweepPolygon.create(
      { x: x, y: y },
      {
        type: 'light',
        boundaryShapes: [
          new PIXI.Circle(x, y, ratio * light.shape.config.radius),
        ],
      }
    );
    return bright.contains(...c);
  });
  if (inBright) return 'bright';
  return 'dim';
}

const sceneApi = {
  lightLevel,
};

;// CONCATENATED MODULE: ./scripts/automations/macros/bakanaHelpers.js










/**
 * Removes a previously exported function or variable and exports the specifed function or variable if the macro is active.
 *
 * @param {array} exportedIdentifierName the array of exported functions to be merged
 */
function setupApiCalls(exportedFunctions) {
  globalThis.macroUtil = foundry.utils.mergeObject(
    globalThis.macroUtil ?? {},
    exportedFunctions
  );
}

/**
 * Initializes the environment with macroUtil for macros
 */
let debugLevel = 0;
const version = '0.12.1';
function setupBakanaMacros() {
  if (globalThis.macroUtil?.version)
    if (!foundry.utils.isNewerVersion(version, globalThis.macroUtil.version)) return;  // only take newest changes
  // Initialize debugLevel variable
  globalThis.macroUtil = foundry.utils.mergeObject(globalThis.macroUtil ?? {}, {
    debugLevel,
    version,
  });

  setupApiCalls(workflowApi);
  setupApiCalls({ template: templateApi });
  setupApiCalls({ combat: combatApi });
  setupApiCalls({ effect: effectsApi });
  setupApiCalls({ item: itemApi });
  setupApiCalls({ dependsOn: dependencyApi });
  setupApiCalls({ animation: animationApi });
  setupApiCalls({ generic: genericApi });
  setupApiCalls({ scene : sceneApi});
}

;// CONCATENATED MODULE: ./scripts/automations/actions/forage.js
async function forage({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  /* Creator: thatlonelybugbear
   * Colaborators: Fridan99, ctbritt
   */

  // Define common food items to reduce redundancy in region definitions.
  const commonFoodItems = [
    'Berries',
    'Fish',
    'Flowers',
    'Fruit',
    'Fungi',
    'Insects',
    'Meat',
    'Seeds',
    'Roots',
    'Weeds',
  ];

  const regions = {
    'Mountains & Hills [DC 15]': {
      dc: 15,
      food: [...commonFoodItems, 'Nuts', 'Plants'],
    },
    'Forest & Jungle [DC 10]': {
      dc: 10,
      food: [...commonFoodItems, 'Nuts', 'Plants', 'Vegetables'],
    },
    'Desert [DC 20]': {
      dc: 20,
      food: ['Insects', 'Meat', 'Seeds', 'Roots', 'Weeds'],
    },
    'Dungeon & Underdark [DC 20]': {
      dc: 20,
      food: [
        'Berries',
        'Fish',
        'Flowers',
        'Fruit',
        'Fungi',
        'Meat',
        'Seeds',
        'Roots',
        'Weeds',
      ],
    },
    'City [DC 15]': {
      dc: 15,
      food: [
        'Flowers',
        'Insects',
        'Meat',
        'Seeds',
        'Roots',
        'Rubbish',
        'Weeds',
      ],
      note: 'Note: the Meat probably be bird, cat, dog, or rat',
    },
    'Arctic [DC 20]': {
      dc: 20,
      food: ['Fish', 'Meat', 'Seeds', 'Roots', 'Weeds'],
    },
    'Swamp [DC 15]': {
      dc: 15,
      food: [
        'Berries',
        'Fish',
        'Flowers',
        'Fungi',
        'Insects',
        'Meat',
        'Seeds',
        'Roots',
        'Weeds',
      ],
    },
    'Grassland [DC 10]': {
      dc: 10,
      food: [
        'Berries',
        'Flowers',
        'Fruit',
        'Insects',
        'Meat',
        'Seeds',
        'Roots',
        'Vegetables',
        'Weeds',
      ],
    },
    'Coast [DC 10]': {
      dc: 10,
      food: ['Fish', 'Fruit', 'Mollusks', 'Roots', 'Seaweed', 'Weeds'],
    },
  };

  // Set variables
  let foodRoll;
  let waterRoll;
  let numberRations = 0;
  let numberWaterskins = 0;
  let newFood;
  let newWater;

  // Check if the actor has a feature called "Natural Explorer".
  // Using `.some()` because we just need a boolean indicating existence.
  const isNaturalExplorer = token.actor.items.some((i) =>
    i.name.includes('Natural Explorer')
  );

  // Get various bonuses and mods
  let wisMod = token.actor.system.abilities.wis.mod;
  let proficiencyBonus = token.actor.system.attributes.prof;
  let isSurvivalProf = token.actor.system.skills.sur.prof.hasProficiency;
  let survivalBonus =
    token.actor.system.skills.sur.mod + (isSurvivalProf ? proficiencyBonus : 0);
  let waterBonus = `1d6 + ${wisMod}`;
  let foodBonus = `1d6 + ${wisMod}`;

  // Dialog 1 for region and roll type
  const dialogOptions = Object.entries(regions).reduce(
    (acc, [type, { dc }]) =>
      (acc += `<option value="${type}">${type}</option>`),
    ``
  );

  const title = 'Foraging';
  const buttons = ['Advantage', 'Normal', 'Disadvantage'].map((i) => ({
    label: i,
    callback: () => {
      const region = document.querySelector('#type')?.value;
      return { region, rollType: i };
    },
  }));
  const content = `
  <p>Choose a region and type of roll!</p>
  <hr>
  <form>
    <div class="form-group">
      <label for="type">Survival skill check</label>
      <div class="form-fields">
        <select id="type">${dialogOptions}</select>
      </div>
    </div>
  </form>`;
  const close = () => false;

  const dialog = await Dialog.wait(
    { title, content, buttons, close },
    { id: 'foraging-dialog' }
  );
  if (!dialog) return;

  // Dialog 2 for Natural Explorer
  if (isNaturalExplorer) {
    const rangerOptions = {
      No: 0,
      Yes: 1,
    };

    const rangerDialogOptions = Object.entries(rangerOptions).reduce(
      (acc, [type, value]) =>
        (acc += `<option value="${value}">${type}</option>`),
      ``
    );

    const buttons2 = ['Submit'].map((i) => ({
      label: i,
      callback: () => {
        const rangerOption = document.querySelector('#rangerOption')?.value;
        return { rangerOption };
      },
    }));
    const content2 = `
  <p>Is this your favorite terrain?</p>
  <hr>
  <form>
    <div class="form-group">
      <label for="rangerOption">Option</label>
      <div class="form-fields">
        <select id="rangerOption">${rangerDialogOptions}</select>
      </div>
    </div>
  </form>`;
    const close2 = () => false;

    const dialog2 = await Dialog.wait(
      { title, content: content2, buttons: buttons2, close: close2 },
      { id: 'ranger-dialog' }
    );
    if (!dialog2) return;
    const rangerOption = dialog2.rangerOption;

    if (rangerOption == 1) {
      foodBonus = `2 * (1d6 + ${wisMod})`;
    }
    if (rangerOption == 1) {
      survivalBonus += proficiencyBonus;
    }
  }

  // Roll the dice
  const diceFormula = dialog.rollType === 'Normal' ? '1d20' : '2d20';
  const survivalRoll = await new Roll(
    `${diceFormula}${
      dialog.rollType === 'Advantage'
        ? 'kh'
        : dialog.rollType === 'Disadvantage'
        ? 'kl'
        : ''
    } + ${survivalBonus}`,
    token.actor.getRollData()
  ).evaluate();
  let msg = await survivalRoll.toMessage({
    flavor: `Survival skill check (the task takes 4h of effort)`,
  });
  await game.dice3d?.waitFor3DAnimationByMessageID(msg.id);

  // Check if the roll is successful
  if (survivalRoll.total < regions[dialog.region].dc) {
    await ChatMessage.create({ content: `You didn't find any food or water` });
  } else {
    // Roll for food and water
    const waterRoll = await new Roll(`(${waterBonus})`).evaluate();
    msg = await waterRoll.toMessage({ flavor: `You get in gallons of water` });
    await game.dice3d?.waitFor3DAnimationByMessageID(msg.id);
    numberWaterskins = Math.floor(waterRoll.total / 2);

    const foodRoll = await new Roll(`(${foodBonus})`).evaluate();
    msg = await foodRoll.toMessage({ flavor: `You get in pounds of food` });
    await game.dice3d?.waitFor3DAnimationByMessageID(msg.id);
    numberRations = foodRoll.total;

    // Create the food types and message

    const foodTypes = {};
    for (let i = 0; i < foodRoll.total; i++) {
      const foodType =
        regions[dialog.region].food[
          Math.floor(Math.random() * regions[dialog.region].food.length)
        ];
      foodTypes[foodType] = (foodTypes[foodType] || 0) + 1;
    }
    const foodMessage = Object.entries(foodTypes)
      .sort(([typeA], [typeB]) => typeA.localeCompare(typeB))
      .map(([type, count]) => `${count > 1 ? count + 'x ' : ''}${type}`)
      .join(', ');
    await ChatMessage.create({
      content: `<b>You gathered the following types of food</b>: ${foodMessage}`,
    });
    if (dialog.region === 'City [DC 15]') {
      await ChatMessage.create({
        content: `<span style="color:red">Note:</span> The Meat is probably bird, cat, dog, or rat`,
      });
    }
  }

  // create rations from numberRations
  const newRations = {
    name: 'Rations (1 day)',
    type: 'consumable',
    system: {
      description: {
        value:
          '<p>Rations consist of dry foods suitable for extended travel, including jerky, dried fruit, hardtack, and nuts.</p>',
        chat: '',
        unidentified: 'Gear',
      },
      source: {
        custom: "Basic Rules, Player's Handbook",
      },
      quantity: numberRations,
      weight: 2,
      price: {
        value: 5,
        denomination: 'sp',
      },
      attunement: 0,
      equipped: false,
      rarity: '',
      identified: true,
      activation: {
        type: '',
        cost: null,
        condition: '',
      },
      duration: {
        value: '',
        units: '',
      },
      cover: null,
      crewed: false,
      target: {
        value: null,
        width: null,
        units: '',
        type: '',
        prompt: true,
      },
      range: {
        value: null,
        long: null,
        units: '',
      },
      uses: {
        value: 1,
        max: '1',
        per: 'charges',
        recovery: '',
        autoDestroy: true,
        prompt: true,
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      ability: null,
      actionType: '',
      attackBonus: '',
      chatFlavor: '',
      critical: {
        threshold: null,
        damage: '',
      },
      damage: {
        parts: [],
        versatile: '',
      },
      formula: '',
      save: {
        ability: '',
        dc: null,
        scaling: 'spell',
      },
      consumableType: 'food',
      properties: {},
    },
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: 'Adventuring Gear',
          isConsumable: false,
          isContainer: false,
          isCustomItem: false,
          isHomebrew: false,
          isMonkWeapon: false,
          isPack: false,
          levelInfusionGranted: null,
          tags: ['Social', 'Utility', 'Consumable'],
          sources: [
            {
              sourceId: 1,
              pageNumber: null,
              sourceType: 2,
            },
            {
              sourceId: 2,
              pageNumber: null,
              sourceType: 1,
            },
          ],
          stackable: true,
        },
        id: 0,
        entityTypeId: 0,
        definitionEntityTypeId: 2103445194,
        definitionId: 75,
        originalName: 'Rations (1 day)',
        version: '3.6.0',
      },
      'scene-packer': {
        sourceId: 'Item.',
        hash: '48e25bc763ee0105fb7e517ca9d3f455627600d0',
      },
      'midi-qol': {
        onUseMacroName: '',
      },
      'hide-item-value': {
        appraised: '',
        showPrice: false,
      },
      'custom-character-sheet-sections': {
        sectionName: '',
      },
      'rest-recovery': {
        data: {
          consumable: {
            enabled: true,
            dayWorth: true,
          },
          recovery: {
            enabled: false,
          },
        },
      },
      LocknKey: {
        IDKeysFlag: '',
        RemoveKeyonUseFlag: false,
        LPFormulaFlag: '',
        LPFormulaOverrideFlag: false,
        LBFormulaFlag: '',
        LBFormulaOverrideFlag: false,
        ReplacementItemFlag: '',
      },
      core: {},
    },
    effects: [],
    img: 'icons/consumables/meat/hock-leg-pink-brown.webp',
    folder: 'Odle0eG1kGbV13zL',
    _stats: {
      systemId: 'dnd5e',
      systemVersion: '2.4.0',
      coreVersion: '11.315',
      createdTime: 1695068367276,
      modifiedTime: 1701375852979,
      lastModifiedBy: 'jM4h8qpyxwTpfNli',
    },
  };
  // create waterskins from numberWaterskins
  const newWaterskins = {
    name: 'Waterskin',
    type: 'consumable',
    system: {
      description: {
        value: '<p>A waterskin can hold 4 pints of liquid.</p>',
        chat: '',
        unidentified: 'Gear',
      },
      source: {
        custom: "Basic Rules, Player's Handbook",
      },
      quantity: numberWaterskins ? Math.floor(numberWaterskins / 2) : 0,
      weight: 5,
      price: {
        value: 2,
        denomination: 'sp',
      },
      attunement: 0,
      equipped: false,
      rarity: '',
      identified: true,
      activation: {
        type: 'special',
        cost: null,
        condition: '',
      },
      duration: {
        value: '',
        units: '',
      },
      cover: null,
      crewed: false,
      target: {
        value: null,
        width: null,
        units: '',
        type: '',
        prompt: true,
      },
      range: {
        value: null,
        long: null,
        units: '',
      },
      uses: {
        value: 4,
        max: '4',
        per: 'charges',
        recovery: '',
        autoDestroy: false,
        prompt: true,
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      ability: null,
      actionType: '',
      attackBonus: '',
      chatFlavor: '',
      critical: {
        threshold: null,
        damage: '',
      },
      damage: {
        parts: [],
        versatile: '',
      },
      formula: '',
      save: {
        ability: '',
        dc: null,
        scaling: 'spell',
      },
      consumableType: 'food',
      properties: {},
    },
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: 'Adventuring Gear',
          isConsumable: false,
          isContainer: false,
          isCustomItem: false,
          isHomebrew: false,
          isMonkWeapon: false,
          isPack: false,
          levelInfusionGranted: null,
          tags: ['Container'],
          sources: [
            {
              sourceId: 1,
              pageNumber: null,
              sourceType: 2,
            },
            {
              sourceId: 2,
              pageNumber: null,
              sourceType: 1,
            },
          ],
          stackable: true,
        },
        id: 0,
        entityTypeId: 0,
        definitionEntityTypeId: 2103445194,
        definitionId: 92,
        originalName: 'Waterskin',
        version: '3.6.0',
      },
      'midi-qol': {
        onUseMacroName: '',
        onUseMacroParts: {
          items: [],
        },
      },
      'hide-item-value': {
        appraised: '',
        showPrice: false,
      },
      'custom-character-sheet-sections': {
        sectionName: '',
      },
      'rest-recovery': {
        data: {
          consumable: {
            enabled: true,
            dayWorth: true,
          },
          recovery: {
            enabled: false,
          },
        },
      },
      dicerecharge: {
        special: {
          active: false,
        },
        destroy: {
          check: false,
        },
      },
      LocknKey: {
        IDKeysFlag: '',
        RemoveKeyonUseFlag: false,
        LPFormulaFlag: '',
        LPFormulaOverrideFlag: false,
        LBFormulaFlag: '',
        LBFormulaOverrideFlag: false,
        ReplacementItemFlag: '',
      },
      core: {},
    },
    effects: [],
    img: 'icons/sundries/survival/wetskin-leather-purple.webp',
    folder: 'Odle0eG1kGbV13zL',
    _stats: {
      systemId: 'dnd5e',
      systemVersion: '2.4.0',
      coreVersion: '11.315',
      createdTime: 1696627466086,
      modifiedTime: 1701376004159,
      lastModifiedBy: 'jM4h8qpyxwTpfNli',
    },
  };

  // Add the rations and waterskins to the actor
  if (actor.items.find((i) => i.name === 'Rations (1 day)')) {
    let currentRations = actor.items.getName('Rations (1 day)').system.quantity;
    await actor.items
      .getName('Rations (1 day)')
      .update({ system: { quantity: currentRations + numberRations } });
  } else {
    await actor.createEmbeddedDocuments('Item', [newRations]);
  }
  if (actor.items.find((i) => i.name === 'Waterskin')) {
    let currentWaterskins = actor.items.getName('Waterskin').system.quantity;
    await actor.items
      .getName('Waterskin')
      .update({ system: { quantity: currentWaterskins + numberWaterskins } });
  } else {
    await actor.createEmbeddedDocuments('Item', [newWaterskins]);
  }
}

;// CONCATENATED MODULE: ./scripts/automations/actions/recallMonsterLore.js
async function recallMonsterLore({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (!token) return ui.notifications.warn('You must select a token.');
  const target = game.user.targets.first()?.actor;
  if (!target) return ui.notifications.warn('You must select a target.');
  const type = target.system.details.race || target.system.details.type.value;

  const skill = {
    aberration: 'arc',
    construct: 'arc',
    elemental: 'arc',
    monstrosity: 'arc',
    dragon: 'his',
    giant: 'his',
    humanoid: 'his',
    beast: 'nat',
    fey: 'nat',
    ooze: 'nat',
    plant: 'nat',
    celestial: 'rel',
    fiend: 'rel',
    undead: 'rel',
  }[type];

  const roll = await token.actor.rollSkill(skill, {
    chatMessage: false,
  });

  let Title = `Monster Lore (${roll.options.flavor})`;
  let SubTitle =
    '<b>Arcana:</b> Aberrations, Constructs, Elementals, Monstrosities<br/><b>History:</b> Dragons, Giants, Humanoids<br/><b>Nature:</b> Beasts, Fey, Oozes, Plants<br/><b>Religion:</b> Celestials, Fiends, Undead';
  let text = ' is trying to know';
  let flavorGradient = 'to bottom';
  let flavorColorFrom = '#a623f0';
  let flavorColorTo = '#c90cc6';
  let titleGradient = 'to left'; //Only change this to right
  let titleColorFrom = '#0073e6';
  let titleColorTo = '#0059b3';

  //Don't change this... Probably
  let name = token.document.name;
  let avatar = token.document.texture.src;

  //Formatting of the Chat message. I would not modify this if you are not proficient in HTML
  let flavor = `
<div style="display: flex; flex-direction: column;"> <div style="background: linear-gradient(${flavorGradient}, ${flavorColorFrom}, ${flavorColorTo}); margin-top: px; margin-bottom: 1px; padding: 1px; text-align: center; border-radius: 5px; width: 100%;">
  <div style = 'display: table-cell; border: none; border-radius: 50px; vertical-align: middle; text-align: center; font-size:14px; padding: 0 5px 0 55px; background-image: url("${avatar}"); background-size: 45px 45px; background-position: 5px; background-repeat: no-repeat; height: 6px; min-height: 6px;'>
    <div style = "display: table-cell; color: white; font-size: 12px; font-style: italic; font-family: 'Signika'; text-align: center; vertical-align: middle;">${name}${text}</div>
  </div>
</div>`;
  let html = `
<div style="background: linear-gradient(${titleGradient}, ${titleColorFrom}, ${titleColorTo}); color: black; font-size: 12px; font-family: 'Signika'; font-weight:bolder; margin-bottom: 0; padding: 0; text-align: center; border-radius: 5px 5px 0 0; text-shadow: 0 0 5px white; ">${Title}</div>
<div style="background: linear-gradient(${titleGradient}, ${titleColorFrom}, ${titleColorTo}); color: black; font-size: 10.5px;  text-shadow: 0 0 20px white; font-family: 'Signika'; font-weight:normal; margin-top: 0; margin-bottom: 1px; padding: 0; text-align: left; border-radius: 0 0 5px 5px; ">${SubTitle}</div>
<div style="width: 100%; background: #CEC7B6; color: black; border-width: 1px 1px 0 1px; border-style: solid; border-color:black; font-size: 11.5px; font-family: 'Signika'; margin-bottom: 0; padding: 3px 2px 3px 2px; text-align: left; border-radius: 5px 5px 0 0; ">`;
  if (roll.total >= 15) {
    html += `
  <div style="display: table-cell; width: 80px; font-weight: normal;"><strong><u>DC</u></strong><br/>
    15<br/>
    ${roll.total >= 20 ? '20<br/>' : ''}
    ${roll.total >= 25 ? '25<br/>' : ''}
    ${roll.total >= 30 ? '30+<br/>' : ''}
  </div>`;
  } else html += "You don't know anything about the creature...";

  if (roll.total >= 15) {
    html += `
  <div style="display: table-cell; font-weight:normal;"><strong><u>Information</u></strong><br/>
    Name, creature type<br/>
    ${roll.total >= 20 ? 'Senses, special abilities<br/>' : ''}
    ${roll.total >= 25 ? 'Resistances, vulnerabilities<br/>' : ''}
    ${roll.total >= 30 ? 'Legendary actions<br/>' : ''}
  </div>`;
  }
  html += `</div>
<div style="width: 100%; background: #B6AB91; color: black; border-width: 0 1px 0 1px; border-style: solid; border-color:black; font-size: 16px; font-family: 'Signika'; margin-bottom: 0; padding: 0; text-align: left; border-radius: 0; ">
  <div style="display: table-cell; width: 80px; font-weight:bold;"></div>
  <div style="display: table-cell; font-weight:normal;"></div>
</div>
<div style="width: 100%; background: #CEC7B6; color: black; border-width: 0 1px 1px 1px; border-style: solid; border-color:black; font-size: 16px; font-family: 'Signika'; margin-bottom: 0; padding: 3px 2px 0 2px; text-align: left; border-radius: 0 0 5px 5px; "></div>`;

  //Creation of the Chat message. Definitely don't modify this unless you can write this shit on your own!
  roll.toMessage({
    flavor: flavor + html,
    speaker: ChatMessage.getSpeaker({ token: token.document }),
  });
}

;// CONCATENATED MODULE: ./scripts/automations/actions/actions.js



let actions = {
  forage: forage,
  recallMonsterLore: recallMonsterLore,
};

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Artificer/soulOfArtifice.js
async function soulOfArtifice({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const damageReduction =
    args[0].workflowOptions.damageTotal - actor.system.attributes.hp.value + 1;
  const imgPropName = game.version < 12 ? 'icon' : 'img';
  let effectData = {
    name: workflow.item.name,
    [imgPropName]: workflow.item.img,
    origin: workflow.item.uuid,
    duration: {
      rounds: 1,
    },
    changes: [
      {
        key: 'flags.midi-qol.DR.all',
        mode: 0,
        value: damageReduction,
        priority: 20,
      },
    ],
    flags: {
      dae: {
        specialDuration: ['1Reaction'],
      },
    },
  };

  const checkUser =
    game.user?.isGM || game.user?.id === MidiQOL.playerForActor(actor)?.id;
  if (checkUser) await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
  else await MidiQOL.socket().executeAsGM('createEffect', actor.uuid, effectData);
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Barbarian/PathOfTheAncestrialGuardian/spiritShield.js
// ##################################################################################################
// Author: Elwin#1410
// Read First!!!!
// Adds an active effect with third party reaction when Rage is activated, that effect will trigger a reaction
// on the raging barbarian when a visible creature within range is damaged to allow him to use the feature
// to reduce the target's damage.
// If Vengeful Ancestors is present and the Barbarian has the appropriate level, it is triggered on the attacker.
// v3.2.0
// Dependencies:
//  - DAE [on][off]
//  - Times Up
//  - MidiQOL "on use" actor and item macro [preTargeting],[postActiveEffects],[tpr.isDamaged]
//  - Elwin Helpers world script
//  Note: A Rage item which adds a Rage effect when activated must be configured,
//        A scale dice value must be configured on the 'Path of the Ancestral Guardian' subclass,
//        its data value should resolve to '@scale.path-of-the-ancestral-guardian.spirit-shield'.
//
// How to configure:
// The Feature details must be:
//   - Feature Type: Class Feature
//   - Activation cost: 1 Reaction
//   - Target: 1 Ally (RAW it's Creature, but use Ally to trigger reaction on allies only)
//   - Range: 30 feet
//   - Action Type: Other
//   - Damage formula:
//     @scale.path-of-the-ancestral-guardian.spirit-shield | No Damage
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved (*)
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - No Full cover: (checked)
//   - Activation Conditions
//     - Reaction:
//       reaction === "tpr.isDamaged"
//   - This item macro code must be added to the DIME code of this feature.
// Two effects must also be added:
//   - Spirit Shield:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,postActiveEffects
//          - flags.dae.macro.itemMacro | Custom |
//   - Spirit Shield - TPR:
//      - Effect Suspended (checked)
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,tpr.isDamaged|ignoreSelf=true;canSee=true;pre=true;post=true
//
// Usage:
// This item has a passive effect that unsuspends a third party reaction effect when the Rage item is activated.
// It is also a reaction item that gets triggered by the third party reaction effect when appropriate.
//
// Description:
// There are multiple calls of this item macro, dependending on the trigger.
// When the Spirit Shield effect is transferred on the actor:
//   If the Rage effect is activated, unsuspends the third party reaction effect for the actor,
//   the rage effect is also updated to suspend the third party reaction effect on deletion.
// When the Spirit Shield effect is passivated:
//   Suspends the third party reaction effect if present.
// In the preTargeting (item OnUse) phase of the Spirit Shield item (in owner's workflow):
//   Validates that item was triggered by the remote tpr.isDamaged target on use,
//   otherwise the item workflow execution is aborted.
// In the postActiveEffects (item onUse) phase of the Rage item (in owner's workflow):
//   Unsuspends the third party reaction effect for the actor. The rage effect is also updated to suspend
//   the third party reaction effect on deletion.
// In the postActiveEffects (item onUse) phase of Spirit Shield item (in owner's workflow):
//   A damage reduction flag is set on the item's owner to be used by the post macro of the tpr.isDamaged reaction.
// In the tpr.isDamaged (TargetOnUse) pre macro (in attacker's workflow) (on other target):
//   Unsets the previous damage reduction flag on the item's owner.
// In the tpr.isDamaged (TargetOnUse) post macro (in attacker's workflow) (on other target):
//   If the reaction was used and completed successfully, the target's damage is reduced
//   by the amount specified in the damage reduction flag set by the executed reaction on the item's owner.
//   If the Vengeful Ancestors feat is present on the Spirit Shield item's owner and the Barbarian
//   has the appropriate level, the item is called on the Spirit Shield item owner's client.
// ###################################################################################################

async function spiritShield({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = 'Spirit Shield';
  const MODULE_ID = 'midi-item-showcase-community';
  // Default name of the Rage feature
  const RAGE_ITEM_NAME = 'Rage';
  // Default name of the Rage effect, normally same as the feature
  const RAGE_EFFECT_NAME = RAGE_ITEM_NAME;
  // Default name of the Vengeful Ancestors feature
  const VENGEFUL_ANCESTORS_ITEM_NAME = 'Vengeful Ancestors';
  // Level at which Vengeful Ancestors is triggered
  const VENGEFUL_ANCESTORS_TRIGGER_LEVEL = 14;
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.6'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'times-up', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }
  if (
    !foundry.utils.isNewerVersion(
      game.modules.get('midi-qol')?.version,
      '11.6'
    ) &&
    !MidiQOL.configSettings().v3DamageApplication
  ) {
    ui.notifications.error(
      `${DEFAULT_ITEM_NAME} | dnd5e v3 damage application is required.`
    );
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    // MidiQOL OnUse item macro for Spirit Shield
    return handleOnUsePreTargeting(workflow, scope.macroItem);
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isDamaged.pre'
  ) {
    // MidiQOL TargetOnUse pre macro for Spirit Shield pre reaction in the triggering midi-qol workflow
    // Remove previous damage prevention value
    await DAE.unsetFlag(scope.macroItem.actor, 'spiritShieldPreventedDmg');
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isDamaged.post'
  ) {
    // MidiQOL TargetOnUse post macro for Spirit Shield post reaction
    return await handleTargetOnUseIsDamagedPost(
      workflow,
      scope.macroItem,
      options?.thirdPartyReactionResult
    );
  } else if (
    args[0].tag === 'OnUse' &&
    args[0].macroPass === 'postActiveEffects'
  ) {
    if (scope.rolledItem?.name === RAGE_ITEM_NAME) {
      // MidiQOL OnUse item macro for Rage
      await handleRageOnUsePostActiveEffects(workflow, scope.macroItem);
    } else if (scope.rolledItem?.uuid === scope.macroItem?.uuid) {
      // MidiQOL OnUse item macro for Spirit Shield
      await handleOnUsePostActiveEffects(workflow, actor);
    }
  } else if (args[0] === 'on') {
    // DAE on item macro for spirit shield effect
    await handleOnEffect(actor, token, item);
  } else if (args[0] === 'off') {
    // DAE off item macro for spirit shield effect
    await handleOffEffect(actor, item);
  }

  /**
   * Handles the preItemRoll phase of the Spirit Shield item midi-qol workflow.
   * Validates that the actor has the Rage effect activated and that one and one target is selected,
   * that the target is within range and that there is line of sight to the target.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Spirit Shield item.
   *
   * @returns {boolean} true if all requirements are fulfilled, false otherwise.
   */
  function handleOnUsePreTargeting(currentWorkflow, sourceItem) {
    if (
      currentWorkflow.options?.thirdPartyReaction?.trigger !==
        'tpr.isDamaged' ||
      !currentWorkflow.options?.thirdPartyReaction?.itemUuids?.includes(
        sourceItem.uuid
      )
    ) {
      // Reaction should only be triggered by third party reaction AE
      const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature of the raging barbarian is damaged.`;
      ui.notifications.warn(msg);
      return false;
    }

    foundry.utils.setProperty(
      currentWorkflow,
      'options.workflowOptions.fastForwardDamage',
      true
    );
    return true;
  }

  /**
   * Handles the postActiveEffects of the Rage item midi-qol workflow.
   * If the Rage effect is activated, unsuspends the third party reaction effect on the actor,
   * the rage effect is also updated to suspend the third party reaction effect on deletion.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Spirit Shield item.
   */
  async function handleRageOnUsePostActiveEffects(currentWorkflow, sourceItem) {
    const sourceActor = currentWorkflow.actor;

    const rageEffect = sourceActor.appliedEffects.find(
      (ae) => ae.name === RAGE_EFFECT_NAME
    );
    if (rageEffect) {
      // The Barbarian is in Rage it can have the Spirit Shield third party reaction effect on
      await activateThirdPartyReactionEffect(
        sourceActor,
        true,
        sourceItem,
        currentWorkflow.token,
        rageEffect
      );
    }
  }

  /**
   * Handles the tpr.isDamaged post reaction of the Spirit Shield item in the triggering midi-qol workflow.
   * If the reaction was used and completed successfully, reduces the damage aplied to the target by the rolled amount
   * of the reaction. Also, if of appropriate level, activates the Vengeful Ancestors on the attacker.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Spirit Shield item.
   * @param {object} thirdPartyReactionResult - The third party reaction result.
   */
  async function handleTargetOnUseIsDamagedPost(
    currentWorkflow,
    sourceItem,
    thirdPartyReactionResult
  ) {
    const sourceActor = sourceItem.actor;
    const damageItem = currentWorkflow.damageItem;
    if (debug) {
      console.warn(`${DEFAULT_ITEM_NAME} | Reaction result`, {
        thirdPartyReactionResult,
        damageItem,
        preventedDmg: DAE.getFlag(sourceActor, 'spiritShieldPreventedDmg'),
      });
    }

    if (
      !(
        thirdPartyReactionResult?.uuid === sourceItem.uuid &&
        DAE.getFlag(sourceActor, 'spiritShieldPreventedDmg') > 0
      )
    ) {
      return;
    }
    const preventedDmg = DAE.getFlag(sourceActor, 'spiritShieldPreventedDmg');
    elwinHelpers.reduceAppliedDamage(damageItem, preventedDmg, sourceItem);
    // TODO Validate if prevented damage is total rolled or up to total damaged the target received
    //const effectivePreventedDamage = Math.max(0, currentAppliedDamage - damageItem.appliedDamage);
    //DAE.setFlag(sourceActor, "spiritShieldPreventedDmg", effectivePreventedDamage);

    if (
      (sourceActor.getRollData().classes?.barbarian?.levels ?? 0) >=
      VENGEFUL_ANCESTORS_TRIGGER_LEVEL
    ) {
      // Activate Vengeful Ancestors
      const vengefulAncestorsItem = sourceActor.items.getName(
        VENGEFUL_ANCESTORS_ITEM_NAME
      );
      if (!vengefulAncestorsItem) {
        if (debug) {
          console.warn(
            `${DEFAULT_ITEM_NAME} | Barbarian is missing the ${VENGEFUL_ANCESTORS_ITEM_NAME} feature.`
          );
        }
        return;
      }

      const options = {
        targetUuids: [currentWorkflow.tokenUuid],
        configureDialog: false,
        spiritShieldVengefulAncestorsTrigger: true,
        workflowOptions: {
          fastForwardDamage: true,
          autoRollDamage: 'always',
          targetConfirmation: 'none',
        },
      };

      const data = {
        itemData: vengefulAncestorsItem.toObject(),
        actorUuid: sourceActor.uuid,
        targetUuids: options.targetUuids,
        options,
      };

      let player = MidiQOL.playerForActor(sourceActor);
      if (!player?.active) {
        // Find first active GM player
        player = game.users?.activeGM;
      }
      if (!player?.active) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | No active player or GM for actor.`,
          sourceActor
        );
        return;
      }

      // Register hook to call retribution damage after roll is complete
      Hooks.once(
        `midi-qol.RollComplete.${currentWorkflow.itemUuid}`,
        async (currentWorkflow2) => {
          if (
            !elwinHelpers.isMidiHookStillValid(
              DEFAULT_ITEM_NAME,
              'midi-qol.RollComplete',
              VENGEFUL_ANCESTORS_ITEM_NAME,
              currentWorkflow,
              currentWorkflow2,
              debug
            )
          ) {
            return;
          }
          await MidiQOL.socket().executeAsUser(
            'completeItemUse',
            player.id,
            data
          );
        }
      );
    }
  }

  /**
   * Handles the postActiveEffects of the Spirit Shield item midi-qol workflow.
   * A flag is added to the Barbarian with the damage reduction to be applied and the item card
   * is updated to inform of the damage reduction to be applied on the target.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Actor5e} sourceActor - The owner of the Spirit Shield item.
   */
  async function handleOnUsePostActiveEffects(currentWorkflow, sourceActor) {
    const targetToken = currentWorkflow.targets.first();
    if (!targetToken) {
      // No target found
      return;
    }
    const targetActor = targetToken.actor;
    if (!targetActor) {
      // No actor found
      return;
    }

    const total = currentWorkflow.damageRolls?.[0]?.total ?? 0;
    await DAE.setFlag(sourceActor, 'spiritShieldPreventedDmg', total);

    const infoMsg = `<p>You prevent <strong>${total}</strong> points of damage to <strong>\${tokenName}</strong>.</p>`;
    await elwinHelpers.insertTextIntoMidiItemCard(
      'beforeButtons',
      workflow,
      elwinHelpers.getTargetDivs(targetToken, infoMsg)
    );
  }

  /**
   * Handles DAE 'on' macro call for the Spirit Shield effect.
   * If the Rage effect is activated, unsuspends the third party reaction effect for the actor,
   * the rage effect is also updated to suspend the third party reaction effect on deletion.
   *
   * @param {Actor5e} sourceActor - The owner of the source item.
   * @param {Token5e} sourceToken - The token of the source actor.
   * @param {Item5e} sourceItem - The Spirit Shield item.
   */
  async function handleOnEffect(sourceActor, sourceToken, sourceItem) {
    // macro called on the "on" of the source item (Spirit Shield)
    // if rage already present when this item effect is activated,
    // we need to unsuspend the third party reaction effect
    const rageEffect = sourceActor.appliedEffects.find(
      (ae) => ae.name === RAGE_EFFECT_NAME
    );
    if (!rageEffect) {
      // Rage does not seem to be active
      return;
    }

    // The Barbarian is in Rage it can have the Spirit Shield third party reaction effect on
    await activateThirdPartyReactionEffect(
      sourceActor,
      true,
      sourceItem,
      sourceToken,
      rageEffect
    );
  }

  /**
   * Handles DAE 'off' macro call for the Spirit Shield effect.
   * Suspends the third party reaction effect if present.
   *
   * @param {Actor5e} sourceActor - The owner of the item
   * @param {Item5e} sourceItem - The Spirit Shield item.
   */
  async function handleOffEffect(sourceActor, sourceItem) {
    // Suspend third party reaction effect if present
    await activateThirdPartyReactionEffect(sourceActor, false, sourceItem);
  }

  /**
   * Unsuspends the Spirit Shield third party reaction effect for the specified actor to trigger reaction on damage,
   * it also updates the Rage effect to suspend the third party reaction effect when the Rage effect is deleted.
   *
   * @param {Actor5e} sourceActor - The owner of the source item.
   * @param {boolean} activate - Flag to indicate if the third party reaction effect must be activate or deactivated.
   * @param {Item5e} sourceItem - The Spirit Shield item.
   * @param {string} sourceToken - The token of the source actor (only needed for activation).
   * @param {string} rageEffect - The Rage effect (only needed for activation).
   */
  async function activateThirdPartyReactionEffect(
    sourceActor,
    activate,
    sourceItem,
    sourceToken,
    rageEffect
  ) {
    const aePredicate = (ae) =>
      ae.transfer &&
      ae.parent?.uuid === sourceItem.uuid &&
      ae.changes.some(
        (c) =>
          c.key === 'flags.midi-qol.onUseMacroName' &&
          c.value.includes('tpr.isDamaged')
      );

    if (activate) {
      // Find third party reaction effect to enable it
      const tprEffect = [...sourceActor.allApplicableEffects()].find(
        aePredicate
      );
      if (!tprEffect) {
        console.error(
          `${DEFAULT_ITEM_NAME} | Third Party Reaction effect not found.`
        );
        return;
      }
      await tprEffect.update({ disabled: false });

      // Add effect to auto suspend Spirit Shield third party reaction effect when Rage effect expires
      let rageChanges = foundry.utils.deepClone(rageEffect.changes);
      rageChanges.push({
        key: 'flags.dae.suspendActiveEffect',
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: tprEffect.uuid,
        priority: 20,
      });
      rageChanges.push({
        key: `flags.${MODULE_ID}.spiritShield.tokenUuid`,
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: sourceToken.document.uuid,
        priority: 20,
      });
      await sourceActor.updateEmbeddedDocuments('ActiveEffect', [
        { _id: rageEffect.id, changes: rageChanges },
      ]);
    } else {
      // Find third party reaction effect to suspend it
      const tprEffect = sourceActor.appliedEffects.find(aePredicate);
      if (!tprEffect) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | Third Party Reaction effect not active.`
        );
        return;
      }
      await tprEffect.update({ disabled: true });
    }
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Barbarian/relentlessRage.js
// @bakanabaka

async function relentlessRage({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const macroItem = scope.macroItem;

  async function preItemRoll() {
    let persistentData =
      (await DAE.getFlag(actor, persistentDataName)) || defaultPersistentData;
    if (!persistentData.workflowId) {
      ui.notifications.error(
        `${macroItem.name} can only be called from within a workflow.`
      );
      workflow.aborted = true;
      return false;
    }

    let configs = { consumeUsage: false };
    let options = {};
    macroUtil.item.preItemRoll.config(workflow, configs, options);
    // Jank -- use the uses to track the number of times it has occurred
    //    we do this because it automatically will reset on short rest this way
    const updates = { 'system.save.dc': 5 * macroItem.system.uses.value };
    workflow.item = await macroUtil.item.syntheticItem(
      workflow.item,
      actor,
      updates
    );
  }

  async function postSave() {
    let persistentData =
      (await DAE.getFlag(actor, persistentDataName)) || defaultPersistentData;
    persistentData.isActive = workflow.saves.size > 0;
    await DAE.setFlag(actor, persistentDataName, persistentData);
  }

  async function preTargetDamageApplication() {
    if (!actor.effects.find((ef) => ef.name == 'Rage')) return;
    if (workflow.damageItem.oldHP == 0) return;
    if (workflow.damageItem.oldHP != workflow.damageItem.hpDamage) return;
    let persistentData =
      (await DAE.getFlag(actor, persistentDataName)) || defaultPersistentData;
    persistentData.workflowId = workflow.id;
    await DAE.setFlag(actor, persistentDataName, persistentData);
    await MidiQOL.completeItemUse(macroItem, {}, {});
    await macroItem.update({
      'system.uses.value': macroItem.system.uses.value + 1,
    });

    persistentData =
      (await DAE.getFlag(actor, persistentDataName)) || defaultPersistentData;
    persistentData.workflowId = undefined;
    if (persistentData.isActive) workflow.damageItem.hpDamage -= 1;
    await DAE.setFlag(actor, persistentDataName, persistentData);
  }

  const persistentDataName = `(Relentless Rage) - Persistent Data`;
  const defaultPersistentData = { isActive: false, workflowId: undefined };

  const callArguments = {
    speaker: speaker,
    actor: actor,
    token: token,
    character: character,
    item: item,
    args: args,
    scope: scope,
  };
  await macroUtil.runWorkflows(callArguments, {
    preItemRoll: preItemRoll,
    preTargetDamageApplication: preTargetDamageApplication,
    postSave: postSave,
  });
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Barbarian/PathOfTheAncestrialGuardian/vengefulAncestors.js
// ##################################################################################################
// Author: Elwin#1410
// Read First!!!!
// Damages the attacker that triggered Spirit Shield by the amount of damage that was prevented.
// v2.1.0
// Dependencies:
//  - DAE
//  - MidiQOL "on use" actor and item macro [preItemRoll][preDamageRoll]
//  - Elwin Helpers world script
//  Note: A Rage item which adds a Rage effect when activated must be configured, and the Spirit Shield item
//        made by Elwin is needed to trigger this feature.
//
// How to configure:
// The Feature details must be:
//   - Feature Type: Class Feature
//   - Activation cost: Special
//   - Target: 1 Creature
//   - Action Type: Other
//   - Damage formula:
//     @flags.dae.spiritShieldPreventedDmg | Force
//   - Chat Message Flavor: Your Ancestors retaliates!
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before the item is rolled
//       ItemMacro | Before Damage Roll
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - This item macro code must be added to the DIME code of this feature.
//
// Usage:
// This is a special feature that can only be triggered by the Spirit Shield feature.
// When used, it will damage the attacker that triggered the Spirit Shield by the amount of
// damage that was prevented from the target.
//
//
// Description:
// In the preItemRoll phase of Vengeful Ancestors item:
//   Blocks the item use if the barbarian is not raging or if it was not triggered by Spirit Shield.
// In the preDamageRoll phase of Vengeful Ancestors item:
//   Forces the display of targets because it's not displayed by default when there is no attack roll.
// ###################################################################################################

async function vengefulAncestors({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = 'Vengeful Ancestors';
  // Default name of the Rage effect, normally same as the feature
  const RAGE_EFFECT_NAME = 'Rage';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.0'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preItemRoll') {
    const macroData = args[0];
    if (!actor.appliedEffects?.find((ae) => ae.name === RAGE_EFFECT_NAME)) {
      // The Barbarian must be in Rage
      ui.notifications.warn(`${DEFAULT_ITEM_NAME} | Barbarian is not in Rage.`);
      return false;
    }
    if (
      !workflow.options?.spiritShieldVengefulAncestorsTrigger ||
      !(DAE.getFlag(actor, 'spiritShieldPreventedDmg') > 0)
    ) {
      // This feature can only be triggered by Spirit Shield
      ui.notifications.warn(
        `${DEFAULT_ITEM_NAME} | This feature can only be triggered by Spirit Shield.`
      );
      return false;
    }
    if (workflow.targets.size !== 1) {
      if (debug) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | There must be one and only one target.`
        );
      }
      return false;
    }
  } else if (args[0].tag === 'OnUse' && args[0].macroPass === 'preDamageRoll') {
    // Force display of targets because it's not displayed by default when there is no attack roll.
    await workflow.displayTargets(workflow.whisperAttackCard);
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Cleric/GraveDomain/sentinelAtDeathsDoor.js
// ##################################################################################################
// Author: Elwin#1410
// Read First!!!!
// Adds a third party reaction active effect, that effect will trigger a reaction by the Cleric
// when a creature within range is hit by a critical to allow him to convert it to a normal hit.
// v3.1.0
// Dependencies:
//  - DAE
//  - MidiQOL "on use" actor macro [preTargeting],[tpr.isHit]
//  - Elwin Helpers world script
//
// How to configure:
// The Feature details must be:
//   - Feature Type: Class Feature
//   - Activation cost: 1 Reaction
//   - Target: 1 Ally (RAW it's Creature, but use Ally to trigger reaction only on allies)
//   - Range: 30 feet
//   - Limited Uses: 1 of @abilities.wis.mod per Long Rest
//   - Uses Prompt: (checked)
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - No Full cover: (checked)
//   - Activation Conditions
//     - Reaction:
//       reaction === "tpr.isHit" && workflow.isCritical
//   - This item macro code must be added to the DIME code of this feature.
// One effect must also be added:
//   - Sentinel at Death's Door:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,tpr.isHit|canSee=true;post=true
//
// Usage:
// This item has a passive effect that adds a third party reaction effect.
// It is also a reaction item that gets triggered by the third party reaction effect when appropriate.
//
// Description:
// In the preTargeting (item OnUse) phase of the Sentinel at Death's Door item (in owner's workflow):
//   Validates that item was triggered by the remote tpr.isHit target on use,
//   otherwise the item workflow execution is aborted.
// In the tpr.isHit (TargetOnUse) post macro (in attacker's workflow) (on owner or other target):
//   If the reaction was used and completed successfully, the current workflow critical hit is converted to
//   a normal hit.
// ###################################################################################################

async function sentinelAtDeathsDoor({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = "Sentinel at Death's Door";
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  const dependencies = ['dae', 'midi-qol'];
  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.2'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    return handleOnUsePreTargeting(workflow, scope.macroItem);
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isHit.post'
  ) {
    if (!token) {
      // No target
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No target token.`);
      }
      return;
    }
    await handleTargetOnUseIsHitPost(
      workflow,
      token,
      scope.macroItem,
      options?.thirdPartyReactionResult
    );
  }

  /**
   * Handles the preTargeting phase of the Sentinel at Death's Door item.
   * Validates that the reaction was triggered by the tpr.isHit remote reaction.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Sentinel at Death's Door item.
   *
   * @returns {boolean} true if all requirements are fulfilled, false otherwise.
   */
  function handleOnUsePreTargeting(currentWorkflow, sourceItem) {
    if (
      currentWorkflow.options?.thirdPartyReaction?.trigger !== 'tpr.isHit' ||
      !currentWorkflow.options?.thirdPartyReaction?.itemUuids?.includes(
        sourceItem.uuid
      )
    ) {
      // Reaction should only be triggered by third party reaction
      const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature or the owner is hit.`;
      ui.notifications.warn(msg);
      return false;
    }
    return true;
  }

  /**
   * Handles the tpr.isHit post macro of the Sentinel at Death's Door item.
   * If the reaction was used and completed successfully, converts a critical hit on the target into a normal hit.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Token5e} targetToken - The target token that is hit.
   * @param {Item5e} sourceItem - The Sentinel at Death's Door item.
   * @param {object} thirdPartyReactionResult - The third party reaction result.
   */
  async function handleTargetOnUseIsHitPost(
    currentWorkflow,
    targetToken,
    sourceItem,
    thirdPartyReactionResult
  ) {
    if (debug) {
      console.warn(DEFAULT_ITEM_NAME + ' | reaction result', {
        thirdPartyReactionResult,
      });
    }
    if (thirdPartyReactionResult?.uuid === sourceItem.uuid) {
      // Convert critical hits into normal hit
      await elwinHelpers.convertCriticalToNormalHit(currentWorkflow);
    }
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Cleric/LifeDomain/blessedHealer.js
async function blessedHealer({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  try {
    if (args[0].itemData.type !== 'spell') return;
    // no healing done?
    if (!args[0].damageList?.some((li) => li.oldHP < li.newHP)) return;
    // only targets self?

    if (!args[0].hitTargetUuids.some((uuid) => uuid !== args[0].tokenUuid))
      return;
    // await (new Promise(resolve => setTimeout(resolve, 100)))

    const tactor = await fromUuid(args[0].actorUuid);
    const spellLevel = args[0].spellLevel;
    const numHeal = 2 + spellLevel;
    ChatMessage.create({
      content: `${tactor.name} cures ${numHeal} HP of bonus healing`,
    });
    await MidiQOL.applyTokenDamage(
      [{ type: 'healing', damage: numHeal }],
      numHeal,
      new Set([tactor]),
      null,
      new Set(),
      { forceApply: false }
    );
  } catch (err) {
    console.error(`${args[0].itemData.name} - Blessed Healer`, err);
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Druid/spiritTotemBearSpirit.js
async function spiritTotemBearSpirit({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (args[0].macroPass === 'templatePlaced') {
    game.user.updateTokenTargets(
      args[0].targets
        .filter(
          (tok) =>
            tok.disposition ==
            canvas.tokens.get(args[0].tokenId).document.disposition
        )
        .map((i) => i.id)
    );
  }
  if (args[0].macroPass === 'preActiveEffects') {
    return await game.modules
      .get('ActiveAuras')
      .api.AAHelpers.applyTemplate(args);
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Fighter/Cavalier/unwaveringMark.js
// ##################################################################################################
// Read First!!!!
// Marks a target by an "Unwavering Mark", it handles the effect of attacks made by a marked targets
// and the special attack that a marked target can trigger from the marker.
// v2.2.0
// Author: Elwin#1410
// Dependencies:
//  - DAE: [off][each]
//  - Times Up
//  - MidiQOL "on use" item macro, [preTargeting][preAttackRoll][postActiveEffects]
//  - Elwin Helpers world script
//
// How to configure:
// The item details must be:
//   - Feature Type: Class Feature
//   - Activation cost: 1 Bonus Action
//   - Limited Uses: x of @abilities.str.mod per Long Rest
//   - Uses Prompt: (checked)
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - This item macro code must be added to the DIME code of this feature.
// One effect must also be added:
//   - Unwavering Mark:
//      - Effect disabled if actor incapacitated (checked)
//      - Transfer to actor on item equip (checked)
//      - Duration:
//        - Macro Repeat: End of each turn: Run effect macros at the end of the characters turn
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,postActiveEffects
//          - macro.itemMacro | Custom |
//
// Usage:
// This item has a passive effect that marks a target when a melee attack is successful.
// It can also be activated to use the Special Attack if one was triggered by a marked target.
// When activated if a marked target triggered a special attack, an attack with a selected weapon
// is made with an additional damage bonus.
// Note: The mark is not removed if the marker dies or is incapacitated, the mark effect must be deleted manually.
//
// Description:
// In the preTargeting phase of the Unwavering Mark item:
//   Verifies if a marked target triggered a special attack. If not, the item usage is aborted.
// In the postActiveEffects of an item from a marked target:
//   If a target that was not the marker received damage from an attack, it flags the marker that
//   this marked target triggered a special attack.
// In the postActiveEffects phase of an item from the owner of an Unwavering Mark item:
//   It adds an active effect that gives disadvantage on attacks made by the marked target
//   that does not target the marker if he is within 5ft.
// In the postActiveEffects phase of the Unwavering Mark item:
//   If a special attack was triggered by a marked target, makes a meele weapon attack with an additional damage bonus.
//   If more than one melee weapon is equipped, it prompts for which weapon to use.
//   If more than one target triggered a special attack, it prompts for which target to attack.
// When the owner of the Unwavering Mark turn ends [each]:
//   Resets the marked targets and the triggered special attacks flag.
// When the Marked by Unwavering Mark expires [off]:
//   Removes the marked token UUID from the triggered special attacks flags of the marker but only
//   if the expiration was not caused by the addition of a new mark on the same token.
// ###################################################################################################

async function unwaveringMark({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const DEFAULT_ITEM_NAME = 'Unwavering Mark';
  const MODULE_ID = 'midi-item-showcase-community';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis.elwinHelpers?.version ?? '1.1',
      '2.0'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'times-up', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }
  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    if (scope.macroItem.uuid !== scope.rolledItem?.uuid) {
      // Do nothing if item used is not the source item
      return true;
    }

    // Block item usage if no target triggered the special attack
    const specialAttackTargetTokenUuids =
      DAE.getFlag(actor, 'unwaveringMark.specialAttackTargetTokenUuids') ?? [];

    const specialAttackTargetTokens = getTargetTokens(
      specialAttackTargetTokenUuids
    );
    if (specialAttackTargetTokens.length === 0) {
      ui.notifications.warn(
        `${DEFAULT_ITEM_NAME} | No marked target triggered the Special Attack action.`
      );
      return false;
    }

    const filteredWeapons = getEquippedMeleeWeapons(actor);
    if (filteredWeapons.length === 0) {
      const warnMsg = 'No melee weapon equipped.';
      ui.notifications.warn(`${DEFAULT_ITEM_NAME} | No melee weapon equipped.`);
      return false;
    }
    return true;
  } else if (args[0].tag === 'OnUse' && args[0].macroPass === 'preAttackRoll') {
    if (actor.getFlag(MODULE_ID, 'unwaveringMark.markerTokenUuid')) {
      // When the marked target makes an attack
      handlePreAttackRollByMarkedTarget(workflow, scope.macroItem);
    }
  } else if (
    args[0].tag === 'OnUse' &&
    args[0].macroPass === 'postActiveEffects'
  ) {
    const macroData = args[0];

    if (actor.getFlag(MODULE_ID, 'unwaveringMark.markerTokenUuid')) {
      // When the marked target makes an attack
      await handlePostActiveEffectsByMarkedTarget(
        macroData,
        workflow,
        actor,
        scope.macroItem
      );
      return;
    }
    if (scope.rolledItem.uuid !== scope.macroItem.uuid) {
      // Item usage other than the source item
      await handlePostActiveEffectsByMarker(workflow, token, scope.macroItem);
      return;
    }

    // Item usage is special attack
    await handlePostActiveEffectsBySpecialAttack(
      macroData,
      workflow,
      actor,
      scope.rolledItem
    );
  } else if (args[0] === 'each') {
    // Unset flag that allows special attack and current turn marked targets at end of each turn
    await DAE.unsetFlag(actor, 'unwaveringMark');
  } else if (args[0] === 'off') {
    const markerTokenUuid = args[1];
    // Remove this token from special attack flag on marker unless the delete is caused by the same origin
    if (
      scope.lastArgValue['expiry-reason'] &&
      scope.lastArgValue['expiry-reason'] !==
        `new-unwavering-mark:${scope.lastArgValue.origin}`
    ) {
      let specialAttackTargetTokenUuids = DAE.getFlag(
        markerTokenUuid,
        'unwaveringMark.specialAttackTargetTokenUuids'
      );
      if (specialAttackTargetTokenUuids) {
        specialAttackTargetTokenUuids = foundry.utils.deepClone(
          specialAttackTargetTokenUuids
        );
        // Remove token from specialAttackTargets
        const foundIdx = specialAttackTargetTokenUuids.indexOf(
          (tu) => tu === scope.lastArgValue.tokenUuid
        );
        if (foundIdx >= 0) {
          specialAttackTargetTokenUuids.splice(foundIdx, 1);
        }
        if (specialAttackTargetTokenUuids.length > 0) {
          await DAE.setFlag(
            markerTokenUuid,
            'unwaveringMark.specialAttackTargetTokenUuids',
            specialAttackTargetTokenUuids
          );
        } else {
          await DAE.unsetFlag(
            markerTokenUuid,
            'unwaveringMark.specialAttackTargetTokenUuids'
          );
        }
      }
    }
  }

  /**
   * Returns the target tokens associated to the target UUIDs.
   *
   * @param {string[]} targetTokenUuids the UUIDs of target tokens.
   * @returns {Token5e[]} an array of target tokens corresponding to the UUIDs.
   */
  function getTargetTokens(targetTokenUuids) {
    const targetTokens = targetTokenUuids
      .map((uuid) => MidiQOL.MQfromUuid(uuid).object)
      .filter((t) => t);
    return targetTokens;
  }

  /**
   * Returns an array of equipped melee weapons for the specified actor.
   *
   * @param {Actor5e} sourceActor token actor
   * @returns {Item5e[]} array of equipped melee weapons.
   */
  function getEquippedMeleeWeapons(sourceActor) {
    return sourceActor.itemTypes.weapon.filter(
      (w) => w.system.equipped && w.system.actionType === 'mwak'
    );
  }

  /**
   * If the marked target attacks another target than the marker and the marker is
   * within range, the attacker has disadvantage on his attack roll.
   *
   * @param {MidiQOL.Workflow} currentWorkflow midi-qol current workflow.
   * @param {Item5e} sourceItem the Unwavering Mark item.
   */
  function handlePreAttackRollByMarkedTarget(currentWorkflow, sourceItem) {
    const markerTokenUuid = actor.getFlag(
      MODULE_ID,
      'unwaveringMark.markerTokenUuid'
    );
    if (!isPassiveEffectActiveForItem(scope.macroItem)) {
      if (debug) {
        const reason = getActiveEffectInactivityReason(markerTokenUuid);
        console.warn(
          `${DEFAULT_ITEM_NAME} | Mark has no effect when source ActiveEffect is not active, reason: ${reason}.`
        );
      }
      return;
    }

    const markerToken = fromUuidSync(markerTokenUuid)?.object;
    if (!markerToken) {
      if (debug) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | Missing token for marker token UUID ${markerTokenUuid}.`
        );
      }
      return;
    }

    const dist = MidiQOL.computeDistance(
      currentWorkflow.token,
      markerToken,
      true
    );
    if (dist <= -1 || dist > 5) {
      if (debug) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | Marker token out of range: ${dist}.`
        );
      }
      return;
    }
    const nonMarkerTargetExists = currentWorkflow.targets.some(
      (t) => t?.document.uuid !== markerTokenUuid
    );

    if (nonMarkerTargetExists) {
      currentWorkflow.disadvantage = true;
      currentWorkflow.attackAdvAttribution.add(`DIS:${sourceItem.name}`);
      currentWorkflow.advReminderAttackAdvAttribution.add(
        `DIS:${sourceItem.name}`
      );
    }
  }

  /**
   * Verifies if the conditions are met to trigger the special attack from the marker,
   * if its the case a flag is set on the marker.
   *
   * @param {object} macroData midi-qol macro data.
   * @param {MidiQOL.Workflow} currentWorkflow midi-qol current workflow.
   * @param {Actor5e} currentActor current actor.
   * @param {Item5e} sourceItem  the Unwavering Mark item.
   */
  async function handlePostActiveEffectsByMarkedTarget(
    macroData,
    currentWorkflow,
    currentActor,
    sourceItem
  ) {
    if (currentWorkflow.hitTargets.size < 1) {
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No target hit.`);
      }
      return;
    }

    const markerTokenUuid = currentActor.getFlag(
      MODULE_ID,
      'unwaveringMark.markerTokenUuid'
    );
    if (!isPassiveEffectActiveForItem(sourceItem)) {
      if (debug) {
        const reason = getActiveEffectInactivityReason(markerTokenUuid);
        console.warn(
          `${DEFAULT_ITEM_NAME} | Mark has no effect when source ActiveEffect is not active, reason: ${reason}.`
        );
      }
      return;
    }

    if (
      macroData.targetUuids.every(
        (targetUuid) => targetUuid === markerTokenUuid
      )
    ) {
      // Target is the source of the mark, special attack not triggered
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | Target selected is the marker.`);
      }
      return;
    }

    if (!currentWorkflow.attackRoll) {
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | Item does not have an attack.`);
      }
      return;
    }
    if (
      !currentWorkflow.damageList.some(
        (d) => d.totalDamage > 0 && d.tokenUuid !== markerTokenUuid
      )
    ) {
      if (debug) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | No damage dealt to other than marker.`
        );
      }
      return;
    }

    const markerTokenActor = MidiQOL.MQfromActorUuid(markerTokenUuid);

    // Set flag for who was marked that did damage (triggered the special attack)
    const specialAttackTargetTokenUuids = foundry.utils.deepClone(
      DAE.getFlag(
        markerTokenActor,
        'unwaveringMark.specialAttackTargetTokenUuids'
      ) ?? []
    );
    if (!specialAttackTargetTokenUuids.includes(currentWorkflow.tokenUuid)) {
      specialAttackTargetTokenUuids.push(currentWorkflow.tokenUuid);
      await DAE.setFlag(
        markerTokenActor,
        'unwaveringMark.specialAttackTargetTokenUuids',
        specialAttackTargetTokenUuids
      );
    }

    // Add chat message saying bonus attack can be made against this creature
    let player = MidiQOL.playerForActor(markerTokenActor);
    if (!player) {
      console.warn(
        `${DEFAULT_ITEM_NAME} | No active player or GM for actor.`,
        markerTokenActor
      );
      return;
    }
    const markerTokenDoc = fromUuidSync(markerTokenUuid);

    const message = elwinHelpers.getTargetDivs(
      currentWorkflow.token,
      `<p><strong>${sourceItem.name}</strong> - You can make a special bonus attack on your turn against \${tokenName}.</p>`
    );
    /* TODO use this to add link to target??
    <div class="midi-qol-flex-container">
      <div class="midi-qol-target-npc-GM midi-qol-target-name" id="3H6VdifyRZYmmq6e"> 
        <a class="content-link midi-qol" data-uuid="Scene.0iYH9MED4yPi9t9u.Token.3H6VdifyRZYmmq6e.Actor.fftX3BsTT5NdxOLc">Scared Zombie (2)</a>
      </div>
      <div class="midi-qol-target-npc-Player midi-qol-target-name" id="3H6VdifyRZYmmq6e" style=""> Unknown Npc</div>
    </div>
  */
    MidiQOL.addUndoChatMessage(
      await ChatMessage.create({
        user: player?.id,
        type:
          game.release.generation >= 12
            ? CONST.CHAT_MESSAGE_STYLES.OTHER
            : CONST.CHAT_MESSAGE_TYPES.OTHER,
        content: message,
        speaker: ChatMessage.getSpeaker({
          actor: markerTokenActor,
          token: markerTokenDoc,
        }),
        whisper: ChatMessage.getWhisperRecipients('GM').map((u) => u.id),
      })
    );
  }

  /**
   * On a hit with a melee weapon attack, ask if the target needs to be marked and if that's the case,
   * an effect to mark it is added. Note: previous marks are removed.
   *
   * @param {MidiQOL.Workflow} currentWorkflow midi-qol workflow.
   * @param {Token5e} sourceToken source token.
   * @param {Item5e} sourceItem  the Unwavering Mark item.
   */
  async function handlePostActiveEffectsByMarker(
    currentWorkflow,
    sourceToken,
    sourceItem
  ) {
    if (currentWorkflow.hitTargets.size < 1) {
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No target hit.`);
      }
      return;
    }

    const targetToken = currentWorkflow.hitTargets.first();

    if (
      !elwinHelpers.isMeleeWeaponAttack(
        currentWorkflow.item,
        sourceToken,
        targetToken
      )
    ) {
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | Not a melee weapon attack.`);
      }
      return;
    }

    const targetActor = targetToken.actor;
    const targetUuid = targetToken.document.uuid;
    let currentTurnMarkedTargetTokenUuids = foundry.utils.deepClone(
      DAE.getFlag(
        sourceToken,
        'unwaveringMark.currentTurnMarkedTargetTokenUuids'
      ) ?? []
    );
    // Prompt dialog to ask if attacker wants to mark the target, unless this target was already marked this turn
    const foundIdx = currentTurnMarkedTargetTokenUuids.indexOf(
      (tu) => tu === targetUuid
    );
    if (foundIdx >= 0) {
      if (
        targetActor.getFlag(MODULE_ID, 'unwaveringMark.markerTokenUuid') ===
        currentWorkflow.tokenUuid
      ) {
        // Target already marked this turn.
        if (debug) {
          console.warn(
            `${DEFAULT_ITEM_NAME} | Target already marked this turn.`
          );
        }
        return;
      }
      // Remove token from marked targets
      currentTurnMarkedTargetTokenUuids.splice(foundIdx, 1);
    }
    const markTarget = await Dialog.confirm({
      title: `${sourceItem.name} - Mark Target`,
      content: `<p>Mark the current target with ${sourceItem.name}?</p>`,
      rejectClode: false,
      options: { classes: ['dialog', 'dnd5e'] },
    });
    if (!markTarget) {
      return;
    }

    // Keep marked target
    currentTurnMarkedTargetTokenUuids.push(targetUuid);
    await DAE.setFlag(
      sourceToken,
      'unwaveringMark.currentTurnMarkedTargetTokenUuids',
      currentTurnMarkedTargetTokenUuids
    );

    const targetEffectName = `Marked by ${sourceItem.name}`;

    // Remove previous effects
    const targetEffectToDelete = targetActor.effects.getName(targetEffectName);
    if (targetEffectToDelete) {
      await MidiQOL.socket().executeAsGM('removeEffect', {
        effectUuid: targetEffectToDelete.uuid,
        options: { 'expiry-reason': `new-unwavering-mark:${sourceItem.uuid}` },
      });
    }
    // create an active effect to set advantage on attack rolls on target only
    const imgPropName = game.release.generation >= 12 ? 'img' : 'icon';
    const targetEffectData = {
      changes: [
        // flag to indicate marker
        {
          key: `flags.${MODULE_ID}.unwaveringMark.markerTokenUuid`,
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: currentWorkflow.tokenUuid,
          priority: 20,
        },
        // macro to handle disadvantage on attacks other than marker
        {
          key: 'flags.midi-qol.onUseMacroName',
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: `ItemMacro,preAttackRoll`,
          priority: 20,
        },
        // macro to handle damage dealt to other targets than marker
        {
          key: 'flags.midi-qol.onUseMacroName',
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: `ItemMacro,postActiveEffects`,
          priority: 20,
        },
        // macro for on/off of effect
        {
          key: 'macro.itemMacro',
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: `${currentWorkflow.tokenUuid}`,
          priority: 20,
        },
      ],
      origin: sourceItem.uuid, //flag the effect as associated to the source item
      disabled: false,
      [imgPropName]: sourceItem.img,
      name: targetEffectName,
    };
    targetEffectData.duration = currentWorkflow.inCombat
      ? { rounds: 1, turns: 1 }
      : { seconds: CONFIG.time.roundTime + 1 };

    foundry.utils.setProperty(targetEffectData, 'flags.dae.specialDuration', [
      'turnEndSource',
    ]);
    foundry.utils.setProperty(
      targetEffectData,
      'flags.dae.stackable',
      'noneNameOnly'
    );

    await MidiQOL.socket().executeAsGM('createEffects', {
      actorUuid: targetActor.uuid,
      effects: [targetEffectData],
    });
  }

  /**
   * Makes a special attack on a marked target that triggered it.
   * The attacker must choose a weapon with which to attack and is more than one target triggered
   * a special attack, choose a target.
   *
   * @param {object} macroData midi-qol macro data.
   * @param {MidiQOL.Workflow} currentWorkflow midi-qol workflow.
   * @param {Actor5e} sourceActor The source actor.
   * @param {Item5e} sourceItem The Unwavering Mark item.
   */
  async function handlePostActiveEffectsBySpecialAttack(
    macroData,
    currentWorkflow,
    sourceActor,
    sourceItem
  ) {
    const specialAttackTargetTokenUuids =
      DAE.getFlag(
        sourceActor,
        'unwaveringMark.specialAttackTargetTokenUuids'
      ) ?? [];
    const specialAttackTargetTokens = getTargetTokens(
      specialAttackTargetTokenUuids
    );
    if (specialAttackTargetTokens.length === 0) {
      // Should not happen, this should be checked on the preTargeting phase
      return;
    }

    const filteredWeapons = getEquippedMeleeWeapons(sourceActor);
    if (filteredWeapons.length === 0) {
      // Should not happen, this should be checked on the preTargeting phase
      return;
    }

    const chosenWeaponId = sourceActor.getFlag(
      MODULE_ID,
      'unwaveringMark.weaponChoiceId'
    );
    let weaponItem = filteredWeapons[0];
    if (filteredWeapons.length > 1) {
      weaponItem = await getSelectedWeapon(
        sourceItem,
        filteredWeapons,
        chosenWeaponId
      );
    }
    if (!weaponItem) {
      // Special attack was cancelled
      console.warn(
        `${DEFAULT_ITEM_NAME} | Special attack was cancelled, reallocate spent resource if needed.`
      );
      return;
    }
    // Keep weapon choice for next time (used as pre-selected choice)
    await sourceActor.setFlag(
      MODULE_ID,
      'unwaveringMark.weaponChoiceId',
      weaponItem.id
    );

    // Select from special attack target tokens
    const currentTarget = currentWorkflow.targets.first();
    let selectedTarget =
      (currentTarget
        ? specialAttackTargetTokens.find(
            (t) => t.document.uuid === currentTarget.document.uuid
          )
        : undefined) ?? specialAttackTargetTokens[0];
    if (specialAttackTargetTokens.length > 1) {
      selectedTarget = await getSelectedTarget(
        sourceItem,
        specialAttackTargetTokens,
        selectedTarget
      );
    }
    if (!selectedTarget) {
      // Special attack was cancelled
      console.warn(
        `${DEFAULT_ITEM_NAME} | Special attack was cancelled, reallocate spent resource if needed.`
      );
      return;
    }

    const weaponCopy = weaponItem.toObject();
    delete weaponCopy._id;
    // Change activation type to special so it is not considered as an Attack Action
    weaponCopy.system.activation = foundry.utils.deepClone(
      weaponCopy.system.activation ?? {}
    );
    weaponCopy.system.activation.type = 'special';
    weaponCopy.system.activation.cost = null;

    // Add bonus to the weapon damage and to versatile one if the weapon supports it
    const dmgBonus = Math.floor(
      (macroData.rollData.classes?.fighter?.levels ?? 1) / 2
    );
    weaponCopy.system.damage.parts[0][0] += ` + ${dmgBonus}`;
    if (
      weaponCopy.isVersatile &&
      elwinHelpers.hasItemProperty(weaponCopy, 'ver')
    ) {
      weaponCopy.system.damage.versatile += ` + ${dmgBonus}`;
    }

    weaponCopy.name = `${weaponItem.name} [${sourceItem.name}]`;
    const attackItem = new CONFIG.Item.documentClass(weaponCopy, {
      parent: sourceActor,
      temporary: true,
    });
    const options = {
      targetUuids: [selectedTarget.document.uuid],
      showFullCard: false,
      createWorkflow: true,
      configureDialog: true,
      advantage: true,
      workflowOptions: {
        autoRollAttack: true,
        advantage: true,
        targetConfirmation: 'none',
      },
    };
    const result = await MidiQOL.completeItemUse(attackItem, {}, options);
    if (!result || result.aborted) {
      // Special attack was cancelled
      console.warn(
        `${DEFAULT_ITEM_NAME} | Special attack was cancelled, reallocate spent resource if needed.`
      );
      return;
    }

    // Unset flag that allows special attack
    await DAE.unsetFlag(
      sourceActor,
      'unwaveringMark.specialAttackTargetTokenUuids'
    );
  }

  /**
   * Prompts a dialog to select a weapon and returns the id of the selected weapon.
   *
   * @param {Item5e} sourceItem item for which the dialog is prompted.
   * @param {Item5e[]} weaponChoices array of weapon items from which to choose.
   * @param {string} defaultChosenWeaponId id of weapon to be selected by default.
   *
   * @returns {Promise<Item5e|null>} selected weapon.
   */
  async function getSelectedWeapon(
    sourceItem,
    weaponChoices,
    defaultChosenWeaponId
  ) {
    const defaultWeapon = weaponChoices.find(
      (i) => i.id === defaultChosenWeaponId
    );
    return elwinHelpers.ItemSelectionDialog.createDialog(
      `⚔️ ${sourceItem.name}: Choose a Weapon`,
      weaponChoices,
      defaultWeapon
    );
  }

  /**
   * Prompts a dialog to select a target token and returns it.
   *
   * @param {Item5e} sourceItem item for which the dialog is prompted.
   * @param {Token5e[]} targetTokens list of tokens from which to select a target.
   * @param {Token5e} defaultToken token to be selected by default.
   *
   * @returns {Promise<Token5e|null>} the selected target token.
   */
  async function getSelectedTarget(sourceItem, targetTokens, defaultToken) {
    return await elwinHelpers.TokenSelectionDialog.createDialog(
      `${sourceItem.name}: Choose a Target`,
      targetTokens,
      defaultToken
    );
  }

  /**
   * Verifies if the passive active effect associated to this item is active.
   *
   * @param {Item5e} sourceItem item for which the dialog is prompted.
   * @returns {boolean} true if the passive active effect associated to this item is active, false otherwise.
   */
  function isPassiveEffectActiveForItem(sourceItem) {
    let aePredicate = undefined;
    if (CONFIG.ActiveEffect.legacyTransferral) {
      aePredicate = (ae) =>
        ae.flags?.dae?.transfer && ae.origin === sourceItem.uuid;
    } else {
      aePredicate = (ae) => ae.transfer && ae.parent?.uuid === sourceItem.uuid;
    }
    return sourceItem?.actor?.appliedEffects.find(aePredicate) !== undefined;
  }

  /**
   * Returns the reason for which an active effect was inactivated.
   *
   * @param {string|Token5e} tokenRef UUID of the token or token for which an active effect was inactivated.
   * @returns {string} the reason why the active effect was inactivated.
   */
  function getActiveEffectInactivityReason(tokenRef) {
    const incapacitatedCond = MidiQOL.checkIncapacitated(tokenRef, false);
    return (
      CONFIG.statusEffects.find((a) => a.id === incapacitatedCond)?.name ??
      '???'
    );
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Fighter/PsiWarrior/psionicPowerProtectiveField.js
// ##################################################################################################
// Author: Elwin#1410
// Read First!!!!
// Adds a third party reaction effect, that effect will trigger a reaction by the Fighter
// when the fighter or a creature he can see within range is damaged to allow him to use the feature
// to reduce the target's damage instead.
// v3.2.0
// Dependencies:
//  - DAE
//  - MidiQOL "on use" actor and item macro [preTargeting],[postActiveEffects],[tpr.isDamaged]
//  - Elwin Helpers world script
//
// How to configure:
// The Feature details must be:
//   - Feature Type: Class Feature
//   - Class Feature Type: Psionic Power
//   - Activation cost: 1 Reaction
//   - Target: 1 Ally (RAW it's Creature, but use Ally to trigger reaction on allies only)
//   - Range: 30 feet
//   - Resource Consumption: 1 | Psionic Power | Item Uses (to be set when added to an actor)
//   - Action Type: Other
//   - Damage formula:
//     max(@scale.psi-warrior.psionic-power +@abilities.int.mod, 1) | No Damage
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved
//       ItemMacro | After Active Effects
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - No Full cover: (checked)
//   - Activation Conditions
//     - Reaction:
//       reaction === "tpr.isDamaged"
//   - This item macro code must be added to the DIME code of this feature.
// One effect must also be added:
//   - Psionic Power: Protective Field:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,tpr.isDamaged|canSee=true;pre=true;post=true
//
//  Note: A scale dice value must be configured on the 'Psi Warrior' subclass,
//        its data value should resolve to '@scale.psi-warrior.psionic-power'.
//
// Usage:
// This item has a passive effect that adds a third party reaction effect.
// It is also a reaction item that gets triggered by the third party reaction effect when appropriate.
//
// Description:
// There are multiple calls of this item macro, dependending on the trigger.
// In the preTargeting (item OnUse) phase of the item (in owner's workflow):
//   Validates that item was triggered by the remote tpr.isDamaged target on use,
//   otherwise the item workflow execution is aborted.
// In the postActiveEffects (item onUse) phase of the item (in owner's workflow):
//   A damage reduction flag is set on the item's owner to be used by the post macro of the tpr.isDamaged reaction.
// In the tpr.isDamaged (TargetOnUse) pre macro (in attacker's workflow) (on other target):
//   Unsets the previous damage reduction flag on the item's owner.
// In the tpr.isDamaged (TargetOnUse) post macro (in attacker's workflow) (on other target):
//   If the reaction was used and completed successfully, the target's damage is reduced by the amount
//   specified in the flag set by the executed reaction on the item's owner.
// ###################################################################################################

async function psionicPowerProtectiveField({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = 'Psionic Power: Protective Field';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.6'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }
  if (
    !foundry.utils.isNewerVersion(
      game.modules.get('midi-qol')?.version,
      '11.6'
    ) &&
    !MidiQOL.configSettings().v3DamageApplication
  ) {
    ui.notifications.error(
      `${DEFAULT_ITEM_NAME} | dnd5e v3 damage application is required.`
    );
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    // MidiQOL OnUse item macro for Psionic Power: Protective Field
    return handleOnUsePreTargeting(workflow, scope.macroItem);
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isDamaged.pre'
  ) {
    // MidiQOL TargetOnUse pre macro for Psionic Power: Protective Field pre reaction in the triggering midi-qol workflow

    // Remove previous damage prevention value
    await DAE.unsetFlag(scope.macroItem.actor, 'protectiveFieldPreventedDmg');
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isDamaged.post'
  ) {
    // MidiQOL TargetOnUse post macro for Psionic Power: Protective Field post reaction
    handleIsDamagedPost(
      workflow,
      scope.macroItem,
      options?.thirdPartyReactionResult
    );
  } else if (
    args[0].tag === 'OnUse' &&
    args[0].macroPass === 'postActiveEffects'
  ) {
    // MidiQOL OnUse item macro for Psionic Power: Protective Field
    await handleOnUsePostActiveEffects(workflow, actor);
  }

  /**
   * Handles the preTargeting phase of the Psionic Power: Protective Field item.
   * Validates that the reaction was triggered by the tpr.isDamaged phase.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Psionic Power: Protective Field item.
   *
   * @returns {boolean} true if all requirements are fulfilled, false otherwise.
   */
  function handleOnUsePreTargeting(currentWorkflow, sourceItem) {
    if (
      currentWorkflow.options?.thirdPartyReaction?.trigger !==
        'tpr.isDamaged' ||
      !currentWorkflow.options?.thirdPartyReaction?.itemUuids?.includes(
        sourceItem.uuid
      )
    ) {
      // Reaction should only be triggered by third party reaction
      const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature of the Fighter is damaged.`;
      ui.notifications.warn(msg);
      return false;
    }

    foundry.utils.setProperty(
      currentWorkflow,
      'options.workflowOptions.fastForwardDamage',
      true
    );
    return true;
  }

  /**
   * Handles the tpr.isDamaged post reaction execution of the Psionic Power: Protective Field item in the triggering midi-qol workflow.
   * If the reaction was used and completed successfully, reduces the damage aplied to the target by the rolled amount of the reaction.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Psionic Power: Protective Field item.
   * @param {object} thirdPartyReactionResult - The third party reaction result.
   */
  function handleIsDamagedPost(
    currentWorkflow,
    sourceItem,
    thirdPartyReactionResult
  ) {
    const sourceActor = sourceItem.actor;
    if (
      thirdPartyReactionResult?.uuid === sourceItem.uuid &&
      currentWorkflow.damageItem &&
      DAE.getFlag(sourceActor, 'protectiveFieldPreventedDmg') > 0
    ) {
      const preventedDmg = DAE.getFlag(
        sourceActor,
        'protectiveFieldPreventedDmg'
      );
      elwinHelpers.reduceAppliedDamage(
        currentWorkflow.damageItem,
        preventedDmg,
        sourceItem
      );
    }
    if (debug) {
      console.warn(`${DEFAULT_ITEM_NAME} | Reaction result`, {
        result: thirdPartyReactionResult,
        damageItem: currentWorkflow.damageItem,
        preventedDmg: DAE.getFlag(sourceActor, 'protectiveFieldPreventedDmg'),
      });
    }
  }

  /**
   * Handles the postActiveEffects of the Psionic Power: Protective Field item midi-qol workflow.
   * The owner of the feature HP's are reduced by the damage to be applied to the target.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Actor5e} sourceActor - The owner of the Psionic Power: Protective Field item.
   */
  async function handleOnUsePostActiveEffects(currentWorkflow, sourceActor) {
    const targetToken = currentWorkflow.targets.first();
    if (!targetToken) {
      // No target found
      return;
    }
    const targetActor = targetToken.actor;
    if (!targetActor) {
      // No actor found
      return;
    }
    const total = currentWorkflow.damageRolls?.[0]?.total ?? 0;
    await DAE.setFlag(sourceActor, 'protectiveFieldPreventedDmg', total);

    const infoMsg = `<p>You prevent <strong>${total}</strong> points of damage to <strong>\${tokenName}</strong>.</p>`;
    await elwinHelpers.insertTextIntoMidiItemCard(
      'beforeButtons',
      workflow,
      elwinHelpers.getTargetDivs(targetToken, infoMsg)
    );
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/FightingStyle/greatWeaponFighting.js
async function greatWeaponFighting({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (
    args[0].macroPass === 'preDamageRoll' &&
    scope.rolledItem.type == 'weapon' &&
    scope.rolledItem.system.type.value.match(/^(simpleM|martialM)$/)
  ) {
    if (scope.rolledItem.system.properties.has('two')) {
      let parts = [];
      scope.rolledItem.system.damage.parts.forEach((part) =>
        parts.push([replace(part[0]), part[1]])
      );
      workflow.item = workflow.item.clone(
        { 'system.damage.parts': parts },
        { keepId: true }
      );
    }
    if (scope.rolledItem.system.properties.has('ver')) {
      workflow.item = workflow.item.clone(
        {
          'system.damage.versatile': replace(
            workflow.item.system.damage.versatile
          ),
        },
        { keepId: true }
      );
    }
  }

  function replace(part) {
    var i = 0;
    var j = 0;
    var modifiedPart = foundry.utils.deepClone(part);
    while (i >= 0) {
      let regex = /([0-9]d[0-9])/;
      i = search(modifiedPart, regex, i);
      regex = /([0-9]([^0-9d]|$))/;
      i = search(modifiedPart, regex, i);
      if (i >= 0) {
        modifiedPart =
          modifiedPart.slice(0, i + 1) + 'r<=2' + modifiedPart.slice(i + 1);
        i += 4;
      }
      j += 1;
      if (j > 20) break; //max 20 modifications
    }
    return modifiedPart;
  }

  function search(string, regexp, from) {
    const index = string.slice(from).search(regexp);
    return index === -1 ? -1 : index + from;
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Paladin/OathOfTheCrown/channelDivinityTurnTheTide.js
async function channelDivinityTurnTheTide({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (args[0].macroPass === 'preambleComplete') {
    if (workflow.targets.size === 0) return;
    let validTargets = [];
    for (let i of Array.from(workflow.targets)) {
      if (
        i.actor.system.attributes.hp.value >
        i.actor.system.attributes.hp.max / 2
      )
        continue;
      validTargets.push(i.id);
    }
    chrisPremades.helpers.updateTargets(validTargets);
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Paladin/OathOfTheCrown/divineAllegiance.js
// ##################################################################################################
// Author: Elwin#1410
// Read First!!!!
// Adds an active effect, that effect will trigger a reaction by the Paladin
// when a creature within range is damaged to allow him to use the feature to take the target's damage instead.
// v3.1.0
// Dependencies:
//  - DAE
//  - MidiQOL "on use" actor and item macro [preTargeting],[postActiveEffects],[tpr.isDamaged]
//  - Elwin Helpers world script
//
// How to configure:
// The Feature details must be:
//   - Feature Type: Class Feature
//   - Activation cost: 1 Reaction
//   - Target: 1 Ally (RAW it's Creature, but use Ally to trigger reaction on allies only)
//   - Range: 5 Feet
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved
//       ItemMacro | After Active Effects
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - Activation Conditions
//     - Reaction:
//       reaction === "tpr.isDamaged"
//   - This item macro code must be added to the DIME code of this feature.
// One effect must also be added:
//   - Divine Allegiance:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,tpr.isDamaged|ignoreSelf=true;pre=true;post=true
//
// Usage:
// This item has a passive effect that adds a third party reaction effect.
// It is also a reaction item that gets triggered by the third party reaction effect when appropriate.
//
// Description:
// There are multiple calls of this item macro, dependending on the trigger.
// In the preTargeting (item OnUse) phase of the item (in owner's workflow):
//   Validates that item was triggered by the remote tpr.isDamaged target on use,
//   otherwise the item workflow execution is aborted.
// In the postActiveEffects (item onUse) phase of the item (in owner's workflow):
//   The total damage to be taken for the target specified in a flag is applied to the owner's hp
//   and the flag is unset.
// In the tpr.isDamaged (TargetOnUse) pre macro (in attacker's workflow) (on other target):
//   Sets a flag on the feature's actor with the total damage to be applied to the target.
// In the tpr.isDamaged (TargetOnUse) post macro (in attacker's workflow) (on other target):
//   If the reaction was used and completed successfully, the target's damage is reduced to zero.
// ###################################################################################################

async function divineAllegiance({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = 'Divine Allegiance';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.6'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }
  if (
    !foundry.utils.isNewerVersion(
      game.modules.get('midi-qol')?.version,
      '11.6'
    ) &&
    !MidiQOL.configSettings().v3DamageApplication
  ) {
    ui.notifications.error(
      `${DEFAULT_ITEM_NAME} | dnd5e v3 damage application is required.`
    );
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    // MidiQOL OnUse item macro for Divine Allegiance
    return handleOnUsePreTargeting(workflow, scope.macroItem);
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isDamaged.pre'
  ) {
    // MidiQOL TargetOnUse pre macro for Divine Allegiance pre reaction
    return await handleTargetOnUseIsDamagedPre(workflow, scope.macroItem);
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isDamaged.post'
  ) {
    // MidiQOL TargetOnUse post item macro for Divine Allegiance post reaction
    handleTargetOnUseIsDamagedPost(
      workflow,
      scope.macroItem,
      options?.thirdPartyReactionResult
    );
  } else if (
    args[0].tag === 'OnUse' &&
    args[0].macroPass === 'postActiveEffects'
  ) {
    // MidiQOL OnUse item macro for Divine Allegiance
    await handleOnUsePostActiveEffects(workflow, actor);
  }

  /**
   * Handles the preTargeting phase of the Divine Allegiance item.
   * Validates that the reaction was triggered by the tpr.isDamaged target on use.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Divine Allegiance item.
   *
   * @returns {boolean} true if all requirements are fulfilled, false otherwise.
   */
  function handleOnUsePreTargeting(currentWorkflow, sourceItem) {
    if (
      currentWorkflow.options?.thirdPartyReaction?.trigger !==
        'tpr.isDamaged' ||
      !currentWorkflow.options?.thirdPartyReaction?.itemUuids?.includes(
        sourceItem.uuid
      )
    ) {
      // Reaction should only be triggered by aura
      const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature of the Paladin is damaged.`;
      ui.notifications.warn(msg);
      return false;
    }
    return true;
  }

  /**
   * Handles the tpr.isDamaged pre macro of the Divine Allegiance item in the triggering midi-qol workflow.
   * Sets a flag on the owner with the damage to be taken, will be used by the reaction.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Divine Allegiance item.
   *
   * @returns {object} undefined when all conditions are met, an object with skip attribute to true if the reaction must be skipped.
   */
  async function handleTargetOnUseIsDamagedPre(currentWorkflow, sourceItem) {
    const sourceActor = sourceItem.actor;

    if (!sourceActor) {
      console.error(`${DEFAULT_ITEM_NAME} | Missing sourceActor`, sourceItem);
      return { skip: true };
    }
    // Set damage to be applied, to be available for remote reaction
    const totalDamage = currentWorkflow.damageItem.damageDetail.reduce(
      (acc, d) =>
        acc +
        (['temphp', 'midi-none'].includes(d.type) ? 0 : d.value ?? d.damage),
      0
    );
    const preventedDmg = totalDamage;
    currentWorkflow.divineAllegianceAppliedDmg = preventedDmg;
    await DAE.setFlag(sourceActor, 'divineAllegianceAppliedDmg', preventedDmg);
  }

  /**
   * Handles the tpr.isDamaged post macro of the Divine Allegiance item.
   * If the reaction was used and completed successfully, reduces the item's owner hp by the amount of damage that the target would have taken.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Divine Allegiance item.
   * @param {object} thirdPartyReactionResult - The third party reaction result.
   */
  function handleTargetOnUseIsDamagedPost(
    currentWorkflow,
    sourceItem,
    thirdPartyReactionResult
  ) {
    const preventedDmg = currentWorkflow.divineAllegianceAppliedDmg;
    if (thirdPartyReactionResult?.uuid === sourceItem.uuid && preventedDmg) {
      elwinHelpers.reduceAppliedDamage(
        currentWorkflow.damageItem,
        preventedDmg,
        sourceItem
      );
    }
    if (debug) {
      console.warn(`${DEFAULT_ITEM_NAME} | Reaction result`, {
        result: thirdPartyReactionResult,
        damageItem: currentWorkflow.damageItem,
        preventedDmg,
      });
    }
  }

  /**
   * Handles the postActiveEffects phase of the Divine Allegiance item.
   * The owner of the feature HP's are reduced by the damage to be applied to the target.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Actor5e} sourceActor - The owner of the Divine Allegiance item.
   */
  async function handleOnUsePostActiveEffects(currentWorkflow, sourceActor) {
    const targetToken = currentWorkflow.targets.first();
    if (!targetToken) {
      // No target found
      return;
    }
    const targetActor = targetToken.actor;
    if (!targetActor) {
      // No actor found
      return;
    }
    const appliedDmg = DAE.getFlag(sourceActor, 'divineAllegianceAppliedDmg');
    await sourceActor.applyDamage(appliedDmg);
    await DAE.unsetFlag(sourceActor, 'divineAllegianceAppliedDmg');

    const infoMsg = `<p>You take <strong>${appliedDmg}</strong> points of damage instead to <strong>\${tokenName}</strong>.</p>`;
    await elwinHelpers.insertTextIntoMidiItemCard(
      'beforeButtons',
      workflow,
      elwinHelpers.getTargetDivs(targetToken, infoMsg)
    );
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Rogue/steadyAim.js
// ##################################################################################################
// Read First!!!!
// Verifies that the token has not moved yet and modifies its ability to move if drag-ruler and/or
// monks-tokenbar are active.
// v2.3.0
// Author: Elwin#1410
// Dependencies:
//  - DAE: [on], [off] item macro
//  - Times Up
//  - MidiQOL "on use" macro [preItemRoll]
//  - Drag Ruler (optional)
//  - Elevation Ruler (optional)
//  - Monk's TokenBar (optional)
//
// How to configure:
// The Item details must be:
//   - Feature Type: Class Feature
//   - Activation cost: 1 Bonus Action
//   - Target: Self
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before the item is rolled
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - This item macro code must be added to the DIME code of this feature.
// Two effects must also be added:
//   - Steady Aim - Advantage:
//      - Transfer Effect to Actor on ItemEquip (unchecked)
//      - Duration: 1 Turn
//      - Special Duration: 1 Attack
//      - Effects:
//        - flags.midi-qol.advantage.attack.all | Custom | 1
//   - Steady Aim - Movement:
//      - Transfer Effect to Actor on ItemEquip (unchecked)
//      - Duration: 1 Turn
//      - Effects:
//        - system.attributes.movement.all | Custom | 0
//        - macro.itemMacro.GM | Custom |
//
// Usage:
// This item needs to be used to activate. When activated the effects are applied.
//
// Description:
// In the preItemRoll phase:
//   This macro checks if the token as already moved during its turn using "Drag Ruler" or
//   "Elevation Ruler" if active.
//   If the token has moved, it prevents the item to be used.
// In the "on" DAE macro call:
//   If "Monk's TokenBar" is active, preserve current token movement status in a flag and change
//   token movement to none.
// In the "off" DAE macro call:
//   If "Monk's TokenBar" is active, change token movement to the mode preserved in the flag.
// ###################################################################################################

// Validate requirements

async function steadyAim({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const DEFAULT_ITEM_NAME = 'Steady Aim';
  const dependencies = ['dae', 'times-up', 'midi-qol'];
  if (!requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  /**
   * If the requirements are met, returns true, false otherwise.
   *
   * @param {string} name - The name of the item for which to check the dependencies.
   * @param {string[]} dependencies - The array of module ids which are required.
   *
   * @returns {boolean} true if the requirements are met, false otherwise.
   */
  function requirementsSatisfied(name, dependencies) {
    let missingDep = false;
    dependencies.forEach((dep) => {
      if (!game.modules.get(dep)?.active) {
        const errorMsg = `${name} | ${dep} must be installed and active.`;
        ui.notifications.error(errorMsg);
        console.warn(errorMsg);
        missingDep = true;
      }
    });
    return !missingDep;
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preItemRoll') {
    // Midi-QOL OnUse Item Macro call
    if (
      game.modules.get('drag-ruler')?.active &&
      dragRuler.getMovedDistanceFromToken(token) > 0
    ) {
      // only allowed if user has not moved yet, can only be validated with drag-ruler and in combat
      ui.notifications.error(
        `Trying to activate ${item.name} when token has already moved.`
      );
      return false;
    }
    if (
      game.modules.get('elevationruler')?.active &&
      token.lastMoveDistance > 0
    ) {
      // only allowed if user has not moved yet, can only be validated with drag-ruler and in combat
      ui.notifications.error(
        `Trying to activate ${item.name} when token has already moved.`
      );
      return false;
    }
  } else if (args[0] === 'on') {
    // DAE Item Macro GM call
    if (game.modules.get('monks-tokenbar')?.active) {
      const defaultMovement = game.settings.get('monks-tokenbar', 'movement');
      const currentMovement =
        token.document.getFlag('monks-tokenbar', 'movement') || defaultMovement;
      await DAE.setFlag(scope.lastArgValue.actorUuid, 'steady-aim', {
        previousDefaultMovement: defaultMovement,
        previousMovement: currentMovement,
      });
      game.MonksTokenBar.changeMovement('none', [scope.lastArgValue.tokenId]);
    }
  } else if (args[0] === 'off') {
    // DAE Item Macro GM call
    if (game.modules.get('monks-tokenbar')?.active) {
      const defaultMovement = game.settings.get('monks-tokenbar', 'movement');
      const steadyAimData = DAE.getFlag(
        scope.lastArgValue.actorUuid,
        'steady-aim'
      );
      if (steadyAimData.previousDefaultMovement !== defaultMovement) {
        steadyAimData.previousMovement = defaultMovement;
      }
      game.MonksTokenBar.changeMovement(steadyAimData.previousMovement, [
        scope.lastArgValue.tokenId,
      ]);
      await DAE.unsetFlag(scope.lastArgValue.actorUuid, 'steady-aim');
    }
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Warlock/tombOfLevistus.js
async function tombOfLevistus({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (
    args[0].macroPass === 'preTargetDamageApplication' &&
    !actor.system.traits.dv.value.has('fire')
  )
    await actor.update({
      'flags.midi-item-showcase-community': {
        tol: Array.from(actor.system.traits.dv.value),
      },
      'system.traits.dv.value': Array.from(
        actor.system.traits.dv.value.add('fire')
      ),
    });

  if (args[0] === 'off') {
    const updates = { 'system.attributes.hp.temp': null };
    if (actor.flags['midi-item-showcase-community']?.tol) {
      updates['system.traits.dv.value'] =
        actor.flags['midi-item-showcase-community'].tol;
      updates['flags.midi-item-showcase-community.-=tol'] = null;
    }
    await actor.update(updates);
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Monk/WayOfTheAstralSelf/armsOfTheAstralSelf.js
async function armsOfTheAstralSelf({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  let attAbility;
  if (
    actor.system.abilities.dex.mod >= actor.system.abilities.str.mod &&
    actor.system.abilities.wis.mod
  ) {
    attAbility = 'dex';
  } else if (
    actor.system.abilities.wis.mod >= actor.system.abilities.str.mod &&
    actor.system.abilities.dex.mod
  ) {
    attAbility = 'wis';
  } else if (
    actor.system.abilities.str.mod >= actor.system.abilities.dex.mod &&
    actor.system.abilities.wis.mod
  ) {
    attAbility = 'str';
  }

  const weaponData = {
    name: 'Spectral Arms',
    type: 'weapon',
    img: 'icons/magic/unholy/strike-hand-glow-pink.webp',
    system: {
      quantity: 1,
      activation: { type: 'action', cost: 1, condition: '' },
      target: { value: 1, type: 'creature' },
      range: { value: 10, long: null, units: 'ft' },
      ability: attAbility,
      actionType: 'mwak',
      attackBonus: '',
      chatFlavor: '',
      critical: null,
      damage: {
        parts: [['@scale.monk.martial-arts[force] + @mod', 'force']],
        versatile: '',
      },
      type: {
        value: 'simpleM',
      },
      proficient: true,
      equipped: true,
      description: 'Punch long, punch good',
    },
    flags: {},
  };

  await actor.createEmbeddedDocuments('Item', [weaponData]);
  ui.notifications.notify('Spectral Arms added to item inventory');
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Cleric/LightDomain/wardingFlare.js
// ##################################################################################################
// Author: Elwin#1410
// Read First!!!!
// Adds a third party reaction active effect, that effect will trigger a reaction by the Cleric
// when a creature within range attacks to allow him to add disadvantage on the attack to hit.
// v2.1.0
// Dependencies:
//  - DAE
//  - MidiQOL "on use" actor macro [preTargeting][tpr.isPreAttacked]
//  - Elwin Helpers world script
//
// How to configure:
// The Feature details must be:
//   - Activation cost: 1 Reaction
//   - Target: 1 Enemy (RAW it's Creature, but use Enemy to trigger reaction only on enemies)
//   - Action Type: (empty)
//   - Range: 30 feet
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved
//   - No Full cover: (checked)
//   - Activation Conditions
//     - Reaction:
//       reaction === "tpr.isPreAttacked" && (targetUuid === tpr?.tokenUuid || ((tpr?.actor?.classes?.cleric?.levels ?? 0) >= 6) && fromUuidSync(targetUuid)?.disposition === fromUuidSync(tpr?.tokenUuid)?.disposition)
//   - This item macro code must be added to the DIME code of the item.
// One effect must also be added:
//   - Warding Flare:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,tpr.isPreAttacked|triggerSource=attacker;canSee=true;post=true
//
// Usage:
// This item has a passive effect that adds a third party reaction effect.
// It is also a reaction item that gets triggered by the third party reaction effect when appropriate.
//
// Description:
// In the preTargeting (item OnUse) phase of the Warding Flare item (in owner's workflow):
//   Validates that item was triggered by the remote tpr.isPreAttacked target on use,
//   otherwise the item workflow execution is aborted.
// In the tpr.isPreAttacked (TargetOnUse) post macro (in attacker's workflow) (on owner or other target):
//   If the reaction was used and completed successfully, the current workflow is set to roll the attack with
//   disadvantage.
// ###################################################################################################

async function wardingFlare({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = 'Warding Flare';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.2'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    return handleOnUsePreTargeting(workflow, scope.macroItem);
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isPreAttacked.post'
  ) {
    handleTargetOnUseIsPreAttackedPost(
      workflow,
      scope.macroItem,
      options?.thirdPartyReactionResult
    );
  }

  /**
   * Handles the preTargeting phase of the Warding Flare item midi-qol workflow.
   * Validates that the reaction was triggered by the isHit phase.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - midi-qol current workflow.
   * @param {Item5E} sourceItem - The Warding Flare item.
   *
   * @returns {boolean} true if all requirements are fulfilled, false otherwise.
   */
  function handleOnUsePreTargeting(currentWorkflow, sourceItem) {
    if (
      currentWorkflow.options?.thirdPartyReaction?.trigger !==
        'tpr.isPreAttacked' ||
      !currentWorkflow.options?.thirdPartyReaction?.itemUuids?.includes(
        sourceItem.uuid
      )
    ) {
      // Reaction should only be triggered by third party reactions
      const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature attacks.`;
      ui.notifications.warn(msg);
      return false;
    }
    return true;
  }

  /**
   * Handles the tpr.isPreAttacked post reaction of the Warding Flare item in the triggering midi-qol workflow.
   * If the reaction was used and completed successfully, adds disadvantage to the attack roll.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Warding Flare item.
   * @param {object} thirdPartyReactionResult - The third party reaction result.
   */
  function handleTargetOnUseIsPreAttackedPost(
    currentWorkflow,
    sourceItem,
    thirdPartyReactionResult
  ) {
    if (thirdPartyReactionResult?.uuid !== sourceItem.uuid) {
      return;
    }
    if (currentWorkflow.actor.system?.traits?.ci?.value?.has('blinded')) {
      if (debug) {
        console.warn(`{DEFAULT_ITEM_NAME} | Attacker is immune to blindness.`);
      }
      return;
    }

    // Note: at this point midi as already evaluated its ADV/DIS flags, we need to update it
    // if already defined or add one if not.
    let disValue = currentWorkflow.attackAdvAttribution.find((i) =>
      i.startsWith('DIS:attack.all')
    );
    if (disValue) {
      currentWorkflow.attackAdvAttribution.delete(disValue);
      disValue += ', ' + sourceItem.name;
    } else {
      disValue = 'DIS:attack.all ' + sourceItem.name;
    }
    currentWorkflow.attackAdvAttribution.add(disValue);
    currentWorkflow.disadvantage = true;
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Monk/deflectMissiles.js
async function deflectMissiles({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (args[0].macroPass == 'preItemRoll') {
    workflow.config.consumeResource = null;
  }
  const deflectMsg = workflow.chatCard;
  const DIV = document.createElement('DIV');
  DIV.innerHTML = deflectMsg.content;
  const deflectRoll = await new Roll(
    '1d10 + @abilities.dex.mod + @classes.monk.levels',
    actor.getRollData()
  ).evaluate();

  const msg = await deflectRoll.toMessage(
    { flavor: DIV.innerHTML },
    { create: false }
  );
  const newMessage = duplicate(msg);
  newMessage._id = deflectMsg._id;
  const deflectRollMsg = await ChatMessage.updateDocuments([newMessage]);

  const imgPropName = game.version < 12 ? 'icon' : 'img';
  const effectData = {
    changes: [
      { key: 'system.traits.dm.midi.all', mode: 2, value: -deflectRoll.total },
    ],
    [imgPropName]: 'icons/skills/ranged/arrow-flying-white-blue.webp',
    duration: { rounds: 1 },
    name: 'Damage Reduction - Deflect Missiles',
    origin: item.uuid,
    flags: { dae: { specialDuration: ['isDamaged', 'isAttacked'] } },
  };
  await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
  if (deflectRoll.total >= args[0].workflowOptions.damageTotal) {
    let throwBack = false;
    if (
      actor.items.get(scope.macroItem.system.consume.target).system.uses.value
    ) {
      throwBack = await Dialog.confirm({
        title: game.i18n.localize('Return Missile'),
        content: `<p>Throw the missile back at the attacker</p>`,
      });
    }
    if (!throwBack) {
      await actor.createEmbeddedDocuments('Item', [
        fromUuidSync(
          workflow.workflowOptions.sourceAmmoUuid ??
            workflow.workflowOptions.sourceItemUuid
        ).clone({ 'system.quantity': 1 }),
      ]);
    } else {
      const theItem = await fromUuid(
        workflow.workflowOptions.sourceAmmoUuid ??
          workflow.workflowOptions.sourceItemUuid
      );
      const theItemData = theItem.toObject();
      theItemData.system.range.value = 20;
      theItemData.system.range.long = 60;
      theItemData.system.actionType = 'rwak';
      theItemData.system.uses = {
        autoDestroy: true,
        max: 1,
        per: 'charges',
        prompt: false,
        value: 1,
      };
      theItemData.system.consume = {
        type: 'charges',
        target: scope.rolledItem.system.consume.target,
        amount: 1,
        scale: false,
      };
      theItemData.system.attack.bonus = '@prof';
      theItemData.system.proficient = 0;
      theItemData.system.consume.amount = 1;
      foundry.utils.setProperty(theItemData.system.damage, 'parts', [
        [
          '1@scale.monk.die + @mod',
          theItem.system.damage?.parts[0]?.[1] ?? 'bludgeoning',
        ],
      ]);
      const theActor = workflow.actor;
      const ownedItem = new CONFIG.Item.documentClass(theItemData, {
        parent: theActor,
      });
      const targetTokenOrActor = await fromUuid(
        workflow.workflowOptions.sourceActorUuid
      );
      const targetActor = targetTokenOrActor.actor ?? targetTokenOrActor;
      const target = MidiQOL.tokenForActor(targetActor);
      ownedItem.prepareFinalAttributes();
      await MidiQOL.completeItemUse(
        ownedItem,
        {},
        {
          targetUuids: [target.document.uuid],
          workflowOptions: { notReaction: false, autoConsumeResource: 'both' },
        }
      );
    }
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Ranger/Hunter/colossusSlayer.js
// @bakanabaka
async function colossusSlayer({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  async function preDamageRollComplete() {
    if (!item.system.actionType.includes('wak')) return;
    const targetActorHp = workflow.targets.first()?.actor.system.attributes.hp;
    if (!targetActorHp) return; // no target... weird
    if (targetActorHp.value == targetActorHp.max) return;

    if (macroUtil.combat.isSameTurn(persistentData.combat)) return;
    persistentData.combat = macroUtil.combat.getCombatInfo();

    const damageAmount = macroUtil.combat.damageFormula(workflow, '1d8');
    const damageRoll = await new Roll(damageAmount).evaluate();
    await game.dice3d?.showForRoll(damageRoll);

    workflow.damageRolls.push(damageRoll);
    await workflow.setDamageRolls(workflow.damageRolls);
  }

  const persistentDataName = `(Colossus Slayer) - Persistent Data`;
  const defaultPersistentData = { combat: {} };
  let persistentData =
    (await DAE.getFlag(actor, persistentDataName)) || defaultPersistentData;

  const callArguments = {
    speaker: speaker,
    actor: actor,
    token: token,
    character: character,
    item: item,
    args: args,
    scope: scope,
  };
  await macroUtil.runWorkflows(callArguments, {
    preDamageRollComplete: preDamageRollComplete, // damage die additions
  });

  await DAE.setFlag(actor, persistentDataName, persistentData);
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Ranger/primevalAwareness.js
// @bakanabaka
async function primevalAwareness({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  async function postCleanup() {
    const castLevel = arguments[0].castData.castLevel;
    let effect = actor.effects.find((ef) => ef.name == scope.macroItem.name);
    await effect.update({
      'duration.rounds': 10 * castLevel,
      'duration.seconds': 60 * castLevel,
    });
  }

  const callArguments = {
    speaker: speaker,
    actor: actor,
    token: token,
    character: character,
    item: item,
    args: args,
    scope: scope,
  };
  await macroUtil.runWorkflows(callArguments, {
    postCleanup: postCleanup,
  });
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Artificer/flashOfGenius.js
// ##################################################################################################
// Author: Elwin#1410 based on SagaTympana version
// Read First!!!!
// Adds a third party reaction active effect, that effect will trigger a reaction by the Artificer
// when a creature within range rolls a saving throw or ability check to allow them to add a bonus on the roll.
// v1.2.0
// Dependencies:
//  - DAE
//  - Times Up
//  - MidiQOL "on use" item/actor macro [preTargeting][preActiveEffects][tpr.isPostCheckSave]
//  - Elwin Helpers world script
//
// How to configure:
// The Feature details must be:
//   - Feature Type: Class Feature
//   - Activation cost: 1 Reaction
//   - Target: 1 Ally (RAW it's Creature, but use Ally to trigger reaction on allies only)
//   - Range: 30 feet
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved
//       ItemMacro | Before Active Effects
//   - Confirm Targets: Never
//   - No Full cover: (checked)
//   - Activation Conditions
//     - Reaction:
//       reaction === "tpr.isPostCheckSave"
//   - This item macro code must be added to the DIME code of this feature.
// Two effects must also be added:
//   - Flash of Genius:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,tpr.isPostCheckSave|canSee=true;post=true
//   - Flash of Genius - Bonus:
//      - Transfer Effect to Actor on ItemEquip (unchecked)
//      - Duration: 1 Turn
//      - Special Duration: Expires if the character rolls: ability check
//                          Expires if the character rolls: saving throw
//      - Effects:
//          - system.bonuses.abilities.check | Add | + @abilities.int.mod
//          - system.bonuses.abilities.save | Add | + @abilities.int.mod
//
// Usage:
// This item has a passive effect that adds a third party reaction effect.
// It is also a reaction item that gets triggered by the third party reaction effect when appropriate or it can be triggered manually.
//
// Description:
// In the preTargeting (item OnUse) phase of the Flash of Genius item (in owner's workflow):
//   Validates that item was triggered manually or by the remote tpr.isPostCheckSave target on use,
//   otherwise the item workflow execution is aborted.
// In the preActiveEffects (item OnUse) phase of the Flash of Genius item (in owner's workflow):
//   Validates that item was triggered manually otherwise it disables the application of the bonus AE.
// In the tpr.isPostCheckSave (TargetOnUse) post macro (in attacker's workflow) (on owner or other target):
//   If the reaction was used and completed successfully, a bonus is added to the target save roll,
//   and the success is reevaluated, then the workflow's save data for the target is updated accordingly.
// ###################################################################################################

async function flashOfGenius({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = 'Flash of Genius';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.4'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'times-up', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    // MidiQOL OnUse item macro for Flash of Genius
    return handleOnUsePreTargeting(workflow, scope.macroItem);
  } else if (
    args[0].tag === 'OnUse' &&
    args[0].macroPass === 'preActiveEffects'
  ) {
    return handleOnUsePreActiveEffects(workflow);
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isPostCheckSave.post'
  ) {
    await handleTargetOnUseIsPostCheckSavePost(
      workflow,
      scope.macroItem,
      token,
      options?.thirdPartyReactionResult
    );
  }

  /**
   * Handles the preItemRoll phase of the Flash of Genius item midi-qol workflow.
   * Validates that the reaction was triggered manually or by the tpr.isPostCheckSave target on use.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Flash of Genius item.
   *
   * @returns {boolean} true if all requirements are fulfilled, false otherwise.
   */
  function handleOnUsePreTargeting(currentWorkflow, sourceItem) {
    if (
      currentWorkflow.options?.isReaction &&
      (currentWorkflow.options?.thirdPartyReaction?.trigger !==
        'tpr.isPostCheckSave' ||
        !currentWorkflow.options?.thirdPartyReaction?.itemUuids?.includes(
          sourceItem.uuid
        ))
    ) {
      // Reaction should only be triggered by third party reaction AE or manually
      const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature needs to roll a save or an ability test.`;
      ui.notifications.warn(msg);
      return false;
    }
    return true;
  }

  /**
   * Handles the preActiveEffects phase of the Flash of Genius item midi-qol workflow.
   * Disables the application of AE on target when the reaction is not triggered manually.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @return {{haltEffectsApplication: true}|undefined} If not triggered manually returns an object to stop midi from applying the AE,
   *                                                    otherwise undefined.
   */
  function handleOnUsePreActiveEffects(currentWorkflow) {
    // Do not apply AE on target when reaction is triggered manually.
    if (currentWorkflow.options?.isReaction) {
      return { haltEffectsApplication: true };
    }
  }

  /**
   * Handles the tpr.isPostCheckSave post reaction of the Flash of Genius item in the triggering midi-qol workflow.
   * If the reaction was used and completed successfully, adds the int bonus to the rolled check and revalidates if it
   * can transform a failed check into a success.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Flash of Genius item.
   * @param {Token5e} target - The target.
   * @param {object} thirdPartyReactionResult - The third party reaction result.
   */
  async function handleTargetOnUseIsPostCheckSavePost(
    currentWorkflow,
    sourceItem,
    target,
    thirdPartyReactionResult
  ) {
    if (thirdPartyReactionResult?.uuid !== sourceItem.uuid) {
      return;
    }
    const sourceActor = sourceItem.actor;
    if (!sourceActor) {
      console.error(`${DEFAULT_ITEM_NAME} | Missing sourceActor`, sourceItem);
      return;
    }

    const saveDisplayDatum = currentWorkflow.saveDisplayData.find(
      (sdd) => sdd.target === target
    );
    if (
      !saveDisplayDatum ||
      saveDisplayDatum?.rollDetail?.options?.targetValue === undefined
    ) {
      console.warn(
        `${DEFAULT_ITEM_NAME} | No saveDisplayData found for the target or missing rollDetail.`,
        {
          currentWorkflow,
          target,
        }
      );
      return;
    }
    const abilityMod = sourceActor.getRollData().abilities?.int?.mod ?? 0;

    saveDisplayDatum.rollTotal += abilityMod;

    saveDisplayDatum.rollDetail.terms.push(
      await new OperatorTerm({ operator: '+' }).evaluate()
    );
    saveDisplayDatum.rollDetail.terms.push(
      await new NumericTerm({ number: abilityMod }).evaluate()
    );

    saveDisplayDatum.rollDetail._total += abilityMod;
    saveDisplayDatum.rollDetail.resetFormula();

    saveDisplayDatum.rollHTML = await MidiQOL.midiRenderRoll(
      saveDisplayDatum.rollDetail
    );

    // TODO support fumble on saves???
    if (currentWorkflow.failedSaves?.has(target)) {
      // validate if the added bonus makes the save successful
      const dc = saveDisplayDatum.rollDetail.options.targetValue;
      if (saveDisplayDatum.rollTotal < dc) {
        // Nothing to do, it still fails
        return;
      }
      // Change data from failed to success
      currentWorkflow.failedSaves.delete(target);
      currentWorkflow.saves?.add(target);

      saveDisplayDatum.saveString = game.i18n.localize('midi-qol.save-success');
      saveDisplayDatum.saveSymbol = 'fa-check';
      saveDisplayDatum.saveClass = 'success';
    }
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Paladin/OathOfVengeance/channelDivinityVowOfEnmity.js
// ##################################################################################################
// Read First!!!!
// Marks a target for "Channel Divinity: Vow of Enmity", and gives advantage on attacks against it.
// v2.3.0
// Author: Elwin#1410
// Dependencies:
//  - DAE
//  - Times Up
//  - MidiQOL "on use" item/actor macro,[preAttackRoll][postActiveEffects]
//
// How to configure:
// The item details must be:
//   - Feature Type: Class Feature
//   - Class Feature Type: Channel Divinity
//   - Action: 1 Bonus Action
//   - Target: 1 Creature
//   - Range: 10 feet
//   - Duration: 1 minute
//   - Resource Consumption: 1 | Channel Divinity | Item Uses (to be set when added to an actor)
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | After Active Effects
//   - Roll a separate attack per target: Never
//   - This item macro code must be added to the DIME code of the feature.
// Two effects must also be added:
//   - Channel Divinity: Vow of Enmity:
//      - Transfer Effect to Actor on ItemEquip (unchecked)
//      - Apply to self when item applies target effects (checked)
//      - Duration: empty
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,preAttackRoll
//   - Marked by Vow of Enmity:
//      - Transfer Effect to Actor on ItemEquip (unchecked)
//      - An expression if false will remove the AE: !statuses.has("unconscious")
//      - Duration: empty
//      - Special duration:
//        - Zero HP
//
// Usage:
// This item need to be used to activate. It marks the target and gives advantage to any attack made to this target.
//
// Note: It may not auto remove the effect if the marked target becomes Unconscious with more than 0 HP immediately.
//       It will do so on the next actor update, this is due to when DAE evaluates the expression. This could probably
//       fixed in a future DAE version.
//
// Description:
// In the preAttackRoll phase (of any item of the marker):
//   Gives advantage to the marker if the target is marked by him.
// In the postActiveEffects phase:
//   Updates the self active effect to delete the target active effect when deleted and vice versa.
// ###################################################################################################

async function channelDivinityVowOfEnmity({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const DEFAULT_ITEM_NAME = 'Channel Divinity: Vow of Enmity';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  const dependencies = ['dae', 'times-up', 'midi-qol'];
  if (!requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  /**
   * If the requirements are met, returns true, false otherwise.
   *
   * @param {string} name - The name of the item for which to check the dependencies.
   * @param {string[]} dependencies - The array of module ids which are required.
   *
   * @returns {boolean} true if the requirements are met, false otherwise.
   */
  function requirementsSatisfied(name, dependencies) {
    let missingDep = false;
    dependencies.forEach((dep) => {
      if (!game.modules.get(dep)?.active) {
        const errorMsg = `${name} | ${dep} must be installed and active.`;
        ui.notifications.error(errorMsg);
        console.warn(errorMsg);
        missingDep = true;
      }
    });
    return !missingDep;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }
  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preAttackRoll') {
    if (workflow.targets.size < 1) {
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No targets.`);
      }
      return;
    }
    const allTargetsMarked = workflow.targets.every((t) =>
      t.actor?.appliedEffects.some((ae) => ae.origin === scope.macroItem.uuid)
    );
    if (!allTargetsMarked) {
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | Not all targets are marked.`, {
          targets: workflow.targets,
        });
      }
      return;
    }

    workflow.advantage = true;
    workflow.attackAdvAttribution.add(`ADV:${scope.macroItem.name}`);
    workflow.advReminderAttackAdvAttribution.add(`ADV:${scope.macroItem.name}`);
  } else if (
    args[0].tag === 'OnUse' &&
    args[0].macroPass === 'postActiveEffects'
  ) {
    if (workflow.applicationTargets.size < 1) {
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No effect applied to target.`);
      }
      return;
    }
    // TODO should we allow targeting an unconscious creature or having 0 HP?

    const tokenTarget = workflow.applicationTargets.first();
    const appliedEffect = tokenTarget.actor.appliedEffects.find(
      (ae) => ae.origin === scope.macroItem.uuid
    );
    if (!appliedEffect) {
      if (debug) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | No applied effect found on target actor.`
        );
      }
      return;
    }

    // Find AE on self to add delete flag
    const selfEffect = actor.effects.find(
      (ae) => ae.origin === scope.macroItem.uuid
    );
    if (!selfEffect) {
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No self effect found on actor.`);
      }
      return;
    }
    await selfEffect.addDependent(appliedEffect);
    await MidiQOL.socket().executeAsGM('addDependent', {
      concentrationEffectUuid: appliedEffect.uuid,
      dependentUuid: selfEffect.uuid,
    });
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Bard/CollegeOfTragedy/sorrowfulFate.js
// ##################################################################################################
// Read First!!!!
// Adds a third party reaction active effect, that effect will trigger a reaction by the Bard
// when an ally or himself forces a creature to roll a saving throw. When doing so, the saving
// throw ability is changed to Charisma and if the target fails its save it takes extra damage.
// v1.1.0
// Author: Elwin#1410
// Dependencies:
//  - DAE, macro [off]
//  - Times Up
//  - MidiQOL "on use" item macro,[preTargeting][preActiveEffects]
//  - Elwin Helpers world script
//
// How to configure:
// The item details must be:
//   - Feature Type: Class Feature
//   - Activation cost: 0 Reaction
//   - Target: 1 Ally
//   - Limited Uses: 1 of 1 per Short Rest
//   - Resource Consumption: 1 | Bardic Inspiration | Item Uses (to be set when added to an actor)
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved (*)
//   - No Full cover: (checked)
//   - Activation Conditions
//     - Reaction:
//       reaction === "tpr.isPreCheckSave" && tpr?.item.uses?.value && workflow.saveItem?.system.actionType === "save"
//       && !workflow.saveItem?.getFlag("midi-qol", "overTimeSkillRoll")
//   - This item macro code must be added to the DIME code of the feature.
// Two effects must also be added:
//   - Sorrowful Fate
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,tpr.isPreCheckSave|triggerSource=attacker;canSee=true;post=true
//
// Usage:
// This item has a passive effect that adds a third party reaction effect.
// It is also a reaction item that gets triggered by the third party reaction effect when appropriate.
//
// Note: A scale dice value must be configured on the 'Bard' class,
//       its data value should resolve to '@scale.bard.bardic-inspiration'.
//
// Description:
// In the preTargeting (item OnUse) phase of the Sorrowful Fate item (in owner's workflow):
//   Validates that item was triggered manually or by the remote tpr.isPreCheckSave target on use,
//   otherwise the item workflow execution is aborted.
// In the tpr.isPreCheckSave (TargetOnUse) post macro (in attacker's workflow) (on target):
//   If the reaction was used and completed successfully, changes the save item ability to Charisma
//   and registers a hook to damage the target if the target failed its save after the current workflow has completed.
// In the midi-qol.RollComplete hook (in attacker's workflow):
//   If the target failed its save, inflict it extra damage using a synthetic item executed on the
//   feat onwer's client.
// If the Sorrowful Fate AE on the target expires [off]:
//   If the expiry reason is because the target reached 0 HP, a chat message is created to remind the
//   target to die in a dramatic way.
// ###################################################################################################

async function sorrowfulFate({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = 'Sorrowful Fate';
  const MODULE_ID = 'midi-item-showcase-community';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.2.4'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'times-up', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }
  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    return handleOnUsePreTargeting(workflow, scope.macroItem);
  } else if (
    args[0].tag === 'OnUse' &&
    args[0].macroPass === 'preActiveEffects'
  ) {
    // Validates that the item is the synthetic feat
    if (scope.rolledItem.getFlag(MODULE_ID, 'sorrowfulFateDamage')) {
      return await handleOnUsePreActiveEffects(workflow, scope.macroItem);
    }
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isPreCheckSave.post'
  ) {
    handleTargetOnUseIsPreCheckSavePost(
      workflow,
      scope.macroItem,
      token,
      options?.thirdPartyReactionResult
    );
  } else if (args[0] === 'off') {
    if (
      foundry.utils.getProperty(scope.lastArgValue, 'expiry-reason') !==
      'midi-qol:zeroHP'
    ) {
      // Not expired due to zero HP
      return;
    }
    // Output a chat message to remind actor of making a scene while dying
    const player = MidiQOL.playerForActor(actor);
    const tokenName =
      (MidiQOL.configSettings().useTokenNames ? token.name : actor.name) ??
      '<unknown>';
    await ChatMessage.create({
      type:
        game.release.generation >= 12
          ? CONST.CHAT_MESSAGE_STYLES.OTHER
          : CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: `${tokenName} is magically compelled to utter darkly poetic final words before succumbing from their injuries`,
      speaker: { user: game.users.activeGM },
      whisper: player ? [player.id] : [],
    });
  }

  /**
   * Handles the preTargeting phase of the Sorrowful Fate item midi-qol workflow.
   * Validates that the reaction was triggered by the isPreCheckSave phase.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - midi-qol current workflow.
   * @param {Item5E} sourceItem - The Sorrowful Fate item.
   *
   * @returns {boolean} true if all requirements are fulfilled, false otherwise.
   */
  function handleOnUsePreTargeting(currentWorkflow, sourceItem) {
    if (
      currentWorkflow.options?.thirdPartyReaction?.trigger !==
        'tpr.isPreCheckSave' ||
      !currentWorkflow.options?.thirdPartyReaction?.itemUuids?.includes(
        sourceItem.uuid
      )
    ) {
      // Reaction should only be triggered by third party reactions
      const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature forces another creature to make a saving throw.`;
      ui.notifications.warn(msg);
      return false;
    }
    return true;
  }

  /**
   * Handles the preActiveEffects phase of the 'Sorrowful Fate - Damage' item midi-qol workflow.
   * Disables the application of AE on target when it already has 0 HP.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The 'Sorrowful Fate' item.
   * @return {{haltEffectsApplication: true}|undefined} If target has 0 HP returns an object to stop midi from applying the AE,
   *                                                    otherwise undefined.
   */
  async function handleOnUsePreActiveEffects(currentWorkflow, sourceItem) {
    // Do not apply AE on target when it has 0 HP.
    const targetToken = currentWorkflow.targets.first();
    if (!targetToken?.actor?.system?.attributes?.hp?.value) {
      // Output a chat message to remind actor of making a scene while dying
      const player = MidiQOL.playerFor(targetToken);
      const tokenName =
        (MidiQOL.configSettings().useTokenNames
          ? targetToken.name
          : targetToken.actor?.name) ?? '<unknown>';
      await ChatMessage.create({
        type:
          game.release.generation >= 12
            ? CONST.CHAT_MESSAGE_STYLES.OTHER
            : CONST.CHAT_MESSAGE_TYPES.OTHER,
        content: `${tokenName} is magically compelled to utter darkly poetic final words before succumbing from their injuries`,
        speaker: { user: game.users.activeGM },
        whisper: player ? [player.id] : [],
      });
      return { haltEffectsApplication: true };
    }
  }

  /**
   * Handles the tpr.isPreCheckSave post reaction of the Sorrowful Fate item in the triggering midi-qol workflow.
   * If the reaction was used and completed successfully, changes the current save item ability to Charisma and
   * registers a hook to inflict extra damage on a failed save.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Sorrowful Fate item.
   * @param {Token5e} target - The target.
   * @param {object} thirdPartyReactionResult - The third party reaction result.
   */
  function handleTargetOnUseIsPreCheckSavePost(
    currentWorkflow,
    sourceItem,
    target,
    thirdPartyReactionResult
  ) {
    if (thirdPartyReactionResult?.uuid !== sourceItem.uuid) {
      return;
    }
    if (
      !currentWorkflow.item.hasSave ||
      !currentWorkflow.item.system?.save?.ability
    ) {
      if (debug) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | Item does not have a save or a save ability.`,
          currentWorkflow.item
        );
      }
      return;
    }
    // Change save ability to Charisma
    currentWorkflow.item = currentWorkflow.item.clone(
      { 'system.save.ability': 'cha' },
      { keepId: true }
    );

    // Register hook to call extra damage after roll is complete if the save was failed
    Hooks.once(
      `midi-qol.RollComplete.${currentWorkflow.itemUuid}`,
      async (currentWorkflow2) => {
        if (
          !elwinHelpers.isMidiHookStillValid(
            DEFAULT_ITEM_NAME,
            'midi-qol.RollComplete',
            `${sourceItem.name} - Damage`,
            currentWorkflow,
            currentWorkflow2,
            debug
          )
        ) {
          return;
        }
        if (debug) {
          console.warn(`${DEFAULT_ITEM_NAME} | midi-qol.RollComplete.`, {
            currentWorkflow,
          });
        }
        if (!currentWorkflow.failedSaves?.has(target)) {
          if (debug) {
            console.warn(
              `${DEFAULT_ITEM_NAME} | The target succeeded on its saving throw, no extra damage.`,
              {
                currentWorkflow,
                target,
              }
            );
          }
          return;
        }

        const sourceActor = sourceItem.actor;
        const featData = getFeatData(currentWorkflow, sourceItem);

        const feat = new CONFIG.Item.documentClass(featData, {
          parent: sourceActor,
          temporary: true,
        });

        const options = {
          targetUuids: [target.document.uuid],
          configureDialog: false,
          workflowOptions: { targetConfirmation: 'none' },
        };

        const data = {
          itemData: feat.toObject(),
          actorUuid: sourceActor.uuid,
          targetUuids: options.targetUuids,
          options,
        };

        let player = MidiQOL.playerForActor(sourceActor);
        if (!player?.active) {
          // Find first active GM player
          player = game.users?.activeGM;
        }
        if (!player?.active) {
          console.warn(
            `${DEFAULT_ITEM_NAME} | No active player or GM for actor.`,
            sourceActor
          );
          return;
        }

        await MidiQOL.socket().executeAsUser(
          'completeItemUse',
          player.id,
          data
        );
      }
    );
  }

  /**
   * Returns the feat data for for the extra damage on a failed save.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Sorrowful Fate item.
   *
   * @returns {object} The feat data for the extra damage on a failed save.
   */
  function getFeatData(currentWorkflow, sourceItem) {
    const imgPropName = game.release.generation >= 12 ? 'img' : 'icon';
    const featData = {
      type: 'feat',
      name: `${sourceItem.name} - Damage`,
      img: sourceItem.img,
      system: {
        actionType: 'other',
        damage: { parts: [['@scale.bard.bardic-inspiration', 'psychic']] },
        target: { type: 'creature', value: 1 },
      },
      effects: [
        {
          changes: [
            // flag to handle the off callback
            {
              key: 'macro.itemMacro',
              mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
              value: sourceItem.uuid,
              priority: 20,
            },
          ],
          origin: sourceItem.uuid, //flag the effect as associated to the source item used
          [imgPropName]: sourceItem.img,
          name: `${sourceItem.name}`,
          transfer: false,
          duration: currentWorkflow.inCombat
            ? { rounds: 60 / (CONFIG.time.roundTime ?? 6) }
            : { seconds: 60 },
          flags: {
            dae: { specialDuration: ['zeroHP'] },
          },
        },
      ],
      flags: {
        'midi-qol': {
          onUseMacroName: `[preActiveEffects]ItemMacro.${sourceItem.uuid}`,
        },
        [MODULE_ID]: { sorrowfulFateDamage: true },
      },
    };
    return featData;
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Cleric/NatureDomain/dampenElements.js
// ##################################################################################################
// Author: Elwin#1410
// Read First!!!!
// Adds a third party reaction active effect, that effect will trigger a reaction by the Cleric
// when a creature within is damaged by elemental damage type to allow him to add resistance to this type
// of damage before the damage is applied.
// v1.1.0
// Dependencies:
//  - DAE
//  - MidiQOL "on use" actor macro [preTargeting][postActiveEffects][tpr.isDamaged]
//  - Elwin Helpers world script
//
// How to configure:
// The Feature details must be:
//   - Activation cost: 1 Reaction
//   - Target: 1 Ally (RAW it's Creature, but use Enemy to trigger reaction only on allies)
//   - Action Type: (empty)
//   - Range: 30 feet
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved
//       ItemMacro | After Active Effects
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - Activation Conditions
//     - Reaction:
//       reaction === "tpr.isDamaged" && workflow.damageItem?.damageDetail.some(d => ["acid", "cold", "fire", "lightning", "thunder"].includes(d.type) && (d.value ?? d.damage) > 0 && d.active?.resistance !== true)
//   - This item macro code must be added to the DIME code of the item.
// One effect must also be added:
//   - Dampen Elements:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,tpr.isDamaged|pre=true;post=true
//
// Usage:
// This item has a passive effect that adds a third party reaction effect.
// It is also a reaction item that gets triggered by the third party reaction effect when appropriate.
//
// Description:
// In the preTargeting (item OnUse) phase of the Dampen Elements item (in owner's workflow):
//   Validates that item was triggered by the remote tpr.isDamaged target on use,
//   otherwise the item workflow execution is aborted.
// In the postActiveEffects (item onUse) phase of the item (in owner's workflow):
//   If there is more than one element damage type, prompts a dialog to choose to which type to apply the resistance.
//   A selected damage type flag is set on the item's owner to be used by the post macro of the tpr.isDamaged reaction.
// In the tpr.isDamaged (TargetOnUse) pre macro (in attacker's workflow) (on owner or other target):
//   Sets a flag on the item's owner with the elemental damage types to be applied to the target.
// In the tpr.isDamaged (TargetOnUse) post macro (in attacker's workflow) (on owner or other target):
//   If the reaction was used and completed successfully, applies resistance to the selected element damage type flag,
//   and recomputes the applied damage.
// ###################################################################################################

async function dampenElements({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = 'Dampen Elements';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.6'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers world script must be installed, active and have a version greater or equal than 2.6.0`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }
  if (
    !foundry.utils.isNewerVersion(
      game.modules.get('midi-qol')?.version,
      '11.6'
    ) &&
    !MidiQOL.configSettings().v3DamageApplication
  ) {
    ui.notifications.error(
      `${DEFAULT_ITEM_NAME} | dnd5e v3 damage application is required.`
    );
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    return handleOnUsePreTargeting(workflow, scope.macroItem);
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isDamaged.pre'
  ) {
    // MidiQOL TargetOnUse pre macro for Dampen Elements pre reaction in the triggering midi-qol workflow
    return await handleTargetOnUseIsDamagedPre(workflow, scope.macroItem);
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isDamaged.post'
  ) {
    await handleTargetOnUseIsDamagedPost(
      workflow,
      scope.macroItem,
      options?.thirdPartyReactionResult
    );
  } else if (
    args[0].tag === 'OnUse' &&
    args[0].macroPass === 'postActiveEffects'
  ) {
    // MidiQOL OnUse item macro for Dampen Elements
    await handleOnUsePostActiveEffects(workflow, scope.macroItem, actor);
  }

  /**
   * Handles the preTargeting phase of the Dampen Elements item midi-qol workflow.
   * Validates that the reaction was triggered by the isHit phase.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - midi-qol current workflow.
   * @param {Item5E} sourceItem - The Dampen Elements item.
   *
   * @returns {boolean} true if all requirements are fulfilled, false otherwise.
   */
  function handleOnUsePreTargeting(currentWorkflow, sourceItem) {
    if (
      currentWorkflow.options?.thirdPartyReaction?.trigger !==
        'tpr.isDamaged' ||
      !currentWorkflow.options?.thirdPartyReaction?.itemUuids?.includes(
        sourceItem.uuid
      )
    ) {
      // Reaction should only be triggered by third party reactions
      const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature is damaged by element damage type.`;
      ui.notifications.warn(msg);
      return false;
    }
    return true;
  }

  /**
   * Handles the tpr.isDamaged pre macro of the Dampen Elements item in the triggering midi-qol workflow.
   * Sets a flag on the owner with the elemental damage types from which to choose to apply resistance.
   * It will be used by the reaction.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Dampen Elements item.
   *
   * @returns {object} undefined when all conditions are met, an object with skip attribute to true if the reaction must be skipped.
   */
  async function handleTargetOnUseIsDamagedPre(currentWorkflow, sourceItem) {
    // Sets the elemental damage types of the damage to be applied.
    const sourceActor = sourceItem.actor;

    if (!sourceActor) {
      console.error(`${DEFAULT_ITEM_NAME} | Missing sourceActor`, sourceItem);
      return { skip: true };
    }
    const damages = currentWorkflow.damageItem?.damageDetail.filter(
      (d) =>
        ['acid', 'cold', 'fire', 'lightning', 'thunder'].includes(d.type) &&
        (d.value ?? d.damage) > 0 &&
        d.active?.resistance !== true
    );
    if (!damages.length) {
      if (debug) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | No elemental damage types found.`,
          {
            damageDetail: currentWorkflow.damageItem?.damageDetail,
          }
        );
      }
      await DAE.unsetFlag(sourceActor, 'dampenElements');
      return { skip: true };
    }
    await DAE.setFlag(sourceActor, 'dampenElements', { damages });
  }

  /**
   * Handles the tpr.isDamaged post reaction of the Dampen Elements item in the triggering midi-qol workflow.
   * If the reaction was used and completed successfully, adds resistance to the selected elemental damage type.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Dampen Elements item.
   * @param {object} thirdPartyReactionResult - The third party reaction result.
   */
  async function handleTargetOnUseIsDamagedPost(
    currentWorkflow,
    sourceItem,
    thirdPartyReactionResult
  ) {
    const dampenElementsFlag = DAE.getFlag(sourceItem.actor, 'dampenElements');
    if (
      thirdPartyReactionResult?.uuid !== sourceItem.uuid ||
      !dampenElementsFlag?.damages.length
    ) {
      return;
    }
    await DAE.unsetFlag(sourceItem.actor, 'dampenElements');

    const selectedType =
      dampenElementsFlag.selected ?? dampenElementsFlag.damages[0].type;
    const damageItem = currentWorkflow.damageItem;
    const targetToken = fromUuidSync(damageItem.tokenUuid);
    if (!targetToken) {
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | Target token found.`, {
          damageItem: workflow.damageItem,
        });
      }
      return;
    }

    // Compute resistance to damage
    damageItem.damageDetail = targetToken.actor?.calculateDamage(
      damageItem.rawDamageDetail,
      damageItem.calcDamageOptions ?? {}
    );
    // Recompute totals.
    elwinHelpers.calculateAppliedDamage(damageItem);
    if (damageItem.details) {
      damageItem.details.push(
        `${sourceItem.name} [${
          CONFIG.DND5E.damageTypes[selectedType].label ??
          CONFIG.DND5E.damageTypes[selectedType]
        }]`
      );
    }
  }

  /**
   * Handles the postActiveEffects of the Dampen Elements item midi-qol workflow.
   * A flag is added to the Barbarian with the damage reduction to be applied and the item card
   * is updated to inform of the damage reduction to be applied on the target.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Dampen Elements item.
   * @param {Actor5e} sourceActor - The owner of the Dampen Elements item.
   */
  async function handleOnUsePostActiveEffects(
    currentWorkflow,
    sourceItem,
    sourceActor
  ) {
    const targetToken = currentWorkflow.targets.first();
    if (!targetToken) {
      // No target found
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | Target found.`);
      }
      return;
    }
    const targetActor = targetToken.actor;
    if (!targetActor) {
      // No actor found
      console.warn(`${DEFAULT_ITEM_NAME} | Target actor found.`, targetActor);
      return;
    }
    const dampenElementsFlag = DAE.getFlag(sourceActor, 'dampenElements');
    if (debug) {
      console.warn(`${DEFAULT_ITEM_NAME} | Dampen elements flag.`, {
        dampenElementsFlag,
      });
    }
    if (!dampenElementsFlag || !(dampenElementsFlag.damages?.length > 1)) {
      return;
    }

    // Prompts a dialog to choose to which type to apply resistance
    const selectedType = await chooseDamageType(
      sourceItem,
      dampenElementsFlag.damages
    );
    if (selectedType) {
      dampenElementsFlag.selected = selectedType;
      await DAE.setFlag(sourceActor, 'dampenElements', dampenElementsFlag);
    }

    // Create an active effect to add resistance to selected type
    const imgPropName = game.release.generation >= 12 ? 'img' : 'icon';
    const targetEffectData = {
      changes: [
        // resistance to damage
        {
          key: 'system.traits.dr.value',
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: selectedType,
          priority: 20,
        },
      ],
      origin: sourceItem.uuid, //flag the effect as associated to the source item used
      transfer: false,
      [imgPropName]: sourceItem.img,
      name: `${sourceItem.name} - Damage Resistance`,
      duration: currentWorkflow.inCombat ? { turns: 1 } : { seconds: 1 },
      'flags.dae.specialDuration': ['isAttacked', 'isSave', 'isDamaged'],
    };
    await MidiQOL.socket().executeAsGM('createEffects', {
      actorUuid: targetActor.uuid,
      effects: [targetEffectData],
    });
  }

  /**
   * Prompts a dialog to choose a damage type from a list of types.
   *
   * @param {Item5e} sourceItem the source item.
   * @param {Array<object>} damages the type and value of damages from which to choose.
   *
   * @returns {string} the selected damage type.
   */
  async function chooseDamageType(sourceItem, damages) {
    const data = {
      buttons: damages.map((d) => ({
        label: `${
          CONFIG.DND5E.damageTypes[d.type].label ??
          CONFIG.DND5E.damageTypes[d.type]
        } [${d.value ?? d.damage}]`,
        value: d.type,
      })),
      title: `${sourceItem.name} - Choose a Damage Type`,
    };
    return await elwinHelpers.buttonDialog(data, 'column');
  }
}

;// CONCATENATED MODULE: ./scripts/automations/classFeatures/Paladin/OathOfRedemption/channelDivinityRebukeTheViolent.js
// ##################################################################################################
// Author: Elwin#1410
// Read First!!!!
// Adds an active effect, that effect will trigger a reaction by the Paladin when a creature within range
// is damaged to allow him to use the feature to apply retribution damage to the attacker.
// v1.0.0
// Dependencies:
//  - DAE
//  - MidiQOL "on use" actor and item macro [preTargeting],[tpr.isDamaged]
//  - Elwin Helpers world script
//
// How to configure:
// The Feature details must be:
//   - Feature Type: Class Feature
//   - Class Feature Type: Channel Divinity
//   - Activation cost: 1 Reaction
//   - Target: 1 Ally (RAW it's Creature, but use Ally to trigger reaction on allies only)
//   - Range: 30 Feet
//   - Resource Consumption: 1 | Channel Divinity | Item Uses (to be set when added to an actor)
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - Activation Conditions
//     - Reaction:
//       reaction === "tpr.isDamaged"
//   - This item macro code must be added to the DIME code of this feature.
// One effect must also be added:
//   - Channel Divinity: Rebuke the Violent:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,tpr.isDamaged|ignoreSelf=true;post=true
//
// Usage:
// This item has a passive effect that adds a third party reaction effect.
// It is also a reaction item that gets triggered by the third party reaction effect when appropriate.
//
// Description:
// There are multiple calls of this item macro, dependending on the trigger.
// In the preTargeting (item OnUse) phase of the item (in owner's workflow):
//   Validates that item was triggered by the remote tpr.isDamaged target on use,
//   otherwise the item workflow execution is aborted.
// In the tpr.isDamaged (TargetOnUse) post macro (in attacker's workflow) (on other target):
//   If the reaction was used and completed successfully, a synthetic item is used to apply 
//   the retribution damage to the attacker on the Rebuke the Violent item owner's client.
// ###################################################################################################


async function channelDivinityRebukeTheViolent({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
// Default name of the feature
const DEFAULT_ITEM_NAME = "Channel Divinity: Rebuke the Violent";
const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

if (!foundry.utils.isNewerVersion(globalThis?.elwinHelpers?.version ?? "1.1", "2.6")) {
  const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
  ui.notifications.error(errorMsg);
  return;
}
const dependencies = ["dae", "midi-qol"];
if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
  return;
}
if (
  !foundry.utils.isNewerVersion(game.modules.get("midi-qol")?.version, "11.6") &&
  !MidiQOL.configSettings().v3DamageApplication
) {
  ui.notifications.error(`${DEFAULT_ITEM_NAME} | dnd5e v3 damage application is required.`);
}

if (debug) {
  console.warn(DEFAULT_ITEM_NAME, { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] }, arguments);
}

if (args[0].tag === "OnUse" && args[0].macroPass === "preTargeting") {
  // MidiQOL OnUse item macro for Rebuke the Violent
  return handleOnUsePreTargeting(workflow, scope.macroItem);
} else if (args[0].tag === "TargetOnUse" && args[0].macroPass === "tpr.isDamaged.post") {
  // MidiQOL TargetOnUse post item macro for Rebuke the Violent post reaction
  handleTargetOnUseIsDamagedPost(workflow, scope.macroItem, options?.thirdPartyReactionResult);
}

/**
 * Handles the preTargeting phase of the Rebuke the Violent item.
 * Validates that the reaction was triggered by the tpr.isDamaged target on use.
 *
 * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
 * @param {Item5e} sourceItem - The Rebuke the Violent item.
 *
 * @returns {boolean} true if all requirements are fulfilled, false otherwise.
 */
function handleOnUsePreTargeting(currentWorkflow, sourceItem) {
  if (
    currentWorkflow.options?.thirdPartyReaction?.trigger !== "tpr.isDamaged" ||
    !currentWorkflow.options?.thirdPartyReaction?.itemUuids?.includes(sourceItem.uuid)
  ) {
    // Reaction should only be triggered by aura
    const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature of the Paladin is damaged.`;
    ui.notifications.warn(msg);
    return false;
  }
  return true;
}

/**
 * Handles the tpr.isDamaged post macro of the Rebuke the Violent item.
 * If the reaction was used and completed successfully, a synthetic item is used to apply the retribution damage to the attacker.
 *
 * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
 * @param {Item5e} sourceItem - The Rebuke the Violent item.
 * @param {object} thirdPartyReactionResult - The third party reaction result.
 */
function handleTargetOnUseIsDamagedPost(currentWorkflow, sourceItem, thirdPartyReactionResult) {
  if (thirdPartyReactionResult?.uuid !== sourceItem.uuid) {
    return;
  }
  const sourceActor = sourceItem.actor;

  if (!sourceActor) {
    console.error(`${DEFAULT_ITEM_NAME} | Missing sourceActor`, sourceItem);
    return;
  }

  // Set damage to be applied, to be available for remote reaction
  const totalDamage =
    currentWorkflow.damageItem?.damageDetail?.reduce(
      (acc, d) => acc + (["temphp", "midi-none"].includes(d.type) ? 0 : d.value),
      0
    ) ?? 0;
  if (!(totalDamage > 0)) {
    // No damage dealt
    return;
  }
  // Build the retribution damage to apply to the attacker.
  const damageParts = [[`(${totalDamage}[radiant])`, "radiant"]];

  // Damage the attacker
  const featData = {
    type: "feat",
    name: `${sourceItem.name} - Retribution Damage`,
    img: sourceItem.img,
    system: {
      actionType: "save",
      damage: { parts: damageParts },
      target: { type: "creature", value: 1 },
      save: { ability: "wis", scaling: "spell" },
    },
    flags: {
      midiProperties: {
        saveDamage: "halfdam",
      },
    },
  };
  const feat = new CONFIG.Item.documentClass(featData, {
    parent: sourceActor,
    temporary: true,
  });

  const options = {
    targetUuids: [currentWorkflow.tokenUuid],
    configureDialog: false,
    workflowOptions: { fastForwardDamage: true, targetConfirmation: "none", autoRollDamage: "always" },
    workflowData: true,
  };

  // Send the item roll to user's client, after the completion of this workflow
  let player = MidiQOL.playerForActor(sourceActor);
  if (!player?.active) {
    // Find first active GM player
    player = game.users?.activeGM;
  }
  if (!player) {
    console.error(`${DEFAULT_ITEM_NAME} | Could not find player for actor ${sourceActor}`);
    return;
  }

  const data = {
    itemData: feat.toObject(),
    actorUuid: sourceActor.uuid,
    targetUuids: options.targetUuids,
    options,
  };

  // Register hook to call retribution damage after roll is complete
  Hooks.once(`midi-qol.RollComplete.${currentWorkflow.itemUuid}`, async (currentWorkflow2) => {
    if (
      !elwinHelpers.isMidiHookStillValid(
        DEFAULT_ITEM_NAME,
        "midi-qol.RollComplete",
        feat.name,
        currentWorkflow,
        currentWorkflow2,
        debug
      )
    ) {
      return;
    }
    await MidiQOL.socket().executeAsUser("completeItemUse", player.id, data);
  });
}

}
;// CONCATENATED MODULE: ./scripts/automations/classFeatures/classFeatures.js

























let classFeatures = {
  soulOfArtifice: soulOfArtifice,
  spiritShield: spiritShield,
  relentlessRage: relentlessRage,
  vengefulAncestors: vengefulAncestors,
  sentinelAtDeathsDoor: sentinelAtDeathsDoor,
  blessedHealer: blessedHealer,
  spiritTotemBearSpirit: spiritTotemBearSpirit,
  unwaveringMark: unwaveringMark,
  psionicPowerProtectiveField: psionicPowerProtectiveField,
  greatWeaponFighting: greatWeaponFighting,
  channelDivinityTurnTheTide: channelDivinityTurnTheTide,
  divineAllegiance: divineAllegiance,
  steadyAim: steadyAim,
  tombOfLevistus: tombOfLevistus,
  armsOfTheAstralSelf: armsOfTheAstralSelf,
  wardingFlare: wardingFlare,
  deflectMissiles: deflectMissiles,
  colossusSlayer: colossusSlayer,
  primevalAwareness: primevalAwareness,
  flashOfGenius: flashOfGenius,
  channelDivinityVowOfEnmity: channelDivinityVowOfEnmity,
  sorrowfulFate: sorrowfulFate,
  dampenElements: dampenElements,
  channelDivinityRebukeTheViolent: channelDivinityRebukeTheViolent,
};

;// CONCATENATED MODULE: ./scripts/automations/features/dungeonDelver.js
async function dungeonDelver({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (
    args[0].macroPass === 'preTargetDamageApplication' &&
    workflow.actor.name === 'Trap'
  ) {
    const msg = await item.displayCard({ createMessage: false });
    const DIV = document.createElement('DIV');
    DIV.innerHTML = msg.content;
    DIV.querySelector('div.card-buttons').remove();
    await ChatMessage.create({ content: DIV.innerHTML });
    let keptDamage = Math.floor(workflow.damageItem.appliedDamage / 2);
    let ditem = workflow.damageItem;
    if (ditem.oldTempHP > 0) {
      if (keptDamage > ditem.oldTempHP) {
        ditem.newTempHP = 0;
        keptDamage -= ditem.oldTempHP;
        ditem.tempDamage = ditem.oldTempHP;
      } else {
        ditem.newTempHP = ditem.oldTempHP - keptDamage;
        ditem.tempDamage = keptDamage;
        keptDamage = 0;
      }
    }
    let maxHP = args[0].options.token.actor.system.attributes.hp.max;
    ditem.hpDamage = Math.clamped(keptDamage, 0, maxHP);
    ditem.newHP = Math.clamped(ditem.oldHP - keptDamage, 0, maxHP);
    ditem.appliedDamage = keptDamage;
  }

  if (args[0].macroPass === 'preTargetSave' && workflow.actor.name === 'Trap') {
    const imgPropName = game.version < 12 ? 'icon' : 'img';
    const effectData = {
      changes: [
        {
          key: 'flags.midi-qol.advantage.ability.save.all',
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: 1,
        },
      ],
      name: `${item.name}: preTargetSave`,
      [imgPropName]: `${item.img}`,
      flags: { dae: { specialDuration: ['isSave'], stackable: 'noneName' } },
    };
    await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
  }
}

;// CONCATENATED MODULE: ./scripts/automations/features/flamesOfPhlegethos.js
// ##################################################################################################
// Read First!!!!
// Rerolls ones on fire damage spells. It also adds a flame effect that sheds light on the caster when
// a spell with fire damage is cast and an aura effect that allows to damage any creature within 5' hitting him
// with a melee attack.
// v2.2.0
// Author: Elwin#1410
// Dependencies:
//  - DAE
//  - Times Up
//  - MidiQOL "on use" item macro [postDamageRoll][isDamaged]
//  - Active Token Effects
//  - Elwin Helpers world script
//  - Token Magic FX (optional)
//  - Dice So Nice (optional)
//
// How to configure:
// The item details must be:
//   - Feature Type: Feat
//   - Activation cost: (empty)
//   - Action type: (empty)
// The Feature Midi-QOL must be:
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - This item macro code must be added to the DIME code of this feat.
// One effect must also be added:
//   - Flames of Phlegethos:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,postDamageRoll
//
// Usage:
// This is a passive feat, it will trigger when the requirements for the different effects are met.
//
// Description:
// In the postDamageRoll (OnUse) phase:
//   If item used is a spell and inflicts fire damage, the user will be prompted if he wants to reroll
//   any ones and if he wants to activate the flames. The ones are rerolled if the user
//   said yes and an active effect is added, if the user said yes to active the flames, it adds an effect
//   to shed light and if Token Magic FX is active, it will also add a flame effect. An onuse macro is also
//   registered on the isDamaged event. This will cause this macro to be called when a creature damages the
//   caster.
// In the isDamaged (TargetOnUse) (in attacker's workflow):
//   If it was a melee attack and the attacker that damaged the caster is within 5' of him,
//   a midi-qol.RollComplete hook it registered to use a temporary item on the target's player.
// In the midi-qol.RollComplete hook (in attacker's workflow )
//   Excecutes the temporary item use on the target's player to apply the reactive damage to the attacker.
//   Note: This is done, to not interfere with other effects the attack could have.
// ###################################################################################################

async function flamesOfPhlegethos({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the item
  const DEFAULT_ITEM_NAME = 'Flames of Phlegethos';
  // Set to false to remove debug logging
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;
  // Normally should be one, but for test purpose can be set to an higher value
  const rerollNumber = 1;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.0'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'times-up', 'midi-qol', 'ATL'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }
  if (args[0].tag === 'OnUse' && args[0].macroPass === 'postDamageRoll') {
    if (
      scope.rolledItem?.type !== 'spell' ||
      !(workflow.damageRolls?.length ?? workflow.damageRoll)
    ) {
      // Only works on spell with damage rolls
      return;
    }
    // TODO check also for other dmg?
    const fireDmg = scope.rolledItem?.system.damage?.parts.some(
      ([formula, type]) => type === 'fire' || formula?.includes('[fire]')
    );
    if (!fireDmg) {
      // Spell must do fire damage to trigger effect
      return;
    }

    // TODO simplify when support for dnd5e 2.4.1 is removed
    const fireLabel =
      CONFIG.DND5E.damageTypes['fire'].label ??
      CONFIG.DND5E.damageTypes['fire'];
    let damageRolls = workflow.damageRolls ?? [workflow.damageRoll];
    const diceToReroll = damageRolls
      .map((roll) =>
        roll.dice.map((die) => ({ type: roll.options?.type, die }))
      )
      .flat()
      .filter(
        (data) =>
          ['fire', fireLabel].includes(
            data.die.options?.flavor || data.type || workflow.defaultDamageType
          ) &&
          data.die.results.some((r) => r.active && r.result <= rerollNumber)
      )
      .map((d) => d.die);

    const { activateFlames, rerollDice } =
      await promptActivateFlamesAndOrRerollDice(
        scope.macroItem,
        diceToReroll,
        rerollNumber
      );
    if (debug) {
      console.warn(`${DEFAULT_ITEM_NAME} | Activation prompt responses`, {
        activateFlames,
        rerollDice,
        diceToReroll,
      });
    }

    if (rerollDice && diceToReroll.length > 0) {
      diceToReroll.forEach((die) => die.reroll(`r<=${rerollNumber}`));
      if (debug) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | Rerolled damage dice`,
          diceToReroll
        );
      }
      // setDamageRoll only needed for dndv3 2.4.1.
      if (!workflow.setDamageRolls) {
        await workflow.setDamageRoll(workflow.damageRoll);
      }
      await rollNewDice(diceToReroll);
    }

    if (activateFlames) {
      // Add active effect for aura (for reactive damage) and flames effects
      const flamesEffectData = getFlamesEffectData(scope.macroItem);

      // Delete the effect if it already exists before reapplying it
      await actor.effects.getName(flamesEffectData.name)?.delete();

      // FIXME we need to wait after delete and create, there seem to be a race condition between ATL and Token Magic FX and/or DAE.
      // Otherwise, ATL receives the new create event before the delete event...
      await wait(5);

      await actor.createEmbeddedDocuments('ActiveEffect', [flamesEffectData]);
      const message = `<p><strong>${
        scope.macroItem.name
      }</strong> - ${elwinHelpers.getTokenName(
        token
      )} is wreathed in flames</p>`;
      MidiQOL.addUndoChatMessage(
        await ChatMessage.create({
          content: message,
          whisper: ChatMessage.getWhisperRecipients('GM').map((u) => u.id),
        })
      );
    }
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'isDamaged'
  ) {
    if (!['mwak', 'msak'].includes(scope.rolledItem?.system?.actionType)) {
      // Not a melee attack...
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | Not a melee attack`);
      }
      return;
    }

    const targetToken = workflow.token;

    if (
      !actor ||
      !token ||
      !targetToken ||
      workflow.actorUuid === scope.macroItem?.parent.uuid
    ) {
      // Missing info or attacker is the owner of the feat...
      console.warn(
        `${DEFAULT_ITEM_NAME} | Missing info or attacker hits himself`,
        actor,
        token,
        targetToken,
        scope.macroItem
      );
      return;
    }
    const dist = MidiQOL.computeDistance(token, targetToken, true);
    if (dist < 0 || dist > 5) {
      // Attacker farther than 5'
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | Attacker is farther than 5'`);
      }
      return;
    }

    const featData = {
      type: 'feat',
      name: `${scope.macroItem.name} - Reactive Damage`,
      img: scope.macroItem.img,
      system: {
        actionType: 'other',
        damage: { parts: [['1d4[fire]', 'fire']] },
        target: { type: 'creature', value: 1 },
      },
    };
    const feat = new CONFIG.Item.documentClass(featData, {
      parent: actor,
      temporary: true,
    });

    const options = {
      targetUuids: [workflow.tokenUuid],
      configureDialog: false,
      workflowOptions: { fastForwardDamage: true, targetConfirmation: 'none' },
    };

    // If the target is associated to a GM user roll item in this client, otherwise send the item roll to user's client
    let player = MidiQOL.playerForActor(actor);
    if (!player?.active) {
      // Find first active GM player
      player = game.users?.activeGM;
    }
    if (!player) {
      console.error(
        `${DEFAULT_ITEM_NAME} | Could not find player for actor ${actor}`
      );
      return;
    }

    if (player?.isGM) {
      options.workflowOptions.autoRollDamage = 'always';
    }
    const data = {
      itemData: feat.toObject(),
      actorUuid: actor.uuid,
      targetUuids: options.targetUuids,
      options,
    };

    // Register hook to call retribution damage after roll is complete
    Hooks.once(
      `midi-qol.RollComplete.${workflow.itemUuid}`,
      async (currentWorkflow) => {
        if (
          !elwinHelpers.isMidiHookStillValid(
            DEFAULT_ITEM_NAME,
            'midi-qol.RollComplete',
            feat.name,
            workflow,
            currentWorkflow,
            debug
          )
        ) {
          return;
        }
        await MidiQOL.socket().executeAsUser(
          'completeItemUse',
          player.id,
          data
        );
      }
    );
  }

  /**
   * Prompts the user of the token if he wants to activate the flames and/or reroll dice.
   *
   * @param {Item5e} sourceItem the feat item.
   * @param {Dice[]} diceToReroll array of dice that needs to be rerolled.
   * @param {number} rerollNumber the number limit up to when the dice are rerolled.
   * @returns an array of two booleans, the first for the flame activation, the second for the dice reroll.
   */
  async function promptActivateFlamesAndOrRerollDice(
    sourceItem,
    diceToReroll,
    rerollNumber
  ) {
    let choices = `<div class="form-group"><label class="checkbox"><input type="checkbox" name="activate" checked/>Activate flames</label></div>`;
    if (diceToReroll.length > 0) {
      choices += `<div class="form-group"><label class="checkbox"><input type="checkbox" name="reroll" checked/>Reroll ${rerollNumber}s${
        rerollNumber !== 1 ? ' and lower' : ''
      }</label></div>`;
    }
    const content = `
  <form id="activate-flame-reroll-form">
    ${choices}
  </form>
  `;
    const choiceDialog = new Promise((resolve) => {
      new Dialog(
        {
          title: `${sourceItem.name}`,
          content,
          buttons: {
            ok: {
              label: 'Ok',
              callback: (html) =>
                resolve({
                  activateFlames: html.find('[name=activate]:checked')[0]
                    ?.value,
                  rerollDice: html.find('[name=reroll]:checked')[0]?.value,
                }),
            },
            cancel: {
              label: 'Cancel',
              callback: (html) => resolve({}),
            },
          },
        },
        { classes: ['dnd5e', 'dialog'] }
      ).render(true);
    });
    return await choiceDialog;
  }

  /**
   * Reroll dice for which result were lower or equal to the specified rerollNumber.
   * If DSN is enabled, also show the rerolled dice with DSN.
   *
   * @param {Dice} dice the dice to reroll.
   */
  async function rollNewDice(dice) {
    let terms = [];
    dice.forEach((die) => {
      let dieJson = die.toJSON();
      // Only keep last nb results (the new results of the rerolled ones)
      const rerolledResults = die.results.filter((result) => result.rerolled);
      dieJson.results = dieJson.results.slice(
        dieJson.results.length - rerolledResults.length
      );
      foundry.utils.setProperty(dieJson, 'options.flavor', 'fire');
      // Add dummy + operator if we want to roll multiple dice
      if (terms.length > 0) {
        const operatorTerm = new OperatorTerm({ operator: '+' }).evaluate();
        terms.push(operatorTerm);
      }
      terms.push(new Die(dieJson));
    });

    const rerolledResult = Roll.fromTerms(terms);
    if (debug) {
      console.warn(`${DEFAULT_ITEM_NAME} | Rerolled dice`, rerolledResult);
    }
    MidiQOL.displayDSNForRoll(rerolledResult, 'damageRoll');
  }

  /**
   * Returns the effect data for the light and Token Magic FX flames.
   *
   * @param {Item5e} sourceItem the feat item.
   *
   * @returns {object} the active effect data for the light and Token Magic FX flames.
   */
  function getFlamesEffectData(sourceItem) {
    const imgPropName = game.release.generation >= 12 ? 'img' : 'icon';
    const flamesEffectData = {
      changes: [
        {
          key: 'flags.midi-qol.onUseMacroName',
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: `ItemMacro.${sourceItem.uuid},isDamaged`,
          priority: '20',
        },
        {
          key: 'ATL.light.dim',
          mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
          value: '60',
          priority: '20',
        },
        {
          key: 'ATL.light.bright',
          mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
          value: '30',
          priority: '20',
        },
        {
          key: 'ATL.light.animation.type',
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: 'torch',
          priority: '20',
        },
        {
          key: 'ATL.light.animation.speed',
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: 1,
          priority: '20',
        },
        {
          key: 'ATL.light.animation.intensity',
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: 1,
          priority: '20',
        },
        {
          key: 'ATL.light.color',
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: '#a2642a',
          priority: '20',
        },
        {
          key: 'ATL.light.alpha',
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: 0.7,
          priority: '20',
        },
      ],
      duration: {
        rounds: 1,
        turns: 1,
      },
      [imgPropName]: sourceItem.img,
      name: `${sourceItem.name} - Flames`,
      origin: sourceItem.uuid,
      transfer: false,
      flags: {
        dae: {
          specialDuration: ['turnEndSource'],
        },
      },
    };

    if (game.modules.get('tokenmagic')?.active) {
      flamesEffectData.changes.push({
        key: 'macro.tokenMagic',
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: 'fire',
        priority: '20',
      });
    }

    return flamesEffectData;
  }

  /**
   * Wait for the specified number of milliseconds.
   *
   * @param {number} ms number of ms to wait.
   */
  async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

;// CONCATENATED MODULE: ./scripts/automations/features/giftOfTheMetallicDragon.js
// ##################################################################################################
// Author: Elwin#1410
// Read First!!!!
// Adds a third party reaction active effect, that effect will trigger a reaction by the owner of the feat
// when himself or a creature within range is hit to allow him to add an AC bonus that could
// turn the hit into a miss.
// v3.1.0
// Dependencies:
//  - DAE
//  - MidiQOL "on use" actor macro [preTargeting][tpr.isHit]
//  - Elwin Helpers world script
//
// How to configure:
// The Feature details must be:
//   - Feature Type: Feat
//   - Activation cost: 1 Reaction
//   - Target: 1 Ally (RAW it's Creature, but use Ally to trigger reaction only on allies)
//   - Range: 5 feet
//   - Limited Uses: 1 of @prof per Long Rest
//   - Uses Prompt: checked
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - No Full cover: (checked)
//   - Activation Conditions
//     - Reaction:
//       reaction === "tpr.isHit" && !workflow.isCritical
//   - This item macro code must be added to the DIME code of this feat.
// Two effects must also be added:
//   - Gift of the Metallic Dragon:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,tpr.isHit|canSee=true;post=true
//   - Gift of the Metallic Dragon - AC Bonus:
//      - Transfer Effect to Actor on ItemEquip (unchecked)
//      - Duration: 1 Turn
//      - Special Duration: Is Attacked
//      - Effects:
//          - system.attributes.ac.bonus | Add | +@prof
//
// Usage:
// This item has a passive effect that adds a third party reaction active effect.
// It is also a reaction item that gets triggered by the third party reaction effect when appropriate.
//
// Description:
// In the preTargeting (item OnUse) phase of the Gift of the Metallic Dragon item (in owner's workflow):
//   Validates that item was triggered by the remote tpr.isHit target on use,
//   otherwise the item workflow execution is aborted.
// In the tpr.isHit (TargetOnUse) post macro (in attacker's workflow) (on owner or other target):
//   If the reaction was used and completed successfully, the current workflow check hits it re-executed to
//   taken into account the AC bonus and validate if the attack is still a hit.
// ###################################################################################################

async function giftOfTheMetallicDragon({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = 'Gift of the Metallic Dragon';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.2'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    return handleOnUsePreTargeting(workflow, scope.macroItem);
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isHit.post'
  ) {
    if (!token) {
      // No target
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No target token.`);
      }
      return;
    }
    // Other target, handle reaction
    await handleTargetOnUseIsHitPost(
      workflow,
      token,
      scope.macroItem,
      options?.thirdPartyReactionResult
    );
  }

  /**
   * Handles the preTargeting phase of the Gift of the Metallic Dragon item.
   * Validates that the reaction was triggered by the tpr.isHit phase.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Gift of the Metallic Dragon item.
   *
   * @returns {boolean} true if all requirements are fulfilled, false otherwise.
   */
  function handleOnUsePreTargeting(currentWorkflow, sourceItem) {
    if (
      currentWorkflow.options?.thirdPartyReaction?.trigger !== 'tpr.isHit' ||
      !currentWorkflow.options?.thirdPartyReaction?.itemUuids?.includes(
        sourceItem.uuid
      )
    ) {
      // Reaction should only be triggered by third party reaction effect
      const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature or the owner is hit.`;
      ui.notifications.warn(msg);
      return false;
    }
    return true;
  }

  /**
   * Handles the tpr.isHit post reaction of the Gift of the Metallic Dragon item in the triggering midi-qol workflow.
   * If the reaction was used and completed successfully, adds an AC bonus which could convert a hit on the target into a miss.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Token5e} targetToken - The target token that is hit.
   * @param {Item5e} sourceItem - The Gift of the Metallic Dragon item.
   * @param {object} thirdPartyReactionResult - The third party reaction result.
   */
  async function handleTargetOnUseIsHitPost(
    currentWorkflow,
    targetToken,
    sourceItem,
    thirdPartyReactionResult
  ) {
    if (debug) {
      console.warn(DEFAULT_ITEM_NAME + ' | reaction result', {
        thirdPartyReactionResult,
      });
    }
    if (thirdPartyReactionResult?.uuid !== sourceItem.uuid) {
      return;
    }

    const sourceActor = sourceItem.actor;

    if (!sourceActor || !targetToken) {
      console.error(
        `${DEFAULT_ITEM_NAME} | Missing sourceActor or targetToken`,
        { sourceActor, targetToken }
      );
      return;
    }

    const sourceToken = MidiQOL.tokenForActor(sourceActor);
    if (!sourceToken) {
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No source token could be found.`);
      }
      return;
    }

    // Recompute checkHits to take into account the AC bonus
    // TODO remove noOnuseMacro when dnd v2.4.1 support is removed
    currentWorkflow.checkHits({
      noProvokeReaction: true,
      noOnuseMacro: true,
      noOnUseMacro: true,
      noTargetOnuseMacro: true,
    });
  }
}

;// CONCATENATED MODULE: ./scripts/automations/features/greatWeaponMaster.js
// ##################################################################################################
// Read First!!!!
// Handles the ability to toggle on/off or prompt the -5 penalty to hit and +10 bonus to the damage on a
// heavy weapon melee attack. Note: it supports checking for melee weapon attack with a thrown property.
// v2.2.0
// Author: Elwin#1410
// Dependencies:
//  - DAE
//  - Times Up
//  - MidiQOL "on use" item macro [preItemRoll],[preAttackRoll]
//  - Elwin Helpers world script
//
// How to configure:
// The item details must be:
//   - Feature Type: Feat
//   - Activation Cost: None
//   - Target: Self
//   - Range: Self
//   - Action type: (empty)
// The Feature Midi-QOL must be:
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - Don't Apply Convenient Effect (checked)
//   - Midi-qol Item Properties:
//     - Toggle effect (checked to toggle the feature on/off when using it, unchecked to be prompted to use the feature when the condition are met)
//   - This item macro code must be added to the DIME code of this feat.
// One effect must also be added:
//   - Great Weapon Master:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,preItemRoll
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,preAttackRoll
//
// Usage:
// This is a feat that can be toggled on or off, when the midi property "Toggle effect" is checked, when unchecked, a dialog to activate the feature
// will be prompted on attacks that meet the requirements. If the attack is a melee attack from a heavy weapon for which
// the attacker is proficient and toggled on or the prompt to activate was accepted,
// an effect to give -5 penalty to hit and a +10 bonus to damage is granted for this attack.
//
// Description:
// In the preItemRoll (OnUse) phase (on any item):
//   If the midi toggle effect property is checked:
//     If the used item is this feat, toggle the effect, else set to prompt to not activate on attack.
//   Else:
//     Set to prompt to activate on attack.
// In the preAttackRoll (OnUse) phase (on any item):
//   Validates that the item used has the heavy property, that the attack is a melee weapon attack and the actor is proficient with it,
//   If the feat "Toggle effect" is unchecked a dialog is prompted to activate the feat on this attack.
//   If the feat is toggled on or the activation has been accepted, it adds an AE to give -5 penaly to melee weapon attack and
//   +10 bonus to damage from a melee weapon attack.
//   This AE only last for one attack.
//   Note: if the weapon has the thrown property, the distance to the target must be less than or equal to 5 ft
//   (10 ft if the weapon has reach property) to be considered a melee weapon attack.
// ###################################################################################################

async function greatWeaponMaster({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the item
  const DEFAULT_ITEM_NAME = 'Great Weapon Master';
  const MODULE_ID = 'midi-item-showcase-community';
  // Set to false to remove debug logging
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;
  const OFF_STATE = 0;
  const ON_STATE = 1;
  const PROMPT_STATE = 2;
  const STATES = new Map([
    [ON_STATE, OFF_STATE],
    [OFF_STATE, ON_STATE],
    [PROMPT_STATE, ON_STATE],
  ]);

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.0'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'times-up', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }
  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preItemRoll') {
    const toggleEffect = foundry.utils.getProperty(
      scope.macroItem,
      'flags.midiProperties.toggleEffect'
    );
    let removeActiveEffect = false;
    if (toggleEffect) {
      const gwmState =
        scope.macroItem.getFlag(MODULE_ID, 'greatWeaponMasterState') ??
        OFF_STATE;
      if (scope.rolledItem.uuid !== scope.macroItem.uuid) {
        // Reset state to toggle off if prompt
        if (gwmState === PROMPT_STATE) {
          await scope.macroItem.setFlag(
            MODULE_ID,
            'greatWeaponMasterState',
            OFF_STATE
          );
        }
        return true;
      }
      await scope.macroItem.setFlag(
        MODULE_ID,
        'greatWeaponMasterState',
        STATES.get(gwmState)
      );
      if (STATES.get(gwmState) === ON_STATE) {
        // Add AE for toggle mode on
        await addToggledOnEffect(scope.macroItem);
      } else {
        removeActiveEffect = true;
      }
    } else {
      await scope.macroItem.setFlag(
        MODULE_ID,
        'greatWeaponMasterState',
        PROMPT_STATE
      );
      removeActiveEffect = true;
    }
    if (removeActiveEffect) {
      // Remove AE for toggle mode
      await actor.effects
        .find((ae) => ae.getFlag(MODULE_ID, 'greatWeaponMasterToggledOn'))
        ?.delete();
    }
  } else if (args[0].tag === 'OnUse' && args[0].macroPass === 'preAttackRoll') {
    if (
      scope.rolledItem?.type !== 'weapon' ||
      !elwinHelpers.hasItemProperty(scope.rolledItem, 'hvy') ||
      !scope.rolledItem?.system?.prof?.hasProficiency ||
      !elwinHelpers.isMeleeWeaponAttack(
        scope.rolledItem,
        token,
        workflow.targets.first()
      )
    ) {
      // Only works on proficient heavy melee weapon attacks
      if (debug) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | Not an heavy melee weapon attack.`
        );
      }
      return;
    }

    const gwmState = scope.macroItem.getFlag(
      MODULE_ID,
      'greatWeaponMasterState'
    );
    if (gwmState === OFF_STATE) {
      return;
    } else if (gwmState === PROMPT_STATE) {
      const activate = await Dialog.confirm({
        title: `${scope.macroItem.name} - Activation`,
        content: `<p>Use ${scope.macroItem.name}? (-5 to attack, +10 to damage)</p>`,
        rejectClode: false,
        options: { classes: ['dialog', 'dnd5e'] },
      });
      if (!activate) {
        return;
      }
    }

    // Add an AE for -5 to hit +10 dmg
    await addMalusBonusActiveEffect(scope.macroItem);
  }

  /**
   * Adds an active effect to show that the feat toggle on state is active.
   *
   * @param {Item5e} sourceItem - The Great Weapon Master item.
   */
  async function addToggledOnEffect(sourceItem) {
    // Add AE for toggle mode on
    const imgPropName = game.release.generation >= 12 ? 'img' : 'icon';
    const effectData = {
      changes: [],
      [imgPropName]: sourceItem.img,
      name: `${sourceItem.name} - Toggled On`,
      origin: sourceItem.uuid,
      transfer: false,
      flags: {
        dae: { showIcon: true },
        [MODULE_ID]: {
          greatWeaponMasterToggledOn: true,
        },
      },
    };
    await sourceItem.actor.createEmbeddedDocuments('ActiveEffect', [
      effectData,
    ]);
  }

  /**
   * Adds an active effect to add a malus to attack and bonus to damage.
   *
   * @param {Item5e} sourceItem - The Great Weapon Master item.
   */
  async function addMalusBonusActiveEffect(sourceItem) {
    // Add an AE for -5 to hit +10 dmg
    const imgPropName = game.release.generation >= 12 ? 'img' : 'icon';
    const effectData = {
      changes: [
        {
          key: 'system.bonuses.mwak.attack',
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: '-5',
          priority: '20',
        },
        {
          key: 'system.bonuses.mwak.damage',
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: '+10',
          priority: '20',
        },
      ],
      duration: {
        turns: 1,
      },
      [imgPropName]: sourceItem.img,
      name: `${sourceItem.name} - Bonus`,
      origin: sourceItem.uuid,
      transfer: false,
      flags: {
        dae: {
          specialDuration: ['1Attack'],
        },
      },
    };
    await sourceItem.actor.createEmbeddedDocuments('ActiveEffect', [
      effectData,
    ]);
  }
}

;// CONCATENATED MODULE: ./scripts/automations/features/greatWeaponMasterAttack.js
// ##################################################################################################
// Read First!!!!
// Handles the ability to make a bonus melee weapon attack when the actor scores a critical hit or brings a
// target to 0 HP with a melee weapon.
// v2.2.0
// Author: Elwin#1410
// Dependencies:
//  - DAE [on][each]
//  - Times Up
//  - MidiQOL "on use" item macro [postActiveEffects]
//  - Elwin Helpers world script
//
// How to configure:
// The item details must be:
//   - Feature Type: Feat
//   - Activation cost: 1 Bonus Action
//   - Limited Uses: 0 of 1 per Charges
//   - Uses Prompt: (checked)
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before item is rolled (*)
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - This item macro code must be added to the DIME code of this feat.
// One effect must also be added:
//   - Great Weapon Master Attack:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Duration:
//        - Macro Repeat: End of each turn
//      - Effects:
//          - macro.itemMacro | Custom |
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,postActiveEffects
//
// Usage:
// This is a passive feat and an active feat. The passive part will add a charge when the requirements are met and remove
// it at the end of the owner's turn. The active part will prompts a dialog to choose weapon with which to make the bonus attack.
// Then MidiQOL.completeItemUse is called on this item. If no target is selected and the midi settings for target confirmation
// are not active or do not trigger on 'noneTargeted', the user's is asked to confirm a target before  MidiQOL.completeItemUse is called.
//
// Description:
// In the postDamageRoll (OnUse) phase (on any item other than Greater Weapon Master Attack):
//   If item used is a melee weapon, and it was a critical or at least one target was dropped to 0 HP,
//   grants one charge to use the special bonus attack if it was not already granted.
// In the preItemRoll (OnUse) phase (on Greater Weapon Master Attack):
//   Prompts the user to select an equipped melee weapon with which to make the bonus attack.
//   If no target is selected and the midi settings for target confirmation are not active or do not trigger on 'noneTargeted',
//   the user's is asked to confirm a target.
// In the postDamageRoll (OnUse) phase (on Greater Weapon Master Attack):
//   Calls MidiQOL.completeItemUse with the selected weapon.
// ###################################################################################################

async function greatWeaponMasterAttack({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the item
  const DEFAULT_ITEM_NAME = 'Great Weapon Master Attack';
  const MODULE_ID = 'midi-item-showcase-community';
  // Set to false to remove debug logging
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.0'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'times-up', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }
  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preItemRoll') {
    const filteredWeapons = getEquippedMeleeWeapons(actor);
    if (filteredWeapons.length === 0) {
      const msg = `${DEFAULT_ITEM_NAME} | No melee weapon equipped.`;
      ui.notifications.warn(msg);
      return false;
    }

    const chosenWeaponId = actor.getFlag(
      MODULE_ID,
      'greatWeaponMaster.weaponChoiceId'
    );
    let weaponItem = filteredWeapons[0];
    if (filteredWeapons.length > 1) {
      weaponItem = await getSelectedWeapon(
        scope.macroItem,
        filteredWeapons,
        chosenWeaponId
      );
    }
    if (!weaponItem) {
      // Bonus attack was cancelled
      const msg = `${DEFAULT_ITEM_NAME} | No weapon selected for the bonus attack.`;
      ui.notifications.warn(msg);
      return false;
    }
    // Keep weapon choice for next time (used as pre-selected choice)
    await actor.setFlag(
      MODULE_ID,
      'greatWeaponMaster.weaponChoiceId',
      weaponItem.id
    );

    // Keep selected weapon in options
    workflow.options.greatWeaponMasterWeapon = weaponItem;
  } else if (
    args[0].tag === 'OnUse' &&
    args[0].macroPass === 'postActiveEffects'
  ) {
    if (scope.rolledItem?.uuid === scope.macroItem.uuid) {
      const weaponItem = workflow.options?.greatWeaponMasterWeapon;
      if (!weaponItem) {
        ui.notifications.warn(
          `${DEFAULT_ITEM_NAME}: No selected weapon for bonus attack, reallocate spent resource if needed.`
        );
        return;
      }
      // Change action cost to Special to not be take as an Attack Action
      const weaponCopy = weaponItem.toObject();
      delete weaponCopy._id;
      // Change activation type to special so it is not considered as an Attack Action
      weaponCopy.system.activation = foundry.utils.deepClone(
        weaponCopy.system.activation ?? {}
      );
      weaponCopy.system.activation.type = 'special';
      weaponCopy.system.activation.cost = null;

      const options = {
        showFullCard: false,
        createWorkflow: true,
        configureDialog: true,
        workflowOptions: { autoRollAttack: true },
      };
      const attackItem = new CONFIG.Item.documentClass(weaponCopy, {
        parent: actor,
        temporary: true,
      });

      await MidiQOL.completeItemUse(attackItem, {}, options);
    } else {
      if (
        scope.rolledItem?.type !== 'weapon' ||
        scope.rolledItem?.system?.actionType !== 'mwak'
      ) {
        // Not a melee weapon...
        if (debug) {
          console.warn(`${DEFAULT_ITEM_NAME} | Not a melee weapon.`);
        }
        return;
      }
      // Adds a charge to the bonus action if the conditions are met.
      if (actor.getFlag(MODULE_ID, 'greatWeaponMaster.bonus')) {
        // A bonus action was already granted
        return;
      }
      let allowBonusAction = workflow.isCritical;
      let reduceToZeroHp = false;
      if (!allowBonusAction && workflow.hitTargets.size > 0) {
        reduceToZeroHp = workflow.damageList?.some(
          (dmgItem) =>
            dmgItem.wasHit && dmgItem.oldHP !== 0 && dmgItem.newHP === 0
        );
        allowBonusAction = reduceToZeroHp;
      }
      if (debug) {
        console.warn(DEFAULT_ITEM_NAME, {
          allowBonusAction,
          isCritical: workflow.isCritical,
          reduceToZeroHp,
        });
      }
      if (allowBonusAction) {
        // Set one charge to the Heavy Weapon Master Attack bonus action for this turn and keep id of weapon that did it
        await scope.macroItem.update({
          'system.uses.value': 1,
        });
        await actor.setFlag(MODULE_ID, 'greatWeaponMaster', {
          bonus: true,
          weaponChoiceId: scope.rolledItem.id,
        });

        // Add chat message saying a bonus attack can be made
        const message = `<p><strong>${scope.macroItem.name}</strong> - You can make a special bonus attack.</p>`;
        MidiQOL.addUndoChatMessage(
          await ChatMessage.create({
            type:
              game.release.generation >= 12
                ? CONST.CHAT_MESSAGE_STYLES.OTHER
                : CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: message,
            speaker: ChatMessage.getSpeaker({ actor, token }),
            whisper: ChatMessage.getWhisperRecipients('GM').map((u) => u.id),
          })
        );
      }
    }
  } else if (args[0] === 'on') {
    // Clear item state when first applied
    await item.update({ 'system.uses.value': 0 });
  } else if (args[0] === 'each') {
    // Reset the Heavy Weapon Master Attack bonus action to 0 charge
    if (
      item.system?.uses?.value > 0 ||
      foundry.utils.getProperty(
        actor,
        `flags.${MODULE_ID}.greatWeaponMaster.bonus`
      )
    ) {
      await item.update({ 'system.uses.value': 0 });
      await actor.setFlag(MODULE_ID, 'greatWeaponMaster.bonus', false);
    }
  }

  /**
   * Returns a list of equipped melee weapons for the specified actor.
   *
   * @param {Actor5e} sourceActor token actor
   * @returns {Item5e[]} list of equipped melee weapons.
   */
  function getEquippedMeleeWeapons(sourceActor) {
    return sourceActor.itemTypes.weapon.filter(
      (w) => w.system.equipped && w.system.actionType === 'mwak'
    );
  }

  /**
   * Prompts a dialog to select a weapon and returns the id of the selected weapon.
   *
   * @param {Item5e} sourceItem item for which the dialog is prompted.
   * @param {Item5e[]} weaponChoices array of weapon items from which to choose.
   * @param {string} defaultChosenWeaponId id of weapon to be selected by default.
   *
   * @returns {Item5e|null} the selected weapon.
   */
  async function getSelectedWeapon(
    sourceItem,
    weaponChoices,
    defaultChosenWeaponId
  ) {
    const defaultWeapon = weaponChoices.find(
      (i) => i.id === defaultChosenWeaponId
    );
    return elwinHelpers.ItemSelectionDialog.createDialog(
      `⚔️ ${sourceItem.name}: Choose a Weapon`,
      weaponChoices,
      defaultWeapon
    );
  }
}

;// CONCATENATED MODULE: ./scripts/automations/features/healer.js
async function healer({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (args[0].macroPass === 'preItemRoll') {
    const target = args[0].targets[0]?.actor;
    if (!target) return;
    if (target.effects.find((e) => e.name === 'Healer Feat')) {
      await ChatMessage.create(
        {
          user: game.user.id,
          content: `<b>Healer</b><br>This creature must finish a <b>short</b> or <b>long rest</b> before benefiting from the Healer feat.`,
          speaker: ChatMessage.getSpeaker({ actor: target }),
        },
        {}
      );
      return false;
    }
  }
  if (args[0].macroPass === 'postDamageRoll') {
    let damage = '0';
    const target = args[0].targets[0]?.actor;
    const macroData = args[0];
    const sourceItem = fromUuidSync(macroData.sourceItemUuid);
    const imgPropName = game.version < 12 ? 'icon' : 'img';
    const EffectData = {
      changes: [],
      duration: {
        seconds: 999999,
      },
      [imgPropName]: sourceItem.img,
      label: 'Healer Feat',
      origin: macroData.sourceItemUuid,
      transfer: false,
      flags: {
        dae: {
          stackable: 'none',
          specialDuration: ['longRest', 'shortRest'],
        },
      },
    };
    const dialog = await Dialog.wait({
      title: `${item.name}`,
      content: 'What do you want to do?',
      buttons: {
        stabilize: {
          icon: '<image src="icons/svg/regen.svg" width="30" height="30" style="border:0px">',
          label: 'Stabilize the target and heal for 1hp',
          callback: () => {
            damage = '1';
          },
        },
        healing: {
          icon: '<image src="icons/svg/heal.svg" width="30" height="30" style="border:0px">',
          label: 'Heal the target (once per short rest)',
          callback: () => {
            if (!target) return;
            const hd = target.system.details.level;
            damage = '1d6 + 4 + ' + hd;
          },
        },
      },
      default: 'stabilize',
    });

    if (damage != '1') {
      await MidiQOL.socket().executeAsGM('createEffects', {
        actorUuid: target.uuid,
        effects: [EffectData],
      });
    }
    const damageRoll = await new Roll(damage).roll({ async: true });
    workflow.setDamageRoll(damageRoll);
    return;
  }
}

;// CONCATENATED MODULE: ./scripts/automations/features/poisoner.js
// ##################################################################################################
// Read First!!!!
// Allows to create potent poison doses, to apply poisons to weapon or ammunitions a bonus action,
// to ignore poison resistance, and adds proficiency with poisoner's kit.
// v1.0.0
// Author: Elwin#1410 based on WurstKorn
// Dependencies:
//  - DAE
//  - MidiQOL "on use" item macro, [preTargeting][preItemRoll][postActiveEffects]
//  - Elwin Helpers world script
//
// How to configure:
// The feature details must be:
//   - Feature Type: Feat
//   - Activation cost: 1 Hour
//   - Target: Self
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before the item is rolled
//       ItemMacro | After Active Effects
//   - This item macro code must be added to the DIME code of this item.
// One effect must also be added:
//   - Poisoner:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,preTargeting
//          - system.tools.pois.prof | Custom | Proficient
//          - system.traits.idr.value | Add | Poison
//
// Usage:
// This is item must be used to activate its effect. It also adds active effects to give proficiency
// to Poisoner's Kit and ignore poison resistance.
//
// Description:
// In the preTargeting (actor OnUse) phase of any item (in owner's workflow):
//   If the item rolled is of system type poison and has an appliedCoating flag in an AE,
//   change it's activation to a bonus action if it's not already the case
// In the preItemRoll (item OnUse) phase of the Poisoners (in owner's workflow):
//   Validates that the owner has a Poisoner's Kit and at least 50gp in its inventory.
// In the postActiveEffects phase of the Poisoner (in owner's workflow):
//   If the owner already has a Potent Poison item in its inventory, update its quantity
///  else search for a Potent Poison item the world's items, if not found search
//   in MISC item compendium and if still not found use a default Potent Poison item data from this macro
//   and add it with the proper quantity to the owner's inventory.
//   The owner's gp amount is also reduced by the proper amount.
// ###################################################################################################

async function poisoner({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const DEFAULT_ITEM_NAME = 'Poisoner';
  const MODULE_ID = 'midi-item-showcase-community';
  const MISC_MODULE_ID = 'midi-item-showcase-community';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;
  const DEFAULT_POISONERS_KIT_NAME = "Poisoner's Kit";
  const DEFAULT_POTENT_POISON_NAME = 'Potent Poison';

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.7'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }

  const dependencies = ['dae', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    const hasAppliedCoatingValue =
      workflow.item?.system.type?.value === 'poison' &&
      workflow.item?.effects.some(
        (ae) =>
          ae.name === workflow.item?.name &&
          ae.transfer === false &&
          ae.getFlag('dae', 'dontApply') === true &&
          ae.changes.some(
            (c) => c.key === `flags.${MODULE_ID}.appliedCoating` && c.value
          )
      );
    if (!hasAppliedCoatingValue) {
      return;
    }
    if (workflow.item?.system.activation?.type === 'bonus') {
      return;
    }
    foundry.utils.setProperty(workflow.item, 'system.activation.type', 'bonus');
  } else if (args[0].tag === 'OnUse' && args[0].macroPass === 'preItemRoll') {
    if (!actor.items.getName(DEFAULT_POISONERS_KIT_NAME)) {
      ui.notifications.warn(
        `${DEFAULT_ITEM_NAME} | You need the Poisoner's Kit to create Potent Poison`
      );
      return false;
    }
    let gold = actor.system.currency?.gp ?? 0;
    if (gold < 50) {
      ui.notifications.warn(
        `${DEFAULT_ITEM_NAME} | You need at least 50gp to create ${DEFAULT_POTENT_POISON_NAME}. You have: ${gold}gp.`
      );
      return false;
    }
  } else if (
    args[0].tag === 'OnUse' &&
    args[0].macroPass === 'postActiveEffects'
  ) {
    const gold = actor.system.currency?.gp ?? 0;
    const newGold = gold - 50;
    let quantity = actor.system.attributes?.prof ?? 0;

    const potentPoisonVialItem = actor.items.find(
      (i) =>
        i.type === 'consumable' &&
        i.system.type?.value === 'poison' &&
        i.name === DEFAULT_POTENT_POISON_NAME
    );
    let potentPoisonVialItemData;
    if (potentPoisonVialItem) {
      quantity += potentPoisonVialItem.system.quantity ?? 0;
    } else {
      potentPoisonVialItemData = await findOrGetPoisonItemData();
      foundry.utils.setProperty(
        potentPoisonVialItemData,
        'system.quantity',
        quantity
      );
    }

    await actor.update({ 'system.currency.gp': newGold });
    if (potentPoisonVialItem) {
      await potentPoisonVialItem.update({ 'system.quantity': quantity });
    } else {
      await actor.createEmbeddedDocuments('Item', [potentPoisonVialItemData]);
    }
  }

  /**
   * Returns a potent posion item data, it looks first in the world's items, then in MISC item compendium,
   * if none found use a default item data from this macro.
   *
   * @returns {object} A potent poison item data.
   */
  async function findOrGetPoisonItemData() {
    // Lookup in world items
    let potentPoison = game.items.find(
      (i) =>
        i.type === 'consumable' &&
        i.system.type?.value === 'poison' &&
        i.name === DEFAULT_POTENT_POISON_NAME
    );
    if (debug) {
      console.warn(
        `${DEFAULT_ITEM_NAME} | ${DEFAULT_POTENT_POISON_NAME} from world items: `,
        potentPoison
      );
    }
    // Lookup in MISC compendium
    if (!potentPoison) {
      const compendiumIndex = await game.packs
        .get(`${MISC_MODULE_ID}.misc-items`)
        .getIndex({ fields: ['type', 'name', 'system.type'] });
      const potentPoisonUuid = compendiumIndex.find(
        (id) =>
          id.type === 'consumable' &&
          id.system.type?.value === 'poison' &&
          id.name === DEFAULT_POTENT_POISON_NAME
      )?.uuid;
      if (potentPoisonUuid) {
        potentPoison = await fromUuid(potentPoisonUuid);
      }
      if (debug) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | ${DEFAULT_POTENT_POISON_NAME} from MISC compendium: `,
          potentPoison
        );
      }
    }
    if (potentPoison) {
      return potentPoison.toObject();
    }
    return getPotentPoisonItemData();
  }

  /**
   * Return the default potent poison item data.
   * @returns {object} The default potent poison item data.
   */
  function getPotentPoisonItemData() {
    return {
      name: 'Potent Poison',
      type: 'consumable',
      system: {
        description: {
          value:
            '<em>Replace this with a proper description.</em>\n<details>\n<summary>Credits and Instructions</summary>\n<h2>Made by Elwin</h2>\n<h3>Requires:</h3>\n<ul>\n   <li>Times-up</li>\n   <li>Warp Gate (dnd5e < v3.2)</li>\n   <li>Elwin Helpers (Enable in Settings)</li>\n</ul>\n<h3>Optionals:</h3>\n<ul>\n   <li>Ammo Tracker</li>\n</ul>\n<p><strong>Usage:</strong></p>\n<p>This item must be used to activate its effect. It applies an enchantment (or a mutation for dnd5e < v3.2) that applies a poison coating on the selected weapon or ammunition.</p></details>\n',
          chat: '',
        },
        source: {
          custom: '',
          book: "Tasha's Cauldron of Everything",
          page: 'pg. 80',
          license: '',
        },
        quantity: 1,
        weight: 0,
        price: { value: 100, denomination: 'gp' },
        identified: true,
        activation: { type: 'action', cost: 1 },
        duration: { value: '1', units: 'minute' },
        target: { type: 'self' },
        uses: {
          value: 1,
          max: '1',
          per: 'charges',
          recovery: '',
          autoDestroy: true,
          prompt: true,
        },
        unidentified: { description: 'Gear' },
        type: { value: 'poison', subtype: 'injury' },
      },
      flags: {
        'midi-qol': {
          onUseMacroName:
            '[preItemRoll]function.elwinHelpers.disableManualEnchantmentPlacingOnUsePreItemRoll,[postActiveEffects]function.elwinHelpers.coating.handleCoatingItemOnUsePostActiveEffects',
        },
      },
      effects: [
        {
          icon: 'icons/consumables/potions/potion-tube-corked-orange.webp',
          name: 'Potent Poison',
          changes: [
            {
              key: 'flags.midi-item-showcase-community.appliedCoating',
              mode: 5,
              value:
                '{\n  "damage": {\n    "formula": "2d8",\n    "type": "poison"\n  },\n  "save": {\n    "dc": 14\n  },\n  "effect": {\n    "statuses": ["poisoned"],\n    "duration": {"rounds": 1, "turns": 1},\n    "specialDurations": ["turnEndSource"]\n  }\n}',
              priority: 20,
            },
          ],
          transfer: false,
        },
      ],
      img: 'icons/consumables/potions/potion-tube-corked-orange.webp',
    };
  }
}

;// CONCATENATED MODULE: ./scripts/automations/features/squireOfSolamniaPreciseStrike.js
async function squireOfSolamniaPreciseStrike({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  async function refundUse(sourceActor, effectItem) {
    if (effectItem.system.uses?.value < effectItem.system.uses?.max) {
      const newValue = effectItem.system.uses.value + 1;
      const updateData = {
        _id: effectItem._id,
        system: { uses: { value: newValue } },
      };
      await sourceActor.updateEmbeddedDocuments('Item', [updateData]);

      console.log(
        'Attacked missed! refunding resource as per feature rules.',
        updateData
      );
      await ChatMessage.create(
        {
          user: game.user.id,
          content: `<b>${effectItem.name}</b><br>Attacked missed! Refunding use.`,
          speaker: ChatMessage.getSpeaker({ actor: sourceActor }),
        },
        {}
      );
    }
  }

  if (args[0] === 'off') {
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    const itemM = scope.macroItem;
    if (itemM) {
      if (!itemM.getFlag('midi-item-showcase-community', 'preciseStrikeHit')) {
        await refundUse(workflow.actor, itemM);
      }
    }
    return;
  } else if (args[0].tag === 'DamageBonus') {
    try {
      const effectItem = await fromUuid(args[0].sourceItemUuid);
      if (args[0].hitTargets.length === 0) {
        return {};
      } else {
        await effectItem.setFlag('midi-item-showcase-community', 'preciseStrikeHit', true);
        return {
          damageRoll: new CONFIG.Dice.DamageRoll(
            '1d8',
            {},
            { critical: workflow.isCritical || workflow.rollOptions.critical }
          ).formula,
          flavor: 'Precision Strike',
        };
      }
    } catch (err) {
      console.error(
        `${args[0].itemData.name} - Squire of Solamnia: Precise Strike`,
        err
      );
    }
  }
  if (
    args[0].macroPass === 'postAttackRoll' &&
    actor.effects.find(
      (e) =>
        e.name.includes('Squire of Solamnia: Precise Strike') &&
        args[0].hitTargets.length === 0
    )
  ) {
    await refundUse(workflow.actor, scope.macroItem);
  }
}

;// CONCATENATED MODULE: ./scripts/automations/features/inspiringLeader.js
async function inspiringLeader({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  game.user.updateTokenTargets(
    workflow.targets
      .filter(
        (t) =>
          !t.actor.appliedEffects.some((e) => e.name === `Inspiring Leader`)
      )
      .map((i) => i.id)
  );
}

;// CONCATENATED MODULE: ./scripts/automations/features/sharpshooter.js
// ##################################################################################################
// Read First!!!!
// Handles the ability to toggle on/off or prompt the -5 penalty to hit and +10 bonus to the damage on a ranged weapon.
// v2.1.0
// Author: Elwin#1410 based on MotoMoto and Michael version
// Dependencies:
//  - DAE
//  - MidiQOL "on use" item macro [preItemRoll],[preAttackRoll]
//
// The item details must be:
//   - Feature Type: Feat
//   - Activation Cost: None
//   - Target: Self
//   - Range: Self
//   - Action type: (empty)
// The Feature Midi-QOL must be:
//   - Don't Apply Convenient Effect (checked)
//   - Midi-qol Item Properties:
//     - Toggle effect (checked to toggle the feature on/off when using it, unchecked to be prompted to use the feature when the condition are met)
//   - This item macro code must be added to the DIME code of this feat.
// One effect must also be added:
//   - Sharpshooter:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.sharpShooter | Custom | 1
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,preItemRoll
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,preAttackRoll
//
// Usage:
// This is a feat that can be toggled on or off, when the midi property "Toggle effect" is checked, when unchecked, a dialog to activate the feature
// will be prompted on attacks that meet the requirements. If the attack is from a ranged weapon for which the attacker is proficient
// and toggled on or the prompt to activate was accepted, an effect to give -5 penalty to hit and a +10 bonus to damage is granted for this attack.
//
// Description:
// In the preItemRoll (OnUse) phase (on any item):
//   If the midi toggle effect property is checked:
//     If the used item is this feat, toggle the effect, else set to prompt to not activate on attack.
//   Else:
//     Set to prompt to activate on attack.
// In the preAttackRoll (OnUse) phase (on any item):
//   If the item is a ranged weapon and the actor is proficient with it,
//   it adds an AE to give -5 penaly to ranged weapon attack and +10 bonus to damage from a ranged weapon attack.
//   This AE only last for one attack.
// ###################################################################################################

async function sharpshooter({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the item
  const DEFAULT_ITEM_NAME = 'Sharpshooter';
  const MODULE_ID = 'midi-item-showcase-community';
  // Set to false to remove debug logging
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;
  const OFF_STATE = 0;
  const ON_STATE = 1;
  const PROMPT_STATE = 2;
  const STATES = new Map([
    [ON_STATE, OFF_STATE],
    [OFF_STATE, ON_STATE],
    [PROMPT_STATE, ON_STATE],
  ]);

  const dependencies = ['dae', 'midi-qol'];
  if (!requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  /**
   * If the requirements are met, returns true, false otherwise.
   *
   * @param {string} name - The name of the item for which to check the dependencies.
   * @param {string[]} dependencies - The array of module ids which are required.
   *
   * @returns {boolean} true if the requirements are met, false otherwise.
   */
  function requirementsSatisfied(name, dependencies) {
    let missingDep = false;
    dependencies.forEach((dep) => {
      if (!game.modules.get(dep)?.active) {
        const errorMsg = `${name} | ${dep} must be installed and active.`;
        ui.notifications.error(errorMsg);
        console.warn(errorMsg);
        missingDep = true;
      }
    });
    return !missingDep;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }
  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preItemRoll') {
    const toggleEffect = foundry.utils.getProperty(
      scope.macroItem,
      'flags.midiProperties.toggleEffect'
    );
    let removeActiveEffect = false;
    if (toggleEffect) {
      const gwmState =
        scope.macroItem.getFlag(MODULE_ID, 'sharpshooterState') ?? OFF_STATE;
      if (scope.rolledItem.uuid !== scope.macroItem.uuid) {
        // Reset state to toggle off if prompt
        if (gwmState === PROMPT_STATE) {
          await scope.macroItem.setFlag(
            MODULE_ID,
            'sharpshooterState',
            OFF_STATE
          );
        }
        return true;
      }
      await scope.macroItem.setFlag(
        MODULE_ID,
        'sharpshooterState',
        STATES.get(gwmState)
      );
      if (STATES.get(gwmState) === ON_STATE) {
        // Add AE for toggle mode on
        await addToggledOnEffect(scope.macroItem);
      } else {
        removeActiveEffect = true;
      }
    } else {
      await scope.macroItem.setFlag(
        MODULE_ID,
        'sharpshooterState',
        PROMPT_STATE
      );
      removeActiveEffect = true;
    }
    if (removeActiveEffect) {
      // Remove AE for toggle mode
      await actor.effects
        .find((ae) => ae.getFlag(MODULE_ID, 'sharpshooterToggledOn'))
        ?.delete();
    }
  } else if (args[0].tag === 'OnUse' && args[0].macroPass === 'preAttackRoll') {
    if (
      scope.rolledItem?.type !== 'weapon' ||
      scope.rolledItem?.system?.actionType !== 'rwak' ||
      !scope.rolledItem?.system?.prof?.hasProficiency
    ) {
      // Only works on proficient ranged weapons
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | Not a ranged weapon.`);
      }
      return;
    }

    const sharpshooterState = scope.macroItem.getFlag(
      MODULE_ID,
      'sharpshooterState'
    );
    if (sharpshooterState === OFF_STATE) {
      return;
    } else if (sharpshooterState === PROMPT_STATE) {
      const activate = await Dialog.confirm({
        title: `${scope.macroItem.name} - Activation`,
        content: `<p>Use ${scope.macroItem.name}? (-5 to attack, +10 to damage)</p>`,
        rejectClode: false,
        options: { classes: ['dialog', 'dnd5e'] },
      });
      if (!activate) {
        return;
      }
    }

    // Add an AE for -5 to hit +10 dmg
    await addMalusBonusActiveEffect(scope.macroItem);
  }

  /**
   * Adds an active effect to show that the feat toggle on state is active.
   *
   * @param {Item5e} sourceItem - The Sharpshooter item.
   */
  async function addToggledOnEffect(sourceItem) {
    // Add AE for toggle mode on
    const imgPropName = game.release.generation >= 12 ? 'img' : 'icon';
    const effectData = {
      changes: [],
      [imgPropName]: sourceItem.img,
      name: `${sourceItem.name} - Toggled On`,
      origin: sourceItem.uuid,
      transfer: false,
      flags: {
        dae: { showIcon: true },
        [MODULE_ID]: {
          sharpshooterToggledOn: true,
        },
      },
    };
    await sourceItem.actor.createEmbeddedDocuments('ActiveEffect', [
      effectData,
    ]);
  }

  /**
   * Adds an active effect to add a malus to attack and bonus to damage.
   *
   * @param {Item5e} sourceItem - The Sharpshooter item.
   */
  async function addMalusBonusActiveEffect(sourceItem) {
    // Add an AE for -5 to hit +10 dmg
    const imgPropName = game.release.generation >= 12 ? 'img' : 'icon';
    const effectData = {
      changes: [
        {
          key: 'system.bonuses.rwak.attack',
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: '-5',
          priority: '20',
        },
        {
          key: 'system.bonuses.rwak.damage',
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: '+10',
          priority: '20',
        },
      ],
      duration: {
        turns: 1,
      },
      [imgPropName]: sourceItem.img,
      name: `${sourceItem.name} - Bonus`,
      origin: sourceItem.uuid,
      transfer: false,
      flags: {
        dae: {
          specialDuration: ['1Attack'],
        },
      },
    };
    await sourceItem.actor.createEmbeddedDocuments('ActiveEffect', [
      effectData,
    ]);
  }
}

;// CONCATENATED MODULE: ./scripts/automations/features/piercer.js
// @bakanabaka
async function piercer({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  async function getSelection(optionsObj) {
    // Header
    let selectionList = '';
    selectionList += `<tr>`;
    selectionList += `<td></td>`;
    selectionList += `<th>Damage Die</th>`;
    selectionList += `<th>Lowest Value</th>`;
    selectionList += `</tr>`;

    // Options
    for (const damageType in optionsObj)
      for (const numFaces in optionsObj[damageType]) {
        let rollValue = optionsObj[damageType][numFaces];
        let uniqueId = `${damageType}|${numFaces}|${rollValue}`;
        selectionList += `<tr>`;
        selectionList += `<td><input type="radio" id="${uniqueId}" name="selection" value=${uniqueId}></td>`;
        selectionList += `<td style="text-align: center;">d${numFaces} ${damageType}</td>`;
        selectionList += `<td style="text-align: center;">${rollValue}</td>`;
        selectionList += `</tr>`;
      }

    const title = 'Piercer';
    const content =
      `<p>Choose up to one die to reroll.</p>` +
      `<form class="flexcol"><tbody><table width="100%">` +
      selectionList +
      `</table></tbody></form>`;

    let resolution = await new Promise((resolve) => {
      new Dialog({
        title: title,
        content: content,
        buttons: {
          select: {
            label: 'Select',
            callback: () => {
              let radios = document.getElementsByTagName('input');
              for (let radio of radios) {
                if (radio.type === 'radio' && radio.checked) {
                  resolve({ cancelled: false, selection: radio.value });
                  return;
                }
              }
              resolve({ cancelled: true, selection: undefined });
            },
          },
          cancel: {
            label: 'Cancel',
            callback: () => {
              resolve({ cancelled: true, selection: undefined });
            },
          },
        },
        default: 'Cancel',
        callback: () => {
          resolve({ cancelled: true, selection: undefined });
        },
      }).render(true);
    });

    return resolution;
  }

  async function reroll(damageRolls) {
    // Create the Minimal Roll Table
    // { type : { sides : minimumRoll } }
    let minimumRollTable = {};
    for (let damageRoll of damageRolls) {
      // we appear to be in the workflow stage that simultaneously sets the default damage for any undefined damage.
      // set it here ourselves so we don't get undefined behavior
      let attackType = damageRoll.options.type
        ? damageRoll.options.type
        : workflow.damageDetail[0].type;

      // update minimumRollTable
      let damageType = minimumRollTable[attackType] || {};
      for (let term of damageRoll.terms) {
        if (!term.results) continue; // does not contain a die roll
        let results = term.results.map((die) => die.result);
        damageType[term.faces] = Math.min(
          ...results,
          damageType[term.faces] || term.faces
        );
      }
      minimumRollTable[attackType] = damageType;
    }

    //                    Piercer
    //            Choose a Die to Reroll
    //    Damage Type   |    Die Type    | Minimum Rolled
    //  O  radiant      |       d8       |      7
    //  X  piercing     |       d8       |      2
    //  O  piercing     |       d6       |      4
    //
    //      > Select <           |       Cancel
    let option = await getSelection(minimumRollTable);
    if (option.cancelled) return false;
    let [damageType, dieFaces, dieValue] = option.selection.split('|');

    for (let i = 0; i < damageRolls.length; ++i) {
      let damageRoll = damageRolls[i];
      if (
        (damageRoll.options.type || workflow.damageDetail[0].type) != damageType
      )
        continue; // wrong damage

      for (let j = 0; j < damageRoll.terms.length; ++j) {
        let term = damageRoll.terms[j];
        if (!term.results) continue; // does not contain a die roll
        if (term.faces != Number(dieFaces)) continue; // wrong type of die
        if (!term.results.find((die) => die.result == dieValue)) continue; // couldn't find the rolled value

        for (let k = 0; k < term.results.length; ++k) {
          let dieRoll = term.results[k];
          if (dieRoll.result != dieValue) continue;
          // Roll a new die to replace old one
          const damageAmount = `1d${dieFaces}`;
          const newDamageRoll = await new Roll(damageAmount).evaluate();
          await game.dice3d?.showForRoll(newDamageRoll);

          let newDieRoll = newDamageRoll.terms[0].results[0];

          // Overwrite with new die roll
          damageRolls[i].terms[j].results[k] = newDieRoll;

          // Adjust roll damage
          const rollDelta = newDieRoll.result - dieValue;
          damageRolls[i]._total += rollDelta;

          // Set workflow damageRolls
          await workflow.setDamageRolls(damageRolls);
          return true;
        }
      }
    }

    throw Error(
      `Did the damageRolls change underneith me? Attempting to reroll a 1d${dieFaces} with value ${dieValue} but none exist.`
    );
  }

  function maximalDie(dieRolls) {
    let maximal = 0;
    for (let roll of dieRolls) {
      let dieUsed = roll.formula.split(' ').filter((op) => op.includes('d'));
      const values = dieUsed.map((die) => Number(die.split('d')[1]));
      maximal = Math.max(Math.max(...values), maximal);
    }
    return maximal;
  }

  async function preDamageRollComplete() {
    let piercingDamage = workflow.damageRolls.filter(
      (roll) => roll?.options.type == 'piercing'
    );
    if (!piercingDamage.length) return;

    // Additional damage die
    if (workflow.isCritical) {
      const damageAmount = `1d${maximalDie(workflow.damageRolls)}[piercing]`;
      const damageRoll = await new Roll(damageAmount).evaluate();
      await game.dice3d?.showForRoll(damageRoll);

      workflow.damageRolls.push(damageRoll);
      await workflow.setDamageRolls(workflow.damageRolls);
    }
  }

  async function postDamageRoll() {
    let piercingDamage = workflow.damageRolls.filter(
      (roll) => roll?.options.type == 'piercing'
    );
    if (!piercingDamage.length) return;

    if (macroUtil.combat.isSameTurn(persistentData.combat)) return;
    if (!(await reroll(workflow.damageRolls))) return;

    persistentData.combat = macroUtil.combat.getCombatInfo();
  }

  const persistentDataName = `(Piercer) - Persistent Data`;
  const defaultPersistentData = { combat: {} };
  let persistentData =
    (await DAE.getFlag(actor, persistentDataName)) || defaultPersistentData;

  const callArguments = {
    speaker: speaker,
    actor: actor,
    token: token,
    character: character,
    item: item,
    args: args,
    scope: scope,
  };
  await macroUtil.runWorkflows(callArguments, {
    preDamageRollComplete: preDamageRollComplete, // damage die additions
    postDamageRoll: postDamageRoll, // damage die replacement effect
  });

  await DAE.setFlag(actor, persistentDataName, persistentData);
}

;// CONCATENATED MODULE: ./scripts/automations/features/features.js












let features = {
  dungeonDelver: dungeonDelver,
  flamesOfPhlegethos: flamesOfPhlegethos,
  giftOfTheMetallicDragon: giftOfTheMetallicDragon,
  greatWeaponMaster: greatWeaponMaster,
  greatWeaponMasterAttack: greatWeaponMasterAttack,
  healer: healer,
  poisoner: poisoner,
  squireOfSolamniaPreciseStrike: squireOfSolamniaPreciseStrike,
  inspiringLeader: inspiringLeader,
  sharpshooter: sharpshooter,
  piercer: piercer,
};

;// CONCATENATED MODULE: ./scripts/automations/homebrew/items/allOrNothingArmor.js
async function allOrNothingArmor({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Function for parsing the damage formula and calculating maximum damage for each damage type
  function calculateMaxDamage(damageFormula) {
    // Split the formula by "+" to handle multiple damage types
    let damageParts = damageFormula.split('+').map((part) => part.trim());
    return damageParts.map((part) => {
      // Extract the dice formula and damage type
      let [diceFormula, damageType] = part.match(/(\d+d\d+)\[(.*?)\]/).slice(1);

      let diceMaxMatch = diceFormula.match(/(\d+)d(\d+)/);
      if (!diceMaxMatch) return { damage: 0, type: damageType || 'unknown' };
      let numDice = parseInt(diceMaxMatch[1]);
      let diceType = parseInt(diceMaxMatch[2]);
      let maxDiceRoll = numDice * diceType;

      return { damage: maxDiceRoll, type: damageType };
    });
  }

  // Function to retrieve and apply the correct damage multiplier for each damage type
  function applyDamageMultipliers(maxDamages, damageDetails) {
    return maxDamages.map((maxDamage) => {
      const detail = damageDetails.find(
        (detail) => detail.type === maxDamage.type
      );
      const multiplier = detail?.damageMultiplier ?? 1;
      return {
        ...maxDamage,
        damage: maxDamage.damage * multiplier, // Apply the multiplier to the damage
      };
    });
  }

  let context = args[0];
  const itemC = context.item;
  switch (context.macroPass) {
    case 'preTargetDamageApplication':
      if (
        itemC.type === 'spell' &&
        context.attackRoll === undefined &&
        context.failedSaves.length > 0 &&
        context.damageRoll != undefined
      ) {
        let maxDamages = calculateMaxDamage(context.damageRoll.formula);

        let damageDetails = context.workflow.damageItem.damageDetail[0];

        maxDamages = applyDamageMultipliers(maxDamages, damageDetails);

        context.failedSaves.forEach((tokenDocument) => {
          const token = canvas.tokens.get(tokenDocument._id);
          if (token && token.actor) {
            console.log(`${token.name} failed save.`);

            let totalAdjustedDamage = maxDamages.reduce(
              (acc, { damage }) => acc + damage,
              0
            );

            let damageItem = context.workflow.damageItem;
            damageItem.hpDamage = totalAdjustedDamage; // Applies adjusted damage to actor

            // Chat message about max damage
            let chatData = {
              user: game.user.id,
              speaker: ChatMessage.getSpeaker({ token: token.actor }),
              content: `<strong>Max Damage Applied:</strong> ${token.name} takes max damage of ${totalAdjustedDamage} from ${itemC.name}.`,
            };

            ChatMessage.create(chatData).then((message) =>
              console.log('Max damage notification sent to chat.')
            );
          }
        });
      } else {
        console.log('No failed saves detected or the item is not a spell.');
      }
      break;

    case 'preTargetSave': //Give advantage on saving throws for spells that do damage
      if (itemC.type === 'spell' && context.damageRoll != undefined) {
        context.workflow.saveDetails.advantage = true;
      }
      break;
  }
}

;// CONCATENATED MODULE: ./scripts/automations/homebrew/items/potionOfHealing.js
async function potionOfHealing({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  //Prompts to use an action to drink the whole potion (full value) or bonus action to use the die roll. Also allows throwing up to 30 ft as a regular action to apply the healing to a targeted ally.
  //Item onUse ItemMacro | Before damage is rolled

  const hasUsedBonusAction = MidiQOL.hasUsedBonusAction(actor);
  let inRange = false;
  const target = args[0].targets[0].object;
  if (MidiQOL.computeDistance(token, target) > 5) inRange = true;
  if (inRange) {
    inRange = MidiQOL.findNearby(null, token, item.system.range.value, {
      includeIncapacitated: true,
      isSeen: true,
    }).some((t) => t === target);
    if (inRange) return true;
    else {
      ui.notifications.warn(
        'You tried to throw the healing potion too far (or you cannot see the target)!'
      );
      return false;
    }
  }

  let dialog = 'action';
  if (args[0].macroPass === 'preDamageRoll' && !hasUsedBonusAction) {
    dialog = await Dialog.wait({
      title: 'Do you want to use this as an Action or a Bonus Action?',
      buttons: {
        Action: {
          label: 'Action',
          callback: () => {
            return 'action';
          },
        },
        Bonus: {
          label: 'Bonus',
          callback: () => {
            return 'bonus';
          },
        },
      },
      close: () => {
        return 'action';
      },
    });
  }
  if (dialog === 'action') {
    const imgPropName = game.version < 12 ? 'icon' : 'img';
    const effectData = {
      changes: [{ key: 'flags.midi-qol.max.damage.heal', mode: 0, value: 1 }],
      name: item.name,
      origin: item.uuid,
      [imgPropName]: item.img,
      flags: { dae: { specialDuration: ['DamageDealt'] } },
    };
    return await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
  }
  if (dialog === 'bonus') await MidiQOL.setBonusActionUsed(actor);
}

;// CONCATENATED MODULE: ./scripts/automations/homebrew/TOMB/monsters/Fulgorax/imprison.js
async function imprison({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (!workflow.hitTargets.size) return;
  let targetToken = workflow.targets.first();
  if (game.modules.get('Rideable')?.active) {
    game.Rideable.Mount([targetToken.document], workflow.token.document, {
      Grappled: true,
      MountingEffectsOverride: [workflow.item.name],
    });
  }
}

async function imprisonHealing({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (!workflow.hitTargets.size) return;
  await MidiQOL.applyTokenDamage(
    [
      {
        damage: workflow.damageDetail[0].damage,
        type: 'healing',
      },
    ],
    workflow.damageDetail[0].damage,
    new Set([token]),
    null,
    null
  );
}

;// CONCATENATED MODULE: ./scripts/automations/homebrew/TOMB/tomb.js


let tomb = {
  imprison: imprison,
  imprisonHealing: imprisonHealing,
};

;// CONCATENATED MODULE: ./scripts/automations/homebrew/FleeMortals/Monsters/HobgoblinRecruit/tacticalPositioning.js
async function tacticalPositioning({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  let isMinion = chrisPremades.helpers.findEffect(
    workflow.token.actor,
    'Minion'
  );
  if (isMinion) return;
  let nearbyMinions = chrisPremades.helpers.findNearby(
    workflow.targets.first(),
    5,
    'enemy',
    false,
    false
  );
  let count = 0;
  for (let i = 0; i < nearbyMinions.length; i++) {
    let effect = chrisPremades.helpers.findEffect(
      nearbyMinions[i].actor,
      'Minion'
    );
    if (effect) count++;
  }
  if (count == 0) return;
  ChatMessage.create({
    content: `${token.name} gains a +${count} bonus from nearby minions.`,
  });
  let updatedRoll = await chrisPremades.helpers.addToRoll(
    workflow.attackRoll,
    count
  );
  workflow.setAttackRoll(updatedRoll);
}

;// CONCATENATED MODULE: ./scripts/automations/homebrew/FleeMortals/Monsters/HobgoblinRecruit/infernalIchor.js
async function infernalIchor({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
}) {
  let target = workflow.targets.first();
  let hp = target.actor.system.attributes.hp;
  let damage = workflow.damageItem.hpDamage;
  let distance = chrisPremades.helpers.getDistance(workflow.tolken, target);
  if (distance > 5) return;
  if (hp.value > damage) return;
  let effect = chrisPremades.helpers.findEffect(target.actor, 'Infernal Ichor');
  let feature = await fromUuid(effect.origin);
  let [config, options] = chrisPremades.constants.syntheticItemWorkflowOptions([
    workflow.token.document.uuid,
  ]);
  await MidiQOL.completeItemUse(feature, config, options);
}

;// CONCATENATED MODULE: ./scripts/automations/homebrew/FleeMortals/fleeMortals.js



let fleeMortals = {
  tacticalPositioning: tacticalPositioning,
  infernalIchor: infernalIchor,
};

;// CONCATENATED MODULE: ./scripts/automations/homebrew/homebrew.js





let homebrew = {
  allOrNothingArmor: allOrNothingArmor,
  potionOfHealing: potionOfHealing,
  tomb: tomb,
  fleeMortals: fleeMortals,
};

;// CONCATENATED MODULE: ./scripts/automations/itemFeatures/daggerOfVenomBlackPoison.js
async function daggerOfVenomBlackPoison({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const macroItem = scope.macroItem;

  async function postActiveEffects() {
    let dagger = actor.items.find((it) => it.name == 'Dagger of Venom');
    if (!dagger) return;
    let enableEffect = dagger.effects.find(
      (ef) => ef.name == `${macroItem.name} Applied`
    );
    await enableEffect.update({ disabled: false });
  }

  const callArguments = {
    speaker: speaker,
    actor: actor,
    token: token,
    character: character,
    item: item,
    args: args,
    scope: scope,
  };
  await macroUtil.runWorkflows(callArguments, {
    postActiveEffects: postActiveEffects,
  });
}

;// CONCATENATED MODULE: ./scripts/automations/itemFeatures/itemFeatures.js


let itemFeatures = {
  daggerOfVenomBlackPoison: daggerOfVenomBlackPoison,
};

;// CONCATENATED MODULE: ./scripts/automations/items/arrowCatchingShield.js
// ##################################################################################################
// Author: Elwin#1410
// Read First!!!!
// Adds an AC bonus when the owner is attacked by a ranged attack and triggers a reaction to change the
// target to the owner of the shield when an other target is attacked.
// v3.2.0
// Dependencies:
//  - DAE
//  - MidiQOL "on use" actor macro [preTargeting][isAttacked][tpr.isTargeted]
//  - Elwin Helpers world script
//
// How to configure:
// The Feature details must be:
//   - Equipement Type: Shield
//   - Attunement: Attunement Required
//   - Proficiency: Automatic
//   - Activation cost: 1 Reaction
//   - Target: 1 Ally (RAW it's Creature, but use Ally to trigger reaction only on allies)
//   - Range: 5 Feet
//   - Action Type: Other
//   - Damage formula: (empty)
//   - Chat Message Flavor: You become the target of the ranged attack instead.
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - Activation Conditions
//     - Reaction:
//       reaction === "tpr.isTargeted" && tpr?.isRangedAttack
//   - This item macro code must be added to the DIME code of the item.
// One effect must also be added:
//   - Arrow-Catching Shield:
//      - Transfer to actor on item equip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,isAttacked
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,tpr.isTargeted|ignoreSelf=true;post=true
//
// Usage:
// This item has a passive effect (when equipped and attuned) to handle bonus AC on ranged attacks
// on owner of shield and to handle the reaction when it's not the owner of the shield that is targeted.
//
// Description:
// In the preTargeting (item OnUse) phase of the item (in owner's workflow):
//   Validates that item was triggered by the remote tpr.isPreAttacked target on use,
//   otherwise the item workflow execution is aborted.
// In the tpr.isTargeted (TargetOnUse) post macro (in attacker's workflow) (on other target):
//   If the owner activated the reaction, the current workflow target is switched to
//   to the owner of the shield, midi will then call the isAttacked later on the new target.
// In the isAttacked (TargetOnUse) trigger (in attacker's workflow) (on owner):
//   Verifies if the attack is a ranged attack (melee weapons with the thrown property are supported).
//   If its a ranged attack and the target is the owner of the shield, an AE that adds an AC bonus is
//   added on the owner for a duration of "isAttacked".
// ###################################################################################################

async function arrowCatchingShield({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = 'Arrow-Catching Shield';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.7'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    return handleOnUsePreTargeting(workflow, scope.macroItem);
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isTargeted.post'
  ) {
    // Other target, handle reaction
    await handleTargetOnUseIsTargetedPost(
      workflow,
      token,
      scope.macroItem,
      options?.thirdPartyReactionResult
    );
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'isAttacked'
  ) {
    await handleTargetOnUseIsAttacked(workflow, token, scope.macroItem);
  }

  /**
   * Handles the preTargeting phase of the Arrow-Catching Shield item midi-qol workflow.
   * Validates that the reaction was triggered by the tpr.isTargeted target on use.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Arrow-Catching Shield item.
   *
   * @returns {boolean} true if all requirements are fulfilled, false otherwise.
   */
  function handleOnUsePreTargeting(currentWorkflow, sourceItem) {
    if (
      currentWorkflow.options?.thirdPartyReaction?.trigger !==
        'tpr.isTargeted' ||
      !currentWorkflow.options?.thirdPartyReaction?.itemUuids?.includes(
        sourceItem.uuid
      )
    ) {
      // Reaction should only be triggered by aura
      const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature of the owner is targeted by a ranged attack.`;
      ui.notifications.warn(msg);
      return false;
    }
    return true;
  }

  /**
   * Handles the tpr.isTargeted post macro of the Arrow-Catching Shield item in the triggering midi-qol workflow.
   * If the reaction was used and completed successfully, the target is changed to the owner of the shield.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Token5e} targetToken - The target token that is attacked.
   * @param {Item5e} sourceItem - The Arrow-Catching Shield item.
   * @param {object} thirdPartyReactionResult - The third party reaction result.
   */
  async function handleTargetOnUseIsTargetedPost(
    currentWorkflow,
    targetToken,
    sourceItem,
    thirdPartyReactionResult
  ) {
    if (debug) {
      console.warn(DEFAULT_ITEM_NAME + ' | reaction result', {
        thirdPartyReactionResult,
      });
    }
    if (thirdPartyReactionResult?.uuid !== sourceItem.uuid) {
      return;
    }
    const sourceActor = sourceItem.actor;

    if (!sourceActor || !targetToken) {
      console.error(
        `${DEFAULT_ITEM_NAME} | Missing sourceActor or targetToken`,
        { sourceActor, targetToken }
      );
      return;
    }

    const sourceToken = MidiQOL.tokenForActor(sourceActor);
    if (!sourceToken) {
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No source token could be found.`);
      }
      return;
    }

    // Change target
    currentWorkflow.targets.delete(targetToken);
    currentWorkflow.targets.add(sourceToken);
    const targetIds = currentWorkflow.targets.map((t) => t.id);
    game.user?.updateTokenTargets(targetIds);
    game.user?.broadcastActivity({ targets: targetIds });

    // Add info about target switch
    const targetDivs = elwinHelpers.getTargetDivs(
      targetToken,
      'The target <strong>${tokenName}</strong>'
    );
    const newTargetDivs = elwinHelpers.getTargetDivs(
      sourceToken,
      `was switched to <strong>\${tokenName}</strong> by <strong>${sourceItem.name}</strong>.`
    );
    const infoMsg = `${targetDivs}${newTargetDivs}`;
    await elwinHelpers.insertTextIntoMidiItemCard(
      'beforeHitsDisplay',
      workflow,
      infoMsg
    );
  }

  /**
   * Handles the isAttacked target on use of the Arrow-Catching Shield item.
   * Validates that the attack is a ranged attack on the onwer and if its the case
   * adds an AE to give an AC bonus to the onwer.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Token5e} targetToken - The target token that is attacked.
   * @param {Item5e} sourceItem - The Arrow-Catching Shield item.
   */
  async function handleTargetOnUseIsAttacked(
    currentWorkflow,
    targetToken,
    sourceItem
  ) {
    if (!targetToken || !targetToken?.actor) {
      // No target
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No target token or actor.`);
      }
      return;
    }
    if (
      !elwinHelpers.isRangedAttack(
        currentWorkflow.item,
        currentWorkflow.token,
        targetToken
      )
    ) {
      // Not a ranged attack
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | Not a ranged attack.`);
      }
      return;
    }
    // Owner of shield
    // create an active effect on target to give bonus AC
    const imgPropName = game.release.generation >= 12 ? 'img' : 'icon';
    const targetEffectData = {
      changes: [
        // flag for AC bonus
        {
          key: 'system.attributes.ac.bonus',
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: '+2',
          priority: 20,
        },
      ],

      origin: sourceItem.uuid, //flag the effect as associated to the source item used
      [imgPropName]: sourceItem.img,
      name: `${sourceItem.name} - Bonus AC`,
    };
    targetEffectData.duration = currentWorkflow.inCombat ? { turns: 1 } : {};
    foundry.utils.setProperty(targetEffectData, 'flags.dae.specialDuration', [
      'isAttacked',
    ]);

    await MidiQOL.socket().executeAsGM('createEffects', {
      actorUuid: targetToken.actor.uuid,
      effects: [targetEffectData],
    });
  }
}

;// CONCATENATED MODULE: ./scripts/automations/items/clockworkAmulet.js
async function clockworkAmulet({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (args[0].macroPass === 'preAttackRoll')
    workflow.workflowOptions.attackRollDSN = false; //optional to make sure no Attack Roll dice gets rolled
  if (args[0].macroPass === 'preCheckHits') {
    const formulaData = workflow.item.getAttackToHit().parts.join('+');
    const { api } = game.modules.get('babonus');
    const getBabosAttackToHit = api
      .getType(workflow.actor, 'attack')
      .map((bab) => bab.bonuses.bonus)
      .join('+');
    let newRoll;
    if (getBabosAttackToHit)
      newRoll = await new Roll(
        `10 + ${formulaData} + ${getBabosAttackToHit}`,
        actor.getRollData()
      ).evaluate();
    else
      newRoll = await new Roll(
        `10 + ${formulaData}`,
        actor.getRollData()
      ).evaluate();
    workflow.setAttackRoll(newRoll);
    MidiQOL.displayDSNForRoll(newRoll);
  }
}

;// CONCATENATED MODULE: ./scripts/automations/items/corpseSlayerLongbow.js
async function corpseSlayerLongbow({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (workflow.item.name.includes('Turn Undead')) {
    workflow.saveDetails.disadvantage = true;
  }
}

;// CONCATENATED MODULE: ./scripts/automations/items/driftglobe.js
async function driftglobe({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const documents = [
    {
      name: 'Light (20ft + 20ft)',
      img: 'icons/magic/light/explosion-star-small-blue-yellow.webp',
      creatureName: 'Driftglobe (Light)',
    },
    {
      name: 'Daylight (60ft + 60ft)',
      img: 'icons/magic/light/beam-rays-yellow.webp',
      creatureName: 'Driftglobe (Daylight)',
    },
  ];

  const selectedItemArray = await chrisPremades.helpers.selectDocument(
    'Activate Driftglobe',
    documents,
    false
  );

  if (!selectedItemArray[0])
    return ui.notifications.warn('Driftglobe not activated!');

  const [spawn] = await warpgate.spawn(selectedItemArray[0].creatureName);

  await game.Rideable.FollowbyID([spawn], token.id);
}

;// CONCATENATED MODULE: ./scripts/automations/items/guardianEmblem.js
// ##################################################################################################
// Read First!!!!
// When equipped and attuned, adds an action that allows to attach the emblem to a shield or armor.
// Once the emblem is attached, it adds a third party reaction active effect, that effect will trigger a reaction
// on the owner when a creature within range is hit by a critical to allow him to convert it to a normal hit.
// v3.2.0
// Author: Elwin#1410
// Dependencies:
//  - DAE, item macro [on],[off]
//  - MidiQOL "on use" item macro, [preTargeting][preItemRoll][postActiveEffects][tpr.isHit]
//  - Warpgate (dnd5e < v3.2)
//  - Elwin Helpers world script
//
// How to configure:
// The item details must be:
//   - Equipement Type: Trinket
//   - Attunement: Attunement Required
//   - Proficiency: Automatic
//   - Activation cost: 1 Reaction
//   - Target: 1 Ally (RAW it's Creature, but use Ally to trigger reaction on allies only)
//   - Range: 30 feet
//   - Limited Uses: 3 of 3 per Dawn
//   - Uses Prompt: (checked)
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - No Full cover: (checked)
//   - Activation Conditions
//     - Reaction:
//       reaction === "tpr.isHit" && workflow.isCritical
//   - This item macro code must be added to the DIME code of this item.
// Two effects must also be added:
//   - Guardian Emblem:
//      - Transfer Effect to Actor on item equip (checked)
//      - Effects:
//          - macro.itemMacro | Custom |
//   - Guardian Emblem - TPR:
//      - Effect Suspended (checked)
//      - Transfer Effect to Actor on item equip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,tpr.isHit|canSee=true;pre=true;post=true
//
// Usage:
// When equipped and attuned, a feat is added that allows to attach/detach to/from a shield or armor.
// When this feat is used, it allows to attach the emblem, once attached, it activates a
// third party reaction effect. It is also a reaction item that gets triggered by the third party reaction effect when appropriate.
//
// Description:
// In the "on" DAE macro call:
//   Creates and adds a feat to the owner of the emblem, to attach/detach it to/from
//   a shield or armor.
// In the "off" DAE macro call:
//   Deletes the feat to attach/detach that was created.
//   Deletes the enchantment from the armor or shield. (dnd5e v3.2+)
//   Or reverts the mutation from the armor or shield. (dnd5e < v3.2)
//   Disables the item's third party reaction effect.
// In the preTargeting (item OnUse) phase of the Guardian Emblem item (in owner's workflow):
//   Validates that item was triggered by the remote tpr.isHit target on use,
//   otherwise the item workflow execution is aborted.
// In the preItemRoll (item OnUse) phase of the Guardian Emblem item (in owner's workflow):
//   Disables enchantment drop area. (dnd5e v3.2+)
// In the postActiveEffects (item OnUse) phase (of the attach/detach feat):
//   If the emblem is not attached:
//     Prompts a dialog to choose from a list of shield or armors and attach the emblem on the selected
///    item.
//     An enchantment is created and added to the selected armor or shield. (dnd5e v3.2+)
//     Or a mutation is created and added to the selected armor or shield. (dnd5e < v3.2)
//     Then enables the item's third party reaction effect.
//   If the emblem is attached:
//     Deletes the enchantement from the armor or shield. (dnd5e v3.2+)
//     Or reverts the mutation from the armor or shield. (dnd5e < v3.2)
//     Then disables the item's third party reaction effect.
// In the tpr.isHit (TargetOnUse) post macro (in attacker's workflow) (on owner's or other target):
//   If the reaction was used and completed successfully, the current workflow critical hit is converted to
//   a normal hit.
// ###################################################################################################

async function guardianEmblem({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the item
  const DEFAULT_ITEM_NAME = 'Guardian Emblem';
  const MODULE_ID = 'midi-item-showcase-community';
  const ATTACH_ACTION_ORIGIN_FLAG = 'guardian-emblem-action-origin';
  const ATTACHMENT_ORIGIN_FLAG = 'guardian-emblem-uuid';
  // Set to false to remove debug logging
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.2.2'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = !foundry.utils.isNewerVersion(game.system.version, '3.2')
    ? ['dae', 'midi-qol', 'warpgate']
    : ['dae', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0] === 'on') {
    const itemName = `${item.name}: Attach/Detach`;
    const attachActionItemData = {
      type: 'feat',
      name: itemName,
      img: item.img,
      system: {
        description: {
          value: 'Attach or detach the emblem to/from a shield or armor',
        },
        activation: {
          type: 'action',
          cost: 1,
        },
        target: { type: 'self' },
      },
      flags: {
        'midi-qol': {
          onUseMacroName: `[postActiveEffects]ItemMacro.${item.uuid}`,
        },
        [MODULE_ID]: {
          [ATTACH_ACTION_ORIGIN_FLAG]: item.uuid,
        },
      },
    };

    // Remove item if already on actor
    await actor.itemTypes.feat
      .find(
        (i) => i.getFlag(MODULE_ID, ATTACH_ACTION_ORIGIN_FLAG) === item.uuid
      )
      ?.delete();
    // Add item that allows attaching emblem to shield or armor
    await actor.createEmbeddedDocuments('Item', [attachActionItemData]);
  } else if (args[0] === 'off') {
    // Remove item that allows attaching emblem to shield or armor
    await actor.itemTypes.feat
      .find(
        (i) => i.getFlag(MODULE_ID, ATTACH_ACTION_ORIGIN_FLAG) === item.uuid
      )
      ?.delete();

    if (foundry.utils.isNewerVersion(game.system.version, '3.2')) {
      // Remove enchantment
      await elwinHelpers.deleteAppliedEnchantments(item.uuid);
    } else {
      // Revert mutation
      await warpgate.revert(token.document, `${item.id}-attached-item`);
    }
    // Find third party reaction effect to disable it
    await activateThirdPartyReaction(item, false);
  } else if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    return handleOnUsePreTargeting(workflow, scope.macroItem);
  } else if (args[0].tag === 'OnUse' && args[0].macroPass === 'preItemRoll') {
    if (foundry.utils.isNewerVersion(game.system.version, '3.2')) {
      // Disables enchantment drop area
      workflow.config.promptEnchantment = false;
      workflow.config.enchantmentProfile = null;
    }
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isHit.pre'
  ) {
    return handleTargetOnUseIsHitPre(scope.macroItem);
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isHit.post'
  ) {
    if (!token) {
      // No target
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No target token.`);
      }
      return;
    }
    // Handle reaction
    await handleTargetOnUseIsHitPost(
      workflow,
      token,
      scope.macroItem,
      options?.thirdPartyReactionResult
    );
  } else if (
    args[0].tag === 'OnUse' &&
    args[0].macroPass === 'postActiveEffects'
  ) {
    const origin = scope.rolledItem.getFlag(
      MODULE_ID,
      ATTACH_ACTION_ORIGIN_FLAG
    );
    if (origin !== scope.macroItem.uuid) {
      console.warn(
        `${DEFAULT_ITEM_NAME} | Wrong sourceItemUuid is different from the origin of attach feat item.`,
        scope.macroItem.uuid,
        origin
      );
      return;
    }
    await handleAttachPostActiveEffects(token, scope.macroItem);
  }

  /**
   * Handles the preTargeting phase of the Guardian Emblem item.
   * Validates that the reaction was triggered by the tpr.isHit remove reaction.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Guardian Emblem item.
   *
   * @returns {boolean} true if all requirements are fulfilled, false otherwise.
   */
  function handleOnUsePreTargeting(currentWorkflow, sourceItem) {
    if (
      currentWorkflow.options?.thirdPartyReaction?.trigger !== 'tpr.isHit' ||
      !currentWorkflow.options?.thirdPartyReaction?.itemUuids?.includes(
        sourceItem.uuid
      )
    ) {
      // Reaction should only be triggered by third party reaction
      const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature or the owner is hit.`;
      ui.notifications.warn(msg);
      return false;
    }
    return true;
  }

  /**
   * Handles the tpr.isHit pre macro of the Guardian Emblem item in the triggering midi-qol workflow.
   * Validates that the emblem is attached to an item and that this item is equipped.
   *
   * @param {Item5e} sourceItem - The Guardian Emblem item.
   * @returns {object} undefined when all conditions are met, an object with skip attribute to true if the reaction must be skipped.
   */
  function handleTargetOnUseIsHitPre(sourceItem) {
    const attachedItem = sourceItem.actor?.items.find(
      (i) => i.getFlag(MODULE_ID, ATTACHMENT_ORIGIN_FLAG) === sourceItem.uuid
    );
    if (!attachedItem) {
      if (debug) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | Could not find attached item for: ${sourceItem.uuid}.`
        );
      }
      return { skip: true };
    }
    if (!attachedItem?.system.equipped) {
      if (debug) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | Attached item not equipped.`,
          attachedItem
        );
      }
      return { skip: true };
    }
  }

  /**
   * Handles the tpr.isHit post macro of the Guardian Emblem item in the triggering midi-qol workflow.
   * If the reaction was used and completed successfully, converts a critical hit on the target into a normal hit.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Token5e} targetToken - The target token that is hit.
   * @param {Item5e} sourceItem - The Guardian Emblem item.
   * @param {object} thirdPartyReactionResult - The third party reaction result.
   */
  async function handleTargetOnUseIsHitPost(
    currentWorkflow,
    targetToken,
    sourceItem,
    thirdPartyReactionResult
  ) {
    if (debug) {
      console.warn(DEFAULT_ITEM_NAME + ' | reaction result', {
        thirdPartyReactionResult,
      });
    }
    if (thirdPartyReactionResult?.uuid === sourceItem.uuid) {
      // Convert critical hits into normal hit
      await elwinHelpers.convertCriticalToNormalHit(currentWorkflow);
    }
  }

  /**
   * Handles the postActiveEffects of the Guardian Emblem - Attach/Detach feat.
   * If the emblem is not attached:
   *   Prompts a dialog to choose from a list of shield or armors and attach the emblem
   *   on the selected item. This is done through an enchantment (dnd5e v3.2+) or using a mutation (dnd5e < v3.2),
   *   then enables the item's third party reaction effect.
   * If the emblem is attached:
   *   Delete the "attached" enchantment (dnd5e v3.2+) or revert the mutation (dnd5e < v3.2),
   *   then disables the item's third party reaction effect.
   *
   * @param {Token5e} sourceToken - The token owner of the Guardian Emblem item.
   * @param {Item5e} sourceItem - The Guardian Emblem item.
   */
  async function handleAttachPostActiveEffects(sourceToken, sourceItem) {
    let attachedItems;
    if (foundry.utils.isNewerVersion(game.system.version, '3.2')) {
      // Get applied enchantements for this item
      attachedItems = elwinHelpers.getAppliedEnchantments(sourceItem.uuid);
    } else {
      // Get item with attachment origin flag
      const attachedItem = sourceToken.actor?.items.find(
        (i) => i.getFlag(MODULE_ID, ATTACHMENT_ORIGIN_FLAG) === sourceItem.uuid
      );
      attachedItems = attachedItem ? [attachedItem] : undefined;
    }

    if (attachedItems?.length) {
      // Detach emblem
      if (foundry.utils.isNewerVersion(game.system.version, '3.2')) {
        // Remove enchantment
        await elwinHelpers.deleteAppliedEnchantments(sourceItem.uuid);
      } else {
        // Revert mutation
        await warpgate.revert(
          sourceToken.document,
          `${sourceItem.id}-attached-item`
        );
      }
      // Find third party reaction effect to disable it
      await activateThirdPartyReaction(sourceItem, false);
    } else {
      // Choose armor and attach emblem
      const armorChoices = sourceToken.actor.itemTypes.equipment.filter(
        (i) => i.isArmor && !i.getFlag(MODULE_ID, ATTACHMENT_ORIGIN_FLAG)
      );

      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME}: armorChoices`, armorChoices);
      }

      const selectedArmor = await elwinHelpers.ItemSelectionDialog.createDialog(
        `⚔️ ${sourceItem.name}: Choose an Armor or Shield`,
        armorChoices,
        null
      );
      if (!selectedArmor) {
        console.error(
          `${DEFAULT_ITEM_NAME}: Armor or shield selection was cancelled.`
        );
        return;
      }

      if (foundry.utils.isNewerVersion(game.system.version, '3.2')) {
        const imgPropName = game.release.generation >= 12 ? 'img' : 'icon';
        const enchantmentEffectData = {
          name: `${sourceItem.name} - Attached`,
          flags: {
            dnd5e: {
              type: 'enchantment',
            },
          },
          [imgPropName]: sourceItem.img,
          changes: [
            {
              key: 'name',
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              value: `{} (${sourceItem.name})`,
              priority: 20,
            },
            {
              key: `flags.${MODULE_ID}.${ATTACHMENT_ORIGIN_FLAG}`,
              mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
              value: sourceItem.uuid,
              priority: 20,
            },
          ],
          transfer: false,
          origin: sourceItem.uuid,
        };

        // Add enchantment to armor or shield
        await ActiveEffect.create(enchantmentEffectData, {
          parent: selectedArmor,
          keepOrigin: true,
        });
      } else {
        const newItemName = `${selectedArmor.name} (${sourceItem.name})`;
        const updates = {
          embedded: {
            Item: {
              [selectedArmor.id]: {
                name: newItemName,
              },
            },
          },
        };
        foundry.utils.setProperty(
          updates.embedded.Item[selectedArmor.id],
          `flags.${MODULE_ID}.${ATTACHMENT_ORIGIN_FLAG}`,
          sourceItem.uuid
        );

        const attachItemMutationName = `${sourceItem.id}-attached-item`;
        if (
          warpgate
            .mutationStack(sourceToken.document)
            .getName(attachItemMutationName)
        ) {
          await warpgate.revert(sourceToken.document, attachItemMutationName);
        }
        await warpgate.mutate(
          sourceToken.document,
          updates,
          {},
          { name: attachItemMutationName, comparisonKeys: { Item: 'id' } }
        );
      }

      // Find third party reaction effect to enable it
      await activateThirdPartyReaction(sourceItem, true);
    }
  }

  /**
   * Enables or disables the third party reaction effect.
   *
   * @param {Item5e} sourceItem - The Guardian Emblem item.
   * @param {boolean} activate - Flag to indicate if the third party reaction effect must be activate or deactivated.
   */
  async function activateThirdPartyReaction(sourceItem, activate) {
    // Find third party reaction effect to enable it
    const sourceActor = sourceItem.actor;
    if (!sourceActor) {
      if (debug) {
        console.error(
          `${DEFAULT_ITEM_NAME} | Missing source item actor.`,
          sourceItem
        );
      }
      return;
    }
    let tprEffect = undefined;
    const aePredicate = (ae) =>
      ae.transfer &&
      ae.parent?.uuid === sourceItem.uuid &&
      ae.changes.some(
        (c) =>
          c.key === 'flags.midi-qol.onUseMacroName' &&
          c.value.includes('tpr.isHit')
      );

    if (activate) {
      tprEffect = [...sourceActor.allApplicableEffects()].find(aePredicate);
      if (!tprEffect) {
        console.error(
          `${DEFAULT_ITEM_NAME} | Third party reaction effect not found.`
        );
        return;
      }
    } else {
      tprEffect = sourceActor.appliedEffects?.find(aePredicate);
      if (!tprEffect) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | Third party reaction effect not active.`
        );
        return;
      }
    }
    await tprEffect.update({ disabled: !activate });
  }
}

;// CONCATENATED MODULE: ./scripts/automations/items/wandOfWinter.js
async function wandOfWinter({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const {
    args: {
      [0]: { macroPass },
    },
    item: {
      system: {
        uses: { value: charges, max },
      },
    },
  } = scope ?? {};
  if (macroPass === 'postActiveEffects') {
    if (!item.system.equipped || item.system.attunement === 1) {
      ui.notifications.info(
        `${item.actor.name} has not attuned to, or has not equipped the Wand of Winter!`
      );
      return false;
    }

    const spells = [
      {
        label: 'Ray of Frost (0)',
        charges: 0,
        callback: 'ray0',
        toHit: 5,
        disabled: false,
        scaling: null,
      },
      {
        label: 'Ray of Frost (5th level) (1)',
        charges: 1,
        callback: 'ray5',
        toHit: 5,
        disabled: charges < 1,
        scaling: 5,
      },
      {
        label: 'Sleet Storm (3)',
        charges: 3,
        callback: 'sleetStorm',
        dc: 15,
        disabled: charges < 3,
      },
      {
        label: 'Ice Storm (4)',
        charges: 4,
        callback: 'iceStorm',
        dc: 15,
        disabled: charges < 4,
      },
    ];
    const payload = {
      title: 'Wand of Winter',
      content: `<style>
            #wow-dialog .dialog-buttons {
                display: grid;
                gap: 1em;
                grid-template-columns: 1fr;
            }
          </style><center>Charges: ${charges}/${max}</center>`,
      buttons: spells.map((i) => ({
        label: i.label,
        callback: () => i.callback,
        disabled: i.disabled,
      })),
      close: () => false,
    };
    const opts = {
      id: 'wow-dialog',
      width: 'auto',
      classes: ['dialog', 'dialog-buttons'],
    };
    const dialog = await Dialog.wait(payload, {}, opts);
    if (!dialog)
      return ui.notifications.info(
        `${item.actor.name} decided not to use the ${this.name}`
      );
    const result = spells.find((s) => s.callback === dialog);
    const [fromPack] = await game.packs
      .get('dnd5e.spells')
      .getDocuments({ name: result.label.split('(')[0].trim() });
    let spell = game.items.fromCompendium(fromPack);
    if (result.dc) {
      spell.system.save.dc = result.dc;
      spell.system.save.scaling = 'flat';
      spell.system.preparation.mode = 'atwill';
    }
    if (result.scaling !== undefined) spell.system.scaling.mode = null;
    if (result.scaling)
      spell.system.damage.parts[0][0] = fromPack._scaleCantripDamage(
        fromPack.system.damage.parts.map((i) => i[0]),
        fromPack.system.scaling.formula,
        result.scaling,
        item.actor.getRollData()
      );
    if (result.toHit) {
      spell.system.attackBonus = `-@prof + ${result.toHit}`;
      spell.system.ability = 'none';
    }
    spell = new Item.implementation(spell, { parent: item.actor });
    spell.prepareFinalAttributes();
    const rollWorkflow = await MidiQOL.completeItemUse(
      spell,
      {},
      { flags: { 'midi-qol': { castedLevel: spell.system.level } } }
    );
    await item.update({
      'system.uses.value': item.system.uses.value - result.charges,
    });
  }
}

;// CONCATENATED MODULE: ./scripts/automations/items/oathbow.js
async function oathbow({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  async function addToRoll(roll, addonFormula) {
    let addonFormulaRoll = await new Roll('0 + ' + addonFormula).evaluate({
      async: true,
    });
    game.dice3d?.showForRoll(addonFormulaRoll);
    for (let i = 1; i < addonFormulaRoll.terms.length; i++) {
      roll.terms.push(addonFormulaRoll.terms[i]);
    }
    roll._total += addonFormulaRoll.total;
    roll._formula = roll._formula + ' + ' + addonFormula;
    return roll;
  }
  const swornEnemy = {
    name: 'Sworn Enemy',
    type: 'feat',
    flags: {
      'midi-qol': {
        onUseMacroName: '[postActiveEffects]ItemMacro',
        rollAttackPerTarget: 'default',
        itemCondition: '',
        effectCondition: '',
      },
      dae: {
        macro: {
          name: 'Sworn Enemy',
          img: 'icons/weapons/ammunition/arrow-broadhead-glowing-orange.webp',
          type: 'script',
          scope: 'global',
          command:
            'const target = workflow.targets.first()\nconst uuid = target.actor.uuid;\nconst effectSource = actor.appliedEffects.find(e=>e.name == \'Sworn Enemy - Attacker\');\nconst effectTarget = target.actor.appliedEffects.find(e=>e.name == "Sworn Enemy - Target")\n\nconsole.log("effectSource:", effectSource);\nconsole.log("effectSource.uuid:", effectSource.uuid);\nconsole.log("effectTarget:", effectTarget);\nconsole.log("effectTarget.uuid", effectTarget.uuid)\n\nawait MidiQOL.socket().executeAsGM(\'addDependent\', {concentrationEffectUuid: effectSource.uuid, dependentUuid: effectTarget.uuid});\nawait MidiQOL.socket().executeAsGM(\'addDependent\', {concentrationEffectUuid: effectTarget.uuid, dependentUuid: effectSource.uuid});',
          author: 'jM4h8qpyxwTpfNli',
          ownership: {
            default: 3,
          },
          _id: null,
          folder: null,
          sort: 0,
          flags: {},
          _stats: {
            systemId: 'dnd5e',
            systemVersion: '3.3.1',
            coreVersion: '12.330',
            createdTime: null,
            modifiedTime: null,
            lastModifiedBy: null,
            compendiumSource: null,
            duplicateSource: null,
          },
        },
        DAECreated: true,
      },
      'scene-packer': {
        hash: '3eb63519c2833021a79b75f21ec2c725156e96a7',
        sourceId: 'Item.rk239YpC0iWlhxjA',
      },
      walledtemplates: {
        wallsBlock: 'globalDefault',
        wallRestriction: 'globalDefault',
      },
      core: {},
      exportSource: {
        world: 'Rime-of-the-Frost-Maiden',
        system: 'dnd5e',
        coreVersion: '11.315',
        systemVersion: '3.2.1',
      },
      magicitems: {
        enabled: false,
        default: '',
        equipped: false,
        attuned: false,
        charges: '0',
        chargeType: 'c1',
        destroy: false,
        destroyFlavorText:
          'reaches 0 charges: it crumbles into ashes and is destroyed.',
        rechargeable: false,
        recharge: '0',
        rechargeType: 't1',
        rechargeUnit: 'r1',
        sorting: 'l',
      },
      midiProperties: {
        confirmTargets: 'default',
        autoFailFriendly: false,
        autoSaveFriendly: false,
        critOther: false,
        offHandWeapon: false,
        magicdam: false,
        magiceffect: false,
        noConcentrationCheck: false,
        toggleEffect: false,
        ignoreTotalCover: false,
        idr: false,
        idi: false,
        idv: false,
        ida: false,
      },
    },
    img: 'icons/weapons/ammunition/arrow-broadhead-glowing-orange.webp',
    system: {
      description: {
        value:
          '<p>When you denote an enemy as a "Sworn Enemy," the target of your Oathbow attack becomes your sworn enemy until it dies or until dawn seven days later. You can have only one such sworn enemy at a time. When your sworn enemy dies, you can choose a new one after the next dawn.</p><p>When you make a ranged attack roll with this weapon against your sworn enemy, you have advantage on the roll. In addition, your target gains no benefit from cover, other than total cover, and you suffer no disadvantage due to long range. If the attack hits, your sworn enemy takes an extra 3d6 piercing damage.</p><p>While your sworn enemy lives, you have disadvantage on attack rolls with all other weapons.</p>',
        chat: '',
      },
      duration: {
        value: '7',
        units: 'day',
      },
      target: {
        value: '1',
        width: null,
        units: '',
        type: 'enemy',
        prompt: true,
      },
      source: {},
      activation: {
        type: 'none',
        cost: null,
        condition: '',
      },
      cover: null,
      crewed: false,
      range: {
        value: null,
        long: null,
        units: '',
      },
      uses: {
        value: null,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      ability: null,
      actionType: null,
      attack: {
        bonus: '',
        flat: false,
      },
      chatFlavor: '',
      critical: {
        threshold: null,
        damage: '',
      },
      damage: {
        parts: [],
        versatile: '',
      },
      enchantment: null,
      formula: '',
      save: {
        ability: '',
        dc: null,
        scaling: 'spell',
      },
      summons: null,
      type: {
        value: '',
        subtype: '',
      },
      prerequisites: {
        level: null,
      },
      properties: [],
      requirements: '',
      recharge: {
        value: null,
        charged: false,
      },
    },
    effects: [
      {
        name: 'Sworn Enemy - Attacker',
        changes: [
          {
            key: 'flags.midi-qol.disadvantage.attack.all',
            mode: 0,
            value: 'workflow.item.name !== "Oathbow"',
            priority: 20,
          },
        ],
        transfer: false,
        _id: 'q71qwG76PUYJIVVg',
        disabled: false,
        duration: {
          startTime: null,
          seconds: 604800,
          combat: null,
          rounds: null,
          turns: null,
          startRound: null,
          startTurn: null,
        },
        flags: {
          dae: {
            disableIncapacitated: false,
            selfTarget: true,
            selfTargetAlways: false,
            dontApply: false,
            stackable: 'noneName',
            showIcon: true,
            durationExpression: '',
            macroRepeat: 'none',
            specialDuration: [],
            enableCondition: '',
            disableCondition: '',
          },
          ActiveAuras: {
            isAura: false,
            aura: 'None',
            nameOverride: '',
            radius: '',
            alignment: '',
            type: '',
            customCheck: '',
            ignoreSelf: false,
            height: false,
            hidden: false,
            displayTemp: false,
            hostile: false,
            onlyOnce: false,
            wallsBlock: 'system',
          },
          effectmacro: {},
        },
        description:
          '<p>When you denote an enemy as a "Sworn Enemy," the target of your Oathbow attack becomes your sworn enemy until it dies or until dawn seven days later. You can have only one such sworn enemy at a time. When your sworn enemy dies, you can choose a new one after the next dawn.</p><p>When you make a ranged attack roll with this weapon against your sworn enemy, you have advantage on the roll. In addition, your target gains no benefit from cover, other than total cover, and you suffer no disadvantage due to long range. If the attack hits, your sworn enemy takes an extra 3d6 piercing damage.</p><p>While your sworn enemy lives, you have disadvantage on attack rolls with all other weapons.</p>',
        origin: null,
        statuses: [],
        tint: '#ffffff',
        icon: 'icons/weapons/ammunition/arrow-broadhead-glowing-orange.webp',
      },
      {
        origin: 'Actor.XlGHj4yq4EcmlMMq.Item.f2rRBfwVMPmycAgD',
        duration: {
          rounds: 1,
          startTime: null,
          seconds: 604800,
          combat: null,
          turns: null,
          startRound: null,
          startTurn: null,
        },
        disabled: false,
        name: 'Sworn Enemy - Target',
        _id: 'Knbw6MDKs8vRF3Ig',
        changes: [],
        description:
          '<p>When you denote an enemy as a "Sworn Enemy," the target of your Oathbow attack becomes your sworn enemy until it dies or until dawn seven days later. You can have only one such sworn enemy at a time. When your sworn enemy dies, you can choose a new one after the next dawn.</p><p>When you make a ranged attack roll with this weapon against your sworn enemy, you have advantage on the roll. In addition, your target gains no benefit from cover, other than total cover, and you suffer no disadvantage due to long range. If the attack hits, your sworn enemy takes an extra 3d6 piercing damage.</p><p>While your sworn enemy lives, you have disadvantage on attack rolls with all other weapons.</p>',
        tint: '#ffffff',
        transfer: false,
        statuses: [],
        flags: {
          dae: {
            enableCondition: '',
            disableCondition: '',
            disableIncapacitated: false,
            selfTarget: false,
            selfTargetAlways: false,
            dontApply: false,
            stackable: 'noneName',
            showIcon: false,
            durationExpression: '',
            macroRepeat: 'none',
            specialDuration: ['zeroHP'],
          },
          ActiveAuras: {
            isAura: false,
            aura: 'None',
            nameOverride: '',
            radius: '',
            alignment: '',
            type: '',
            customCheck: '',
            ignoreSelf: false,
            height: false,
            hidden: false,
            displayTemp: false,
            hostile: false,
            onlyOnce: false,
            wallsBlock: 'system',
          },
        },
        icon: 'icons/weapons/ammunition/arrow-broadhead-glowing-orange.webp',
      },
    ],
    folder: null,
    _stats: {
      coreVersion: '11.315',
      systemId: 'dnd5e',
      systemVersion: '3.2.1',
      createdTime: 1723123040587,
      modifiedTime: 1723124919099,
      lastModifiedBy: 'jM4h8qpyxwTpfNli',
    },
  };

  if (args[0] === 'on') {
    await actor.createEmbeddedDocuments('Item', [swornEnemy]);
    return;
  } else if (args[0] === 'off') {
    await actor.itemTypes.feat.find((i) => i.name === 'Sworn Enemy')?.delete();
    return;
  }

  // COMPUTE COVER CALCS << needs work
  if (workflow.macroPass === 'preCheckHits') {
    if (!workflow.targets.size) return;
    const effectExists = workflow.targets
      .first()
      ?.actor?.appliedEffects?.find((ef) => ef.name === 'Sworn Enemy - Target');
    if (!effectExists) return;

    let validTypes = ['rwak'];
    if (!validTypes.includes(workflow.item.system.actionType)) return;
    if (
      game.settings.get('midi-qol', 'ConfigSettings').optionalRules
        .coverCalculation === 'none'
    )
      return;

    let coverBonus = MidiQOL.computeCoverBonus(
      workflow.token,
      workflow.targets.first(),
      workflow.item
    );
    if (coverBonus > 5) {
      ui.notifications.warn('Target is under total cover');
      return;
    }
    let updatedRoll = await addToRoll(workflow.attackRoll, coverBonus);
    workflow.setAttackRoll(updatedRoll);
  }
}

// EXTERNAL MODULE: ./scripts/automations/items/shieldOfMissileAttraction.js
var shieldOfMissileAttraction = __webpack_require__(586);
;// CONCATENATED MODULE: ./scripts/automations/items/sunBlade.js
// ##################################################################################################
// Read First!!!!
// When equipped and attuned, adds an action that allows to activate/deactivate the blade.
// Once the blade is activated another item it added to adjust the radius of the light.
// v1.2.0
// Author: Elwin#1410
// Dependencies:
//  - DAE, item macro [on],[off]
//  - MidiQOL "on use" item macro, [preTargeting][postActiveEffects]
//  - Active Token Effects
//  - Tidy 5e Sheets (optional)
//
// How to configure:
// The item details must be:
//   - Equipement Type: Weapon
//   - Weapon Type: Martial Melee
//   - Base Weapon: Longsword
//   - Attunement: Attunement Required
//   - Proficiency: Automatic
//   - Weapon Properties: Magical
//   - Magical Bonus: 2
//   - Activation cost: (empty))
//   - Target: None
//   - Range: 5 feet
//   - Action Type: Melee Weapon Attack
//   - Damage Formula:
//     - 1d8[radiant] + @mod | Radiant
//   - Versatile Damage:
//     - 1d10[radiant] + @mod
//   - Other Formula: 1d8[radiant]
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved
//   - Activation Conditions
//     - Other Damage:
//       ["undead"].includes("@raceOrType")
//   - This item macro code must be added to the DIME code of this item.
// One effect must also be added:
//   - Sun Blade:
//      - Transfer Effect to Actor on item equip (checked)
//      - Effects:
//          - macro.itemMacro | Custom |
//
// Usage:
// When equipped and attuned, a feat is added that allows to activate/deactivate the blade.
// When this feat is used, it allows to activate the blade, when activated an AE with the light effect
// is added as also another feat to adjust the blade's light radius. If using Tidy 5e Sheets, you
// can specify a custom section for the created feats. Edit the passive Sun Blade effect, and add
// a section name in the value of the 'macro.itemMacro' change. If the value contains a space,
// put the value in double quotes, e.g.: "My custom section"
//
//
//
// Description:
// In the "on" DAE macro call (of the Sun Blade transfer effect):
//   Creates and adds a feat to the owner of the sword to activate/deactivate the blade.
// In the "off" DAE macro call (of the Sun Blade transfer effect):
//   Deletes the feat to activate/deactivate that was created.
//   Deletes the Blade activation effect if present.
// In the "on" DAE macro call (of the Sun Blade activation effect):
//   Changes the blade to make it usable for attack.
//   Creates and adds a feat to the owner of the sword to adjust the blade's light radius.
// In the "off" DAE macro call (of the Sun Blade activation effect):
//   Reverts the changes done to the Sun Blade to make it usable for attack.
// In the preTargeting (item OnUse) phase of the Sun Blade item (in owner's workflow):
//   Validates that item blade is activate, otherwise the item workflow execution is aborted and
//   a notification is displayed to the user.
// In the postActiveEffects (item OnUse) phase (of the activate/deactivate feat):
//   If the blade is not activated:
//     Creates an activation effect on the current actor that updates the light config of the token.
//     Updates the Sun Blade transfer effect to delete the created effect when disabled.
//   If the blade is activated:
//     Deletes the activate effect.
//     Updates the Sun Blade transfer effect to remove the delete flag that was added at creation.
// In the postActiveEffects (item OnUse) phase (of the adjust feat):
//   If the alt key was pressed:
//     Enlarge the light bright and dim radius by 5 feet each up to maximum.
//   If the ctrl key was pressed:
//     Reduce the light bright and dim radius by 5 feet each down to minimum.
//   Prompt the owner to choose between enlarge or reduce, depending on the choice,
//     Apply 5 feet increase or decrease to the light bright and dim radius up to min/max.
// ###################################################################################################

async function sunBlade({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the item
  const DEFAULT_ITEM_NAME = 'Sun Blade';
  const MODULE_ID = 'midi-item-showcase-community';
  const ACTIVATE_ACTION_ORIGIN_FLAG = 'sunblade-activate-action-origin';
  const ADJUST_LIGHT_RADIUS_ACTION_ORIGIN_FLAG =
    'sunblade-adjust-light-radius-action-origin';
  const ACTIVATED = 'sunblade-activated';
  const LIGHT_RADIUS = 'sunblade-light-radius';
  const SOURCE_NAME = 'sunblade-source-name';
  const INITIAL_LIGHT_RADIUS = 15;
  const MIN_LIGHT_RADIUS = 10;
  const MAX_LIGHT_RADIUS = 30;
  const ENLARGE_CHOICE = 'enlarge';
  const REDUCE_CHOICE = 'reduce';

  // Set to false to remove debug logging
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  const dependencies = ['dae', 'midi-qol', 'ATL'];
  if (!requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  /**
   * If the requirements are met, returns true, false otherwise.
   *
   * @param {string} name - The name of the item for which to check the dependencies.
   * @param {string[]} dependencies - The array of module ids which are required.
   *
   * @returns {boolean} true if the requirements are met, false otherwise.
   */
  function requirementsSatisfied(name, dependencies) {
    let missingDep = false;
    dependencies.forEach((dep) => {
      if (!game.modules.get(dep)?.active) {
        const errorMsg = `${name} | ${dep} must be installed and active.`;
        ui.notifications.error(errorMsg);
        console.warn(errorMsg);
        missingDep = true;
      }
    });
    return !missingDep;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0] === 'on') {
    if (
      foundry.utils.getProperty(
        scope.lastArgValue.efData,
        `flags.${MODULE_ID}.${ACTIVATED}`
      )
    ) {
      await activateBlade(item, args[1]);
      await adjustProficiency(item);
    } else {
      // Transfer AE
      await createActivationAction(item, args[1]);
    }
  } else if (args[0] === 'off') {
    if (
      foundry.utils.getProperty(
        scope.lastArgValue.efData,
        `flags.${MODULE_ID}.${ACTIVATED}`
      )
    ) {
      await deactivateBlade(item);
    } else {
      // Transfer AE, delete activation item and activation AE if present
      await actor.itemTypes.feat
        .find(
          (i) => i.getFlag(MODULE_ID, ACTIVATE_ACTION_ORIGIN_FLAG) === item.uuid
        )
        ?.delete();
      await actor.effects
        .find(
          (ae) => ae.origin === item.uuid && ae.getFlag(MODULE_ID, ACTIVATED)
        )
        ?.delete();
    }
  } else if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    if (!scope.rolledItem.getFlag(MODULE_ID, ACTIVATED)) {
      ui.notifications.warn(
        'The blade must be activated to be able to make an attack with it.'
      );
      return false;
    }
    // Adjust proficiency to account for allowed multiple base items proficiency
    await adjustProficiency(scope.rolledItem);
  } else if (
    args[0].tag === 'OnUse' &&
    args[0].macroPass === 'postActiveEffects'
  ) {
    const activateOrigin = scope.rolledItem.getFlag(
      MODULE_ID,
      ACTIVATE_ACTION_ORIGIN_FLAG
    );
    if (activateOrigin) {
      if (activateOrigin !== scope.macroItem.uuid) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | Wrong sourceItemUuid is different from the origin of activate feat item.`,
          scope.macroItem.uuid,
          activateOrigin
        );
        return;
      }
      await handleActivatePostActiveEffects(scope.macroItem, scope.rolledItem);
      return;
    }
    const adjustLightOrigin = scope.rolledItem.getFlag(
      MODULE_ID,
      ADJUST_LIGHT_RADIUS_ACTION_ORIGIN_FLAG
    );
    if (adjustLightOrigin) {
      if (adjustLightOrigin !== scope.macroItem.uuid) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | Wrong sourceItemUuid is different from the origin of adjust light radius feat item.`,
          scope.macroItem.uuid,
          adjustLightOrigin
        );
        return;
      }
      await handleAdjustLightRadiusPostActiveEffects(workflow, scope.macroItem);
      return;
    }
  }

  /**
   * Handles the postActiveEffects of the Sun Blade - Activate/Deactivate feat.
   * If the Sun Blade is not activated:
   *   Activates the blade by creating a Blade Activation effect that applies the blade's light radius effect.
   * If the blade is activated:
   *   Deletes the Blade Activation effect.
   *
   * @param {Item5e} sourceItem - The Sun Blade item.
   * @param {Item5e} usedItem - The activate/deactivate blade item.
   */
  async function handleActivatePostActiveEffects(sourceItem, usedItem) {
    // Get item with activate item origin flag
    const activated = sourceItem.getFlag(MODULE_ID, ACTIVATED);

    if (activated) {
      // Delete the effect, which will deactivate blade and remove adjust action
      sourceItem.actor?.effects
        .find(
          (ae) =>
            ae.origin === sourceItem.uuid && ae.getFlag(MODULE_ID, ACTIVATED)
        )
        ?.delete();
    } else {
      // Add active effect for blade activation
      await createBladeActivationEffect(
        sourceItem,
        usedItem?.getFlag('tidy5e-sheet', 'section')
      );
    }
  }

  /**
   * Handles the postActiveEffects of the Sun Blade - Adjust light radius feat.
   * Prompts the owner to choose between enlarge or reduce. If the alt key is pressed,
   * enlarge is automatically chosen, and if ctrl key is pressed, reduce is automatically chosen.
   * Then applies the change to the light radius on the Blade Activation effect.
   * The radius can only be enlarged/reduced up to a maximum/minimum.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current MidiQOL workflow.
   * @param {Item5e} sourceItem - The Sun Blade item.
   */
  async function handleAdjustLightRadiusPostActiveEffects(
    currentWorkflow,
    sourceItem
  ) {
    const activationEffect = sourceItem.actor?.effects.find(
      (ae) => ae.origin === sourceItem.uuid && ae.getFlag(MODULE_ID, ACTIVATED)
    );
    if (!activationEffect) {
      return;
    }
    const currentLightRadius =
      activationEffect.getFlag(MODULE_ID, LIGHT_RADIUS) ?? INITIAL_LIGHT_RADIUS;
    const choices = [];
    const buttons = {};
    if (currentLightRadius < MAX_LIGHT_RADIUS) {
      choices.push(ENLARGE_CHOICE);
      buttons.enlarge = { label: 'Enlarge' };
    }
    if (currentLightRadius > MIN_LIGHT_RADIUS) {
      choices.push(REDUCE_CHOICE);
      buttons.reduce = { label: 'Reduce' };
    }
    let choice;
    // Shortcut to bypass dialog
    if (currentWorkflow.event?.altKey) {
      choice = ENLARGE_CHOICE;
    } else if (currentWorkflow.event?.ctrlKey) {
      choice = REDUCE_CHOICE;
    }
    if (!choice) {
      // Ask which option to apply
      const sourceName =
        sourceItem.getFlag(MODULE_ID, SOURCE_NAME) ?? DEFAULT_ITEM_NAME;
      choice = await Dialog.wait(
        {
          title: `${sourceName} - Enlarge/Reduce Light Radius`,
          content: `<p>Choose to enlarge or reduce the blade's light radius.</p>`,
          default: ENLARGE_CHOICE,
          buttons,
          close: () => null,
        },
        { classes: ['dialog', 'dnd5e'] }
      );
    }
    if (!choice) {
      return;
    }
    let adjustment = 0;
    if (choice === ENLARGE_CHOICE) {
      adjustment = 5;
    } else {
      adjustment = -5;
    }
    const newLightRadius =
      game.release.generation >= 12
        ? Math.clamp(
            currentLightRadius + adjustment,
            MIN_LIGHT_RADIUS,
            MAX_LIGHT_RADIUS
          )
        : Math.clamped(
            currentLightRadius + adjustment,
            MIN_LIGHT_RADIUS,
            MAX_LIGHT_RADIUS
          );

    const newChanges = foundry.utils.deepClone(activationEffect.changes ?? []);
    for (let change of newChanges) {
      if (['ATL.light.dim', 'ATL.light.bright'].includes(change.key)) {
        const newValue =
          change.key === 'ATL.light.dim' ? newLightRadius * 2 : newLightRadius;
        change.value = '' + newValue;
      }
    }
    const updates = { changes: newChanges };
    foundry.utils.setProperty(
      updates,
      `flags.${MODULE_ID}.${LIGHT_RADIUS}`,
      newLightRadius
    );
    await activationEffect.update(updates);

    let text;
    if (newLightRadius === MIN_LIGHT_RADIUS) {
      text = `The minimum bright and dim light radius was reached (${MIN_LIGHT_RADIUS}/${
        MIN_LIGHT_RADIUS * 2
      }).`;
    } else if (newLightRadius === MAX_LIGHT_RADIUS) {
      text = `The maximum bright and dim light radius was reached (${MAX_LIGHT_RADIUS}/${
        MAX_LIGHT_RADIUS * 2
      }).`;
    } else {
      text = `The bright and dim light radius was ${
        choice === ENLARGE_CHOICE ? 'increased' : 'decreased'
      } (${newLightRadius}/${newLightRadius * 2}).`;
    }
    await insertTextBeforeButtonsIntoMidiItemChatMessage(
      MidiQOL.getCachedChatMessage(currentWorkflow.itemCardUuid),
      text
    );
  }

  /**
   * Creates the blade activation/deactivation feat item.
   *
   * @param {Item5e} sourceItem - The Sun Blade item.
   * @param {string} tidy5eSection - Tidy5e section name to use for the created items.
   */
  async function createActivationAction(sourceItem, tidy5eSection) {
    const itemName = `${sourceItem.name}: Activate/Deactivate blade`;
    const activateActionItemData = {
      type: 'feat',
      name: itemName,
      img: sourceItem.img,
      system: {
        description: {
          value: 'Activate or deactivate the blade.',
        },
        activation: {
          type: 'bonus',
          cost: 1,
        },
        target: { type: 'self' },
      },
      flags: {
        'midi-qol': {
          onUseMacroName: `[postActiveEffects]ItemMacro.${sourceItem.uuid}`,
        },
        [MODULE_ID]: {
          [ACTIVATE_ACTION_ORIGIN_FLAG]: sourceItem.uuid,
        },
      },
    };
    // Support for Tidy 5e Sheets custom sections
    if (game.modules.get('tidy5e-sheet')?.active && tidy5eSection) {
      foundry.utils.setProperty(
        activateActionItemData,
        'flags.tidy5e-sheet.section',
        tidy5eSection
      );
    }
    // Add item that allows activating the blade
    await sourceItem.actor?.createEmbeddedDocuments('Item', [
      activateActionItemData,
    ]);
  }

  /**
   * Returns the effect data for the blade's activation.
   *
   * @param {Item5e} sourceItem - The Sun Blade item.
   * @param {string} tidy5eSection - Tidy5e section name to use for the created items.
   *
   * @returns {object} the active effect data for the blade's activation.
   */
  async function createBladeActivationEffect(sourceItem, tidy5eSection) {
    const imgPropName = game.release.generation >= 12 ? 'img' : 'icon';
    const itemMacroValue = tidy5eSection ? `"${tidy5eSection}"` : '';
    const bladeActivationEffectData = {
      changes: [
        {
          key: 'macro.itemMacro',
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: itemMacroValue,
          priority: '20',
        },
        {
          key: 'ATL.light.bright',
          mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
          value: '' + INITIAL_LIGHT_RADIUS,
          priority: '20',
        },
        {
          key: 'ATL.light.dim',
          mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
          value: '' + 2 * INITIAL_LIGHT_RADIUS,
          priority: '20',
        },
        {
          key: 'ATL.light.animation.type',
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: 'sunburst',
          priority: '20',
        },
        {
          key: 'ATL.light.animation.speed',
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: 1,
          priority: '20',
        },
        {
          key: 'ATL.light.animation.intensity',
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: 1,
          priority: '20',
        },
        {
          key: 'ATL.light.color',
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: '#a2642a',
          priority: '20',
        },
        {
          key: 'ATL.light.alpha',
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: 0.7,
          priority: '20',
        },
      ],
      [imgPropName]: sourceItem.img,
      name: `${sourceItem.name} - Activated`,
      origin: sourceItem.uuid,
      transfer: false,
      flags: {
        [MODULE_ID]: {
          [ACTIVATED]: true,
          [LIGHT_RADIUS]: INITIAL_LIGHT_RADIUS,
        },
        dae: { showIcon: true },
        // Add support for CPR VAE button
        'chris-premades': {
          effect: {
            noAnimation: false,
          },
          vae: {
            button: `${sourceItem.name}: Adjust light radius`,
          },
        },
      },
    };

    await sourceItem.actor?.createEmbeddedDocuments('ActiveEffect', [
      bladeActivationEffectData,
    ]);
  }

  /**
   * Activates the blade. It applies changes to the item to make it usable for attack.
   * It also create and add a feat to adjust the blade's light radius.
   *
   * @param {Item5e} sourceItem - The Sun Blade item.
   * @param {string} tidy5eSection - Tidy5e section name to use for the created items.
   */
  async function activateBlade(sourceItem, tidy5eSection) {
    // Activate blade
    const sourceName = sourceItem.name;
    const updates = {
      name: `${sourceItem.name} (active)`,
      system: {
        activation: {
          type: 'action',
          cost: 1,
        },
        target: {
          value: 1,
          type: 'creature',
        },
        actionType: 'mwak',
        properties: ['fin', 'mgc', 'ver'],
      },
      flags: {
        [MODULE_ID]: { [ACTIVATED]: true, [SOURCE_NAME]: sourceName },
      },
    };
    await sourceItem.update(updates);
    await createAdjustLightRadiusAction(sourceItem, tidy5eSection);
  }

  /**
   * Creates the adjust the blade's light radius feat item.
   * This feat is made dependent on the Blade Activation effect to be auto
   * removed when the effect is deleted.
   *
   * @param {Item5e} sourceItem - The Sun Blade item.
   * @param {string} tidy5eSection - Tidy5e section name to use for the created items.
   */
  async function createAdjustLightRadiusAction(sourceItem, tidy5eSection) {
    const sourceName =
      sourceItem.getFlag(MODULE_ID, SOURCE_NAME) ?? DEFAULT_ITEM_NAME;
    const itemName = `${sourceName}: Adjust light radius`;
    const adjustLightRadiusActionItemData = {
      type: 'feat',
      name: itemName,
      img: sourceItem.img,
      system: {
        description: {
          value: "Enlarge/Reduce the blade's light radius.",
        },
        activation: {
          type: 'action',
          cost: 1,
        },
        target: { type: 'self' },
      },
      flags: {
        'midi-qol': {
          onUseMacroName: `[postActiveEffects]ItemMacro.${sourceItem.uuid}`,
        },
        [MODULE_ID]: {
          [ADJUST_LIGHT_RADIUS_ACTION_ORIGIN_FLAG]: sourceItem.uuid,
        },
      },
    };
    // Support for Tidy 5e Sheets custom sections
    if (game.modules.get('tidy5e-sheet')?.active && tidy5eSection) {
      foundry.utils.setProperty(
        adjustLightRadiusActionItemData,
        'flags.tidy5e-sheet.section',
        tidy5eSection
      );
    }

    // Add item that allows adjusting the blade's light radius
    const [adjustLightRadiusActionItem] =
      await sourceItem.actor?.createEmbeddedDocuments('Item', [
        adjustLightRadiusActionItemData,
      ]);
    if (adjustLightRadiusActionItem) {
      // Add as a dependent to cleanup when AE is deleted
      await sourceItem.actor.effects
        .find(
          (ae) =>
            ae.origin === sourceItem.uuid && ae.getFlag(MODULE_ID, ACTIVATED)
        )
        ?.addDependent(adjustLightRadiusActionItem);
    }
  }

  /**
   * Deactivates the blade. It reverts the changes that were applied to make the item usable for attack.
   *
   * @param {Item5e} sourceItem - The Sun Blade item.
   */
  async function deactivateBlade(sourceItem) {
    if (!sourceItem) {
      // The item was deleted, no need to update it.
      return;
    }
    const updates = {
      name: sourceItem.getFlag(MODULE_ID, SOURCE_NAME) ?? DEFAULT_ITEM_NAME,
      system: {
        activation: {
          type: null,
          cost: null,
        },
        target: {
          value: null,
          type: null,
        },
        actionType: null,
        properties: ['mgc'],
      },
      flags: {
        [MODULE_ID]: { [ACTIVATED]: false },
      },
    };
    await sourceItem.update(updates);
  }

  /**
   * Inserts text into a Midi item chat message before the card buttons div and updates it.
   *
   * @param {ChatMessage5e} chatMessage - The MidiQOL item chat message to update
   * @param {string} text - The text to insert in the chat message.
   */
  async function insertTextBeforeButtonsIntoMidiItemChatMessage(
    chatMessage,
    text
  ) {
    let content = foundry.utils.deepClone(chatMessage.content);
    const searchRegex =
      /(<\/section>)(\s*<div class="card-buttons midi-buttons">)/m;
    const replaceString = `$1\n${text}\n$2`;
    content = content.replace(searchRegex, replaceString);
    await chatMessage.update({ content });
  }

  /**
   * Adjust the proficiency with the Sun Blade item depending on the current state of the item
   * and the proficiencies of the parent actor. This is used to take into account that the Sun Blade
   * supports proficency with long sword and short sword.
   *
   * @param {Item5e} sourceItem - The Sun Blade item.
   */
  async function adjustProficiency(sourceItem) {
    if (sourceItem.system.proficient === null) {
      if (!sourceItem.system.prof.multiplier && isProficient(sourceItem)) {
        // Force proficiency
        await sourceItem.update({ 'system.proficient': 1 });
      }
    } else if (
      sourceItem.system.proficient === 1 &&
      !isProficient(sourceItem)
    ) {
      // Force not proficiency
      await sourceItem.update({ 'system.proficient': 0 });
    } else if (sourceItem.system.proficient === 0 && isProficient(sourceItem)) {
      // Force proficiency
      await sourceItem.update({ 'system.proficient': 1 });
    }
  }

  /**
   * Validate that the item's parent is proficient with the Sun Blade.
   * An actor can be proficient if he has proficiency in long sword or short sword
   * .
   * @param {Item5e} sourceItem - The Sun Blade item.
   * @returns {boolean} Returns true if the item's parent is proficient with the Sun Blade, false otherwise.
   */
  function isProficient(sourceItem) {
    const actor = sourceItem.actor;
    if (!actor) {
      return false;
    }
    if (actor.type === 'npc') {
      return true; // NPCs are always considered proficient with any weapon in their stat block.
    }
    const config = CONFIG.DND5E.weaponProficienciesMap;
    const weaponType = sourceItem.system.type;
    const itemProf = config[weaponType.value];
    const actorProfs = actor.system.traits?.weaponProf?.value ?? new Set();
    const isProficient =
      actorProfs.has(itemProf) ||
      actorProfs.has(weaponType.baseItem) ||
      actorProfs.has('shortsword');
    return isProficient;
  }
}

;// CONCATENATED MODULE: ./scripts/automations/items/daggerOfVenom.js
// @bakanabaka
async function daggerOfVenom({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const macroItem = scope.macroItem;

  async function onEffect() {
    await macroItem.setFlag(
      'midi-qol',
      'onUseMacroName',
      '[postActiveEffects]ItemMacro'
    );
    let poisonEffect = macroItem.effects.find(
      (ef) => ef.name == macroItem.name
    );
    await poisonEffect.setFlag('dae', 'dontApply', false);

    const updates = {
      'system.formula': '2d10[poison]',
      'system.save.ability': 'con',
      'system.save.dc': 15,
    };
    await macroItem.update(updates);
  }

  async function offEffect() {
    await macroItem.setFlag('midi-qol', 'onUseMacroName', '');
    let poisonEffect = macroItem.effects.find(
      (ef) => ef.name == macroItem.name
    );
    await poisonEffect.setFlag('dae', 'dontApply', true);

    const updates = {
      'system.formula': '',
      'system.save.ability': '',
      'system.save.dc': undefined,
    };
    await macroItem.update(updates);
  }

  async function postActiveEffects() {
    let enableEffect = macroItem.effects.find(
      (ef) => !ef.name.includes(macroItem.name)
    );
    await enableEffect.update({ Suppressed: true, disabled: true });
  }

  const callArguments = {
    speaker: speaker,
    actor: actor,
    token: token,
    character: character,
    item: item,
    args: args,
    scope: scope,
  };
  await macroUtil.runWorkflows(callArguments, {
    on: onEffect,
    off: offEffect,
    postActiveEffects: postActiveEffects,
  });
}

;// CONCATENATED MODULE: ./scripts/automations/items/absorbingTattoo.js
// ##################################################################################################
// Author: Elwin#1410
// Read First!!!!
// Adds resistance to the tattoo damage type, and a reaction is triggered when the owner is damaged by the tattoo damage type,
// which adds immunity to that damage and heals the owner by 1/2 of the damage he would have taken.
// v1.0.0
// Dependencies:
//  - DAE
//  - Times Up
//  - MidiQOL "on use" actor macro [preItemRoll][preTargetDamageApplication]
//  - Elwin Helpers world script
//
// How to configure:
// The Equipement details must be:
//   - Equipment Type: Trinket
//   - Attunement: Attunement Required
//   - Activation cost: 1 Reaction
//   - Target: Self
//   - Action Type: (empty)
// The Equipment Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before the item is rolled
//   - Activation Conditions
//     - Reaction:
//       reaction === "isDamaged" && workflow.damageDetail.some(d => d.type === "<tattoo damage type>" && (d.value ?? d.damage) > 0)
//   - This item macro code must be added to the DIME code of this feat.
// Two effects must also be added:
//   - Absorbing Tattoo, <tattoo damage type>:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - system.traits.dr.value | Add | <tattoo damage type>
//   - Absorbing Tattoo, <tattoo damage type>:
//      - Transfer Effect to Actor on ItemEquip (unchecked)
//      - Duration: 1 Turn
//      - Special Duration: 1 Reaction: Expires after the attack that triggered the reaction is complete
//      - Effects:
//          - system.traits.di.value | Add | <tattoo damage type>
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,preTargetDamageApplication
//
// Usage:
// This item has a passive effect (when equipped and attuned) that adds a resistance to the tattoo damage type.
// It is also a reaction that gets triggered when appropriate.
//
// Description:
// In the preItemRoll (OnUse) (in Absorbing Tattoo's workflow) (on owner):
//   Validates that the item is equipped and attuned, otherwise aborts the item use.
// In the preTargetDamageApplication (TargetOnUse) (in attacker's workflow) (on owner):
//   Healing is added to an amount equivalent to 1/4 of the total damage inflicted of the tattoo damage type.
// ###################################################################################################

async function absorbingTattoo({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = 'Absorbing Tattoo';
  const MODULE_ID = 'midi-item-showcase-community';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.6'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers world script must be installed, active and have a version greater or equal than 2.6.0`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'times-up', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (
    !foundry.utils.isNewerVersion(
      game.modules.get('midi-qol')?.version,
      '11.6'
    ) &&
    !MidiQOL.configSettings().v3DamageApplication
  ) {
    ui.notifications.error(
      `${DEFAULT_ITEM_NAME} | dnd5e v3 damage application is required.`
    );
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }
  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preItemRoll') {
    let attuned = foundry.utils.isNewerVersion(game.system.version, '3.2')
      ? item.system.attuned
      : item.system.attunement === CONFIG.DND5E.attunementTypes.ATTUNED;
    if (!scope.rolledItem.system.equipped || !attuned) {
      // The Item must be equipped and attuned
      ui.notifications.warn(
        `${DEFAULT_ITEM_NAME} | The tattoo must be equipped and attuned.`
      );
      return false;
    }
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'preTargetDamageApplication'
  ) {
    const tattooType = getTattooType(scope.macroItem);
    const total = workflow.damageDetail.reduce(
      (acc, d) => acc + (d.type === tattooType ? d.value ?? d.damage : 0),
      0
    );
    // Note: its a quarter of the damage, because the description says half of what it would have taken without the reaction,
    // which would already be half due to resistance granted by the tattoo.
    workflow.damageItem.damageDetail.push({
      value: -1 * Math.floor(total / 4),
      type: tattooType,
      active: { absorption: true },
    });
    elwinHelpers.calculateAppliedDamage(workflow.damageItem);
  }

  /**
   * Returns the tattoo item's damage type.
   *
   * @param {Item5e} tattooItem - Absorbing Tattoo item
   * @returns {string} the tattoo damage type.
   */
  function getTattooType(tattooItem) {
    return (
      tattooItem?.effects
        .find((ae) => ae.transfer === true && ae.name === tattooItem.name)
        ?.changes.find((c) => c.key === 'system.traits.dr.value')?.value ??
      'acid'
    );
  }
}

;// CONCATENATED MODULE: ./scripts/automations/items/items.js












let items = {
  absorbingTattoo: absorbingTattoo,
  arrowCatchingShield: arrowCatchingShield,
  clockworkAmulet: clockworkAmulet,
  corpseSlayerLongbow: corpseSlayerLongbow,
  driftglobe: driftglobe,
  guardianEmblem: guardianEmblem,
  wandOfWinter: wandOfWinter,
  oathbow: oathbow,
  shieldOfMissileAttraction: shieldOfMissileAttraction/* shieldOfMissileAttraction */._,
  sunBlade: sunBlade,
  daggerOfVenom: daggerOfVenom,
};

;// CONCATENATED MODULE: ./scripts/automations/monsters/Banshee/horrifyingVisage.js
async function horrifyingVisage({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (item.name !== 'Horrifying Visage') return;

  const effectName = 'Horrifying Visage'; //that should match the effect name

  const sourceActor = fromUuidSync(
    actor.effects.getName(effectName).origin
  ).actor;

  if (!sourceActor) return;
  const sourceToken = sourceActor.token ?? sourceActor.getActiveTokens()[0];

  const distance = MidiQOL.computeDistance(token, sourceToken, true);

  if (!distance) return;

  const canSeeSource = MidiQOL.findNearby(null, token, distance, {
    isSeen: true,
  }).find((t) => t === sourceToken.object);

  if (!canSeeSource) return;

  workflow.saveDetails.disadvantage = true;
}

;// CONCATENATED MODULE: ./scripts/automations/monsters/Banshee/wail.js
async function wail({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (args[0].macroPass === 'preambleComplete') {
    if (workflow.targets.size === 0) return;
    let validTargets = [];
    for (let i of Array.from(workflow.targets)) {
      if (chrisPremades.helpers.raceOrType(i.actor) == 'undead') continue;
      if (chrisPremades.helpers.raceOrType(i.actor) == 'construct') continue;
      if (chrisPremades.helpers.findEffect(i.actor, 'Deafened')) continue;
      if (chrisPremades.helpers.findEffect(i.actor, 'Dead')) continue;
      validTargets.push(i.id);
    }
    chrisPremades.helpers.updateTargets(validTargets);
  }
  if (args[0].macroPass === 'postActiveEffects') {
    if (workflow.failedSaves.size === 0) return;
    let destroyTokens = [];
    for (let i of Array.from(workflow.failedSaves)) {
      destroyTokens.push(i);
      new Sequence()
        .effect()
        .atLocation(i)
        .file('jb2a.divine_smite.target.blueyellow')
        .play();
    }
    if (destroyTokens.length === 0) return;
    await chrisPremades.helpers.applyDamage(destroyTokens, '10000', 'none');
  }
}

;// CONCATENATED MODULE: ./scripts/automations/monsters/Banshee/banshee.js



let banshee = {
  horrifyingVisage: horrifyingVisage,
  wail: wail,
};

;// CONCATENATED MODULE: ./scripts/automations/monsters/Lich/negativeEnergyTether.js
// ##################################################################################################
// Author: Elwin#1410
// Read First!!!!
// When used, adds an effect on the target and on the owner. When the owner is damaged, a save is
// triggered on the tethered creature, if failed it takes half the owner's damage and the owners
// applied damage is reduced by half.
// v1.3.0
// Dependencies:
//  - DAE
//  - Times up
//  - MidiQOL "on use" actor macro [preTargetDamageApplication][postActiveEffects]
//  - Elwin Helpers world script
//  - Sequencer (optional)
//  - JB2A free or patreon (optional)
//
// Note: Midi must be configured to use DND5E damage calculation.
//
// How to configure:
// The Feature details must be:
//   - Feature Type: Monster Feature
//   - Activation cost: 1 Lair Action
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | After Active Effects
//   - This item macro code must be added to the DIME code of this feature.
// One effect must also be added:
//   - Negative Energy Tether:
//      - Transfer Effect to Actor on ItemEquip (unchecked)
//      - Apply to self when item applies target effects (checked)
//      - Duration: 1 Round
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,preTargetDamageApplication
//   - Negative Energy Tether:
//      - Transfer Effect to Actor on ItemEquip (unchecked)
//      - Duration: 1 Round
//
// Usage:
// This item needs to be used to activate. When activated the effects are applied.
//
// Description:
// In the postActiveEffects (item onUse) phase of Negative Energy Tether item (in owner's workflow):
//   Updates the self active effect to delete the target active effect when deleted and vice versa and
//   creates a sequencer effect between the owner and the target if the required modules are active.
// In the postActiveEffects (item onUse) phase of Negative Energy Tether: Share Damage item (in owner's workflow):
//   If the target failed its save, creates a chat message to explain why the damage applied to the owner from
//   the original attack was reduced.
// In the preTargetDamageApplication (TargetOnUse) phase (in attacker's workflow) (on owner):
//   Computes the damage to be shared with the tethered creature and executes a remote completeItemUse
//   to apply the damage on the tethered creature if it fails its save. If the remote workflow
//   completed sucessfully and the target failed its save, reduce the damage to be applied by the amount
//   shared with the tethered creature.
// ###################################################################################################

async function negativeEnergyTether({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = 'Negative Energy Tether';
  const MODULE_ID = 'midi-item-showcase-community';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;
  const JB2A_TETHER_BEAM = 'jb2a.energy_beam.normal.bluepink.03';

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.6'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'times-up', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }
  if (
    !foundry.utils.isNewerVersion(
      game.modules.get('midi-qol')?.version,
      '11.6'
    ) &&
    !MidiQOL.configSettings().v3DamageApplication
  ) {
    ui.notifications.error(
      `${DEFAULT_ITEM_NAME} | dnd5e v3 damage application is required.`
    );
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'postActiveEffects') {
    if (
      scope.rolledItem?.getFlag(MODULE_ID, 'negativeEnergyTetherShareDamage')
    ) {
      // The share damage feat
      await handleShareDamageOnUsePostActiveEffects(workflow, scope.macroItem);
    } else {
      // The original item
      await handleOnUsePostActiveEffects(workflow, scope.macroItem);
    }
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'preTargetDamageApplication'
  ) {
    await handleTargetOnUsePreTargetDamageApplication(
      workflow,
      scope.macroItem,
      actor
    );
  }

  /**
   * Handles the postActiveEffects of the Negative Energy Tether item.
   * Makes the self AE and target AE dependent on each others and
   * creates a sequencer effect between the owner and the target if the required modules are active.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Negative Energy Tether item.
   */
  async function handleOnUsePostActiveEffects(currentWorkflow, sourceItem) {
    if (currentWorkflow.applicationTargets.size < 1) {
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No effect applied to target.`);
      }
      return;
    }
    const tokenTarget = currentWorkflow.applicationTargets.first();
    const appliedEffect = tokenTarget.actor?.appliedEffects.find(
      (ae) => ae.origin === sourceItem.uuid
    );
    if (!appliedEffect) {
      if (debug) {
        console.warn(
          `${DEFAULT_ITEM_NAME} | No applied effect found on target actor.`
        );
      }
      return;
    }

    // Find AE on self to add delete flag
    const selfEffect = currentWorkflow.actor.effects.find(
      (ae) => ae.origin === sourceItem.uuid
    );
    if (!selfEffect) {
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No self effect found on actor.`);
      }
      return;
    }
    const changes = foundry.utils.deepClone(selfEffect.changes ?? []);
    changes.push({
      key: `flags.${MODULE_ID}.negativeEnergyTetherTarget`,
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: tokenTarget.document.uuid,
    });
    await selfEffect.update({ changes });
    await selfEffect.addDependent(appliedEffect);
    await MidiQOL.socket().executeAsGM('addDependent', {
      concentrationEffectUuid: appliedEffect.uuid,
      dependentUuid: selfEffect.uuid,
    });

    if (
      !game.modules.get('sequencer')?.active ||
      !foundry.utils.hasProperty(Sequencer.Database.entries, 'jb2a')
    ) {
      // Sequencer or JB2A not active
      return;
    }

    new Sequence()
      .effect()
      .origin(sourceItem.uuid)
      .file(JB2A_TETHER_BEAM)
      .attachTo(currentWorkflow.token)
      .stretchTo(tokenTarget, { attachTo: true })
      .persist()
      .play();
  }

  /**
   * Handles the postActiveEffects of the Negative Energy Tether: Share Damage item.
   * If the target failed its save, creates a chat message to explain why the owner of the feat did not take all the damage.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Negative Energy Tether item.
   */
  async function handleShareDamageOnUsePostActiveEffects(
    currentWorkflow,
    sourceItem
  ) {
    if (!currentWorkflow.aborted && !currentWorkflow.failedSaves?.size) {
      // Damage was not shared
      return;
    }

    // Add info to chat message to indicate why the target of the attack received less damage.
    const targetDivs = elwinHelpers.getTargetDivs(
      currentWorkflow.token,
      "Some of the <strong>${tokenName}</strong>'s damage"
    );
    const damageList = [];
    for (let damageEntry of currentWorkflow.damageDetail) {
      damageList.push(
        `${damageEntry.damage} ${
          CONFIG.DND5E.damageTypes[damageEntry.type]?.label ?? damageEntry.type
        }`
      );
    }
    const newTargetDivs = elwinHelpers.getTargetDivs(
      currentWorkflow.failedSaves.first(),
      `was shared with <strong>\${tokenName}</strong> by <strong>${
        sourceItem.name
      }</strong>: ${damageList.join(', ')}.`
    );
    const infoMsg = `${targetDivs}${newTargetDivs}`;
    MidiQOL.addUndoChatMessage(
      await ChatMessage.create({
        type:
          game.release.generation >= 12
            ? CONST.CHAT_MESSAGE_STYLES.OTHER
            : CONST.CHAT_MESSAGE_TYPES.OTHER,
        content: infoMsg,
        speaker: ChatMessage.getSpeaker({
          actor: currentWorkflow.actor,
          token: currentWorkflow.token,
        }),
        whisper: ChatMessage.getWhisperRecipients('GM').map((u) => u.id),
      })
    );
  }

  /**
   * Computes the damage to be shared with the tethered creature and executes a remote completeItemUse
   * to apply the damage on the tethered creature if it fails its save. If the remote workflow
   * completed sucessfully and the target failed its save, reduce the damage to be applied by the amount
   * shared with the tethered creature.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Negative Energy Tether item.
   * @param {Actor5e} targetActor - The owner of the Negative Energy Tether item that was damaged.
   */
  async function handleTargetOnUsePreTargetDamageApplication(
    currentWorkflow,
    sourceItem,
    targetActor
  ) {
    let appliedDamage = currentWorkflow.damageItem?.appliedDamage;
    if (!appliedDamage) {
      // compute total damage applied to target
      appliedDamage = currentWorkflow.damageItem?.damageDetail.reduce(
        (amount, d) =>
          amount +
          (!(d.value > 0) || ['temphp', 'midi-none'].includes(d.type)
            ? 0
            : d.value),
        0
      );
    }

    if (!(appliedDamage > 0)) {
      // No damage, skip
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No damage, skip tethered effect.`);
      }
      return;
    }
    const damageItem = currentWorkflow.damageItem;
    let damageToApply = 0;
    const damageToTether = [];

    // Note: in case of multiple damage types, the damage applied to the lich may not be exactly: applied damage / 2 rounded down.
    // It could be a little bit lower due to rounding each damage type divided by half, that's why we have to do a second pass to make it right.
    for (let damageEntry of damageItem.damageDetail) {
      if (
        !(damageEntry.value > 0) ||
        ['temphp', 'midi-none'].includes(damageEntry.type)
      ) {
        continue;
      }
      const lichDamage = Math.floor(damageEntry.value / 2);
      damageToApply += lichDamage;
      const damageValue = damageEntry.value - lichDamage;
      damageToTether.push({ value: damageValue, type: damageEntry.type });
    }

    // When there is multiple damage types, rounding each type can reduce too much
    // the damage to the Lich. This adds back 1 damage on the type which has a greater value,
    // until the target damage to apply is reached.
    const targetDamageToApply = Math.floor(appliedDamage / 2);
    while (targetDamageToApply > damageToApply) {
      const maxIndex = indexOfMaxDamageEntryValue(damageToTether);
      damageToTether[maxIndex].value -= 1;
      damageToApply += 1;
    }

    // Build the shared damage to apply to the tethered creature.
    const damageParts = [];
    for (let damageEntry of damageToTether) {
      damageParts.push([
        `(${damageEntry.value}[${damageEntry.type}])`,
        damageEntry.type,
      ]);
    }

    const featData = {
      type: 'feat',
      name: `${sourceItem.name} - Share Damage`,
      img: sourceItem.img,
      system: {
        actionType: 'save',
        damage: { parts: damageParts },
        target: { type: 'creature', value: 1 },
        save: { ability: 'con', dc: 18, scaling: 'flat' },
      },
      flags: {
        midiProperties: {
          saveDamage: 'nodam',
        },
        'midi-qol': {
          onUseMacroName: `[postActiveEffects]ItemMacro.${sourceItem.uuid}`,
        },
        [MODULE_ID]: {
          negativeEnergyTetherShareDamage: true,
        },
      },
    };
    const feat = new CONFIG.Item.documentClass(featData, {
      parent: targetActor,
      temporary: true,
    });

    const tetheredTokenUuid = targetActor.getFlag(
      MODULE_ID,
      'negativeEnergyTetherTarget'
    );
    const options = {
      targetUuids: [tetheredTokenUuid],
      configureDialog: false,
      workflowOptions: {
        fastForwardDamage: true,
        targetConfirmation: 'none',
        autoRollDamage: 'always',
      },
      workflowData: true,
    };

    // If the target is associated to a GM user roll item in this client, otherwise send the item roll to user's client
    let player = MidiQOL.playerForActor(targetActor);
    if (!player?.active) {
      // Find first active GM player
      player = game.users?.activeGM;
    }
    if (!player) {
      console.error(
        `${DEFAULT_ITEM_NAME} | Could not find player for actor ${targetActor}`
      );
      return;
    }

    const data = {
      itemData: feat.toObject(),
      actorUuid: targetActor.uuid,
      targetUuids: options.targetUuids,
      options,
    };

    const otherWorkflowData = await MidiQOL.socket().executeAsUser(
      'completeItemUse',
      player.id,
      data
    );
    if (debug) {
      console.warn(
        `${DEFAULT_ITEM_NAME} | Share damage workflow data.`,
        otherWorkflowData
      );
    }

    // Reduce Lich damage if the save was failed.
    if (
      !otherWorkflowData.aborted &&
      otherWorkflowData.failedSaveUuids?.length
    ) {
      elwinHelpers.reduceAppliedDamage(
        damageItem,
        appliedDamage - damageToApply,
        sourceItem
      );
    }
  }

  /**
   * Returns the index of the damage entry with the highest damage value.
   *
   * @param {object[]} damageDetails - Array of damage entries.
   * @returns {number} the index of damage entry with the highest damage value.
   */
  function indexOfMaxDamageEntryValue(damageDetails) {
    if (damageDetails.length === 0) {
      return -1;
    }

    let max = damageDetails[0].value;
    let maxIndex = 0;

    for (let i = 1; i < damageDetails.length; i++) {
      if (damageDetails[i].value > max) {
        maxIndex = i;
        max = damageDetails[i].value;
      }
    }

    return maxIndex;
  }
}

;// CONCATENATED MODULE: ./scripts/automations/monsters/Lich/lich.js


let lich = {
  negativeEnergyTether: negativeEnergyTether,
};

;// CONCATENATED MODULE: ./scripts/automations/monsters/ShieldGuardian/spellStoring.js
async function spellStoring({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (!game.modules.get('warpgate').active) {
    ui.notifications.error('This macro requires Warp Gate!');
  }
  const listSource = canvas.tokens.controlled[0].actor;
  const levelFormat = (spell) => {
    if (spell.system.level === 0) {
      return spell.name + ' (Cantrip)';
    } else if (spell.system.level === 1) {
      return spell.name + ' (1st)';
    } else if (spell.system.level === 2) {
      return spell.name + ' (2nd)';
    } else if (spell.system.level === 3) {
      return spell.name + ' (3rd)';
    } else if (spell.system.level === 4) {
      return spell.name + ' (4th)';
    }
  }; // format warp gate menu
  const currentSpells = actor.items
    .filter((a) => a.type == 'spell')
    .map((a) => a.id); // grab current spell list and format to array
  const menuButtons = [
    { label: 'Cancel', value: false },
    { label: 'OK', value: true },
  ]; // set up menus
  const secondMenuButtons = [
    { label: 'No', value: false },
    { label: 'Yes', value: true },
  ]; // set up menus
  const spells = listSource.items
    .filter(
      (a) =>
        a.type == 'spell' &&
        a.system.level <= 4 &&
        (a.system.level == 0 ||
          a.system.preparation.prepared == true ||
          a.system.preparation.mode == 'atwill' ||
          a.system.preparation.mode == 'pact')
    )
    .map((a) => {
      // grab various states of spell prep incl. items on spells
      if (a.system.uses.max == '') {
        return {
          html: levelFormat(a),
          value: [
            a.id,
            a.system.level,
            a.system.preparation.mode,
            a.system.scaling,
          ],
        };
      } else if (a.system.uses.max != '') {
        return {
          html: a.name,
          value: [a.id, 'uses', a.system.preparation.mode, a.system.scaling],
        };
      }
      return a;
    })
    .sort(function (a, b) {
      if (a.html < b.html) {
        return -1;
      }
      if (a.html > b.html) {
        return 1;
      }
      return 0;
    }); // sort alphabetically
  const chosenSpell = await warpgate.menu(
    {
      // pick a spell
      inputs: [
        {
          type: 'info',
          label:
            '<p align="center">The golem stands still, helmet looking straight ahead...<br />Source: ' +
            listSource.name +
            '</p>',
        },
        {
          type: 'select',
          label: 'Select a spell to store',
          options: spells,
        },
      ],
      buttons: menuButtons,
    },
    {
      title: 'Spell Storing',
    }
  );

  const spellFromList = listSource.items.filter(
    (a) => a.id == chosenSpell.inputs[1][0]
  )[0]; // generate array
  const spellLevel = spellFromList.system.level; // grab spell level for slots
  let toCreate = []; // empty array for embeddedDocuments
  let clone = structuredClone(spellFromList);
  toCreate.push(clone);

  if (chosenSpell.buttons == false) {
    // set behavior for menu disposition beginning with no spell selected
    ui.notifications.info('No spell selected.');
    return;
  } else if (
    chosenSpell.buttons == true &&
    chosenSpell.inputs[1][1] == 'pact'
  ) {
    // check for pact slots
    if (listSource.system.spells.pact.value < 1) {
      ui.notifications.warn('Not enough pact magic slots!');
      return;
    }
  } else if (
    chosenSpell.buttons == true &&
    chosenSpell.inputs[1][1] == 'uses'
  ) {
    // check for item uses
    if (spellFromList.system.uses.value < 1) {
      ui.notifications.warn('Not enough item uses!');
      return;
    }
  } else {
    // check for spell slots
    if (listSource.system.spells['spell' + spellLevel] < 1) {
      ui.notifications.warn('Not enough spell slots!');
      return;
    }
  }

  if (chosenSpell.inputs[1][3].mode != 'none') {
    // do we want to upcast this spell?
    const upcastSlots = Object.keys(listSource.system.spells)
      .filter(
        (a) =>
          a.charAt(5) != '0' &&
          listSource.system.spells[a].value > 0 &&
          Number(a.charAt(5)) > spellLevel
      )
      .map((a) => {
        if (a != 'pact') {
          return {
            html: 'Level ' + a.charAt(5),
            value: [Number(a.charAt(5)), listSource.system.spells[a].value],
          };
        } else if (a === 'pact') {
          return {
            html: 'Spell uses Pact Magic',
            value: [
              Number(listSource.system.spells[a].level),
              listSource.system.spells[a].value,
            ],
          };
        }
        return a;
      });
    const upcastSelector = await warpgate.menu(
      {
        inputs: [
          {
            type: 'info',
            label:
              '<p align="center">Do you want to upcast this spell?<br /><b>Always</b> select pact magic option if you are a Warlock.</p>',
          },
          {
            type: 'select',
            label: 'Select an upcast level<br />Spell level: ' + spellLevel,
            options: upcastSlots,
          },
        ],
        buttons: secondMenuButtons,
      },
      {
        title: 'Spell Storing',
      }
    );
    toCreate[0].system.level = upcastSelector.inputs[1][0];
  }

  toCreate[0].system.components.vocal = false;
  toCreate[0].system.components.somatic = false;
  toCreate[0].system.components.material = false;
  toCreate[0].system.components.ritual = false;
  toCreate[0].system.materials.consumed = false;
  toCreate[0].system.materials.cost = 0;
  toCreate[0].system.materials.supply = 0;
  toCreate[0].system.materials.value = '';
  toCreate[0].system.preparation.mode = 'atwill';
  toCreate[0].system.preparation.prepared = true;
  toCreate[0].system.uses.max = 1;
  toCreate[0].system.uses.value = 1;
  toCreate[0].system.uses.prompt = true;
  toCreate[0].system.uses.per = 'charges';

  if (spellFromList.system.preparation.mode == 'pact') {
    // decrement spell slots
    let levelUsed = getProperty(listSource.data.data, spells.pact.value);
    await listSource.update({
      [system.spells.pact.value]: Math.abs(levelUsed - 1),
    });
  } else if (spellFromList.system.uses.value !== null) {
    spellFromList.system.uses.value--;
  } else if (spellLevel != 0) {
    let levelUsed = getProperty(
      listSource.data.data,
      `spells.spell${toCreate[0].system.level}.value`
    );
    await listSource.update({
      [`system.spells.spell${toCreate[0].system.level}.value`]: Math.abs(
        levelUsed - 1
      ),
    });
  }

  await actor.deleteEmbeddedDocuments('Item', currentSpells); // remove old spell
  await actor.createEmbeddedDocuments('Item', toCreate); // create new spell
}

;// CONCATENATED MODULE: ./scripts/automations/monsters/ShieldGuardian/shieldGuardian.js


let shieldGuardian = {
  spellStoring: spellStoring,
};

;// CONCATENATED MODULE: ./scripts/automations/monsters/Vampire/bite.js
async function bite({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const {
    value: damage,
    active: { multiplier: damageMultiplier },
  } = workflow.damageItem.damageDetail.find((d) => d.type === 'necrotic') || {};
  if (damage && workflow.hitTargets.size === 1) {
    const dmgToApply = Math.floor(damage * damageMultiplier);
    await MidiQOL.applyTokenDamage(
      [
        {
          damage: dmgToApply,
          type: 'healing',
        },
      ],
      dmgToApply,
      new Set([token]),
      null,
      null
    );
  }
}

;// CONCATENATED MODULE: ./scripts/automations/monsters/Vampire/move.js
async function move({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Based on animation shared by Janner3D (https://discord.com/channels/915186263609454632/1187930136016859186)
  // Requires Sequencer, JB2A, D&D5E Animations (optional, for sound effect)

  const location = await Sequencer.Crosshair.show({
    label: {
      text: 'Move to',
    },
    location: {
      obj: token,
      limitMaxRange: 30,
    },
  });

  if (!location) {
    return;
  }

  new Sequence()

    .effect()
    .atLocation(token)
    .file('jb2a.bats.loop.01.red')
    .scaleToObject()
    .playbackRate(2)
    .tint('#0a0a0a')
    .fadeIn(500)
    .fadeOut(500)
    .elevation(0)

    .sound()
    .file('modules/dnd5e-animations/assets/sounds/Spells/Fear.mp3')
    .volume(0.2)
    .fadeInAudio(100)
    .fadeOutAudio(2000)
    .timeRange(800, 2850)

    .effect()
    .file('jb2a.gust_of_wind.default')
    .atLocation(token)
    .stretchTo(location)
    .elevation(0)
    .scale(1.0, 0.5)
    .playbackRate(2)
    .tint('#0a0a0a')
    .fadeIn(500)
    .fadeOut(500)

    .animation()
    .on(token)
    .fadeOut(250)
    .teleportTo(location)
    .snapToGrid()
    .waitUntilFinished(800)

    .effect()
    .file('jb2a.bats.loop.01.red')
    .atLocation(token)
    .scaleToObject()
    .playbackRate(2)
    .tint('#0a0a0a')
    .fadeIn(500)
    .fadeOut(500)

    .animation()
    .delay(1000)
    .on(token)
    .fadeIn(250)

    .play();
}

;// CONCATENATED MODULE: ./scripts/automations/monsters/Vampire/shapechanger.js
async function shapechanger({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
}) {
  const vampireForm = {};
  let tokenImg;
  if (game.modules.get('jb2a_patreon')?.active) {
    tokenImg =
      'modules/jb2a_patreon/Library/1st_Level/Fog_Cloud/FogCloud_01_White_800x800.webm';
  } else if (game.modules.get('JB2A_DnD5e')?.active) {
    tokenImg =
      'modules/JB2A_DnD5e/Library/1st_Level/Fog_Cloud/FogCloud_01_White_800x800.webm';
  }
  const imgPropName = game.version < 12 ? 'icon' : 'img';
  const mistForm = {
    mutation: 'Mist Form',
    token: {
      name: 'Cloud of Mist',
      //scale: 1.5,
      width: 1,
      height: 1,
      img: tokenImg,
      tint: '#B0B0B0',
    },
    actor: {
      system: {
        traits: {
          size: 'med',
          languages: { custom: "Can't speak" },
          di: { value: ['nonmagic'] },
        },
        attributes: {
          movement: { walk: 0, climb: 0, fly: 20, hover: true },
        },
      },
    },
    embedded: {
      Item: {
        'Bite (Bat or Vampire Form Only)': warpgate.CONST.DELETE,
        Bite: warpgate.CONST.DELETE,
        'Unarmed Strike (Vampire Form Only)': warpgate.CONST.DELETE,
        'Unarmed Strike': warpgate.CONST.DELETE,
        'Multiattack (Vampire Form Only)': warpgate.CONST.DELETE,
      },
      ActiveEffect: {
        'Mist Form': {
          [imgPropName]: 'icons/svg/acid.svg',
          changes: [
            {
              key: 'flags.midi-qol.advantage.ability.save.str',
              mode: 0,
              value: 1,
              priority: 0,
            },
            {
              key: 'flags.midi-qol.advantage.ability.save.dex',
              value: 1,
              mode: 0,
              priority: 0,
            },
            {
              key: 'flags.midi-qol.advantage.ability.save.con',
              value: 1,
              mode: 0,
              priority: 0,
            },
          ],
        },
      },
    },
  };
  const batForm = {
    mutation: 'Bat Form',
    token: {
      name: 'Vampire Bat',
      scale: 0.75,
      img: 'systems/dnd5e/tokens/beast/Bat.webp',
    },
    actor: {
      system: {
        traits: {
          size: 'tiny',
          languages: { custom: "Can't speak" },
        },
        attributes: {
          movement: { fly: 30, walk: 5, hover: true },
        },
      },
    },
    embedded: {
      Item: {
        'Unarmed Strike (Vampire Form Only)': warpgate.CONST.DELETE,
        'Unarmed Strike': warpgate.CONST.DELETE,
        'Multiattack (Vampire Form Only)': warpgate.CONST.DELETE,
      },
    },
  };

  const buttonData = {
    buttons: [
      {
        label: 'Bat Form',
        value: {
          update: batForm,
        },
      },
      {
        label: 'Cloud of Mist',
        value: {
          update: mistForm,
        },
      },
      {
        label: 'Vampire Form',
        value: {
          update: vampireForm,
        },
      },
    ],
  };
  let choice = await warpgate.buttonDialog(buttonData);
  console.log(choice);
  const options = {
    comparisonKeys: { ActiveEffect: 'label' },
    name: choice.update.mutation,
  };
  let updates = choice.update;

  async function transform(token) {
    new Sequence().animation().on(token).fadeOut(0).waitUntilFinished().play();

    await warpgate.revert(token.document);

    new Sequence()

      .sound()
      .file('modules/dnd5e-animations/assets/sounds/Spells/Fear.mp3') // sound file from D&D5E Animations module
      .volume(0.2)
      .timeRange(800, 2850)

      .effect()
      .file('jb2a.bats.loop.01.red')
      .atLocation(token)
      .size(3, { gridUnits: true })
      .playbackRate(1.5)
      .fadeOut(250)

      .effect()
      .file('jb2a.smoke.puff.centered.grey.0')
      .atLocation(token)
      .tint('#0a0a0a')

      .play();

    await warpgate.wait(100);
    await warpgate.mutate(token.document, updates, {}, options);

    new Sequence().animation().on(token).fadeIn(250).play();
  }

  // If the chosen form is neither Bat Form nor Cloud of Mist, revert the mutation
  await transform(token);
}

;// CONCATENATED MODULE: ./scripts/automations/monsters/Vampire/vampire.js




let vampire = {
  bite: bite,
  move: move,
  shapechanger: shapechanger,
};

;// CONCATENATED MODULE: ./scripts/automations/monsters/GoblinPsiCommander/psionicShield.js
// ##################################################################################################
// Author: Elwin#1410
// Read First!!!!
// Adds a third party reaction active effect, that effect will trigger a reaction by the owner of the feat
// when himself or a creature within range is hit to allow him to add an AC bonus that could
// turn the hit into a miss.
// v1.0.0
// Dependencies:
//  - DAE
//  - MidiQOL "on use" actor macro [preTargeting][tpr.isHit]
//  - Elwin Helpers world script
//
// How to configure:
// The Feature details must be:
//   - Feature Type: Monster Feature
//   - Activation cost: 1 Reaction
//   - Target: 1 Ally (RAW it's Creature, but use Ally to trigger reaction only on allies)
//   - Range: 15 feet
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - Activation Conditions
//     - Reaction:
//       reaction === "tpr.isHit" && !workflow.isCritical
//   - This item macro code must be added to the DIME code of this feat.
// Two effects must also be added:
//   - Psionic Shield:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,tpr.isHit|post=true
//   - Psionic Shield - AC Bonus:
//      - Transfer Effect to Actor on ItemEquip (unchecked)
//      - Duration: 1 Turn
//      - Special Duration: Is Attacked
//      - Effects:
//          - system.attributes.ac.bonus | Add | +3
//
// Usage:
// This item has a passive effect that adds a third party reaction active effect.
// It is also a reaction item that gets triggered by the third party reaction effect when appropriate.
//
// Description:
// In the preTargeting (item OnUse) phase of the Psionic Shield item (in owner's workflow):
//   Validates that item was triggered by the remote tpr.isHit target on use,
//   otherwise the item workflow execution is aborted.
// In the tpr.isHit (TargetOnUse) post macro (in attacker's workflow) (on owner or other target):
//   If the reaction was used and completed successfully, the current workflow check hits it re-executed to
//   taken into account the AC bonus and validate if the attack is still a hit.
// ###################################################################################################

async function psionicShield({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = 'Psionic Shield';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.2'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    return handleOnUsePreTargeting(workflow, scope.macroItem);
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isHit.post'
  ) {
    if (!token) {
      // No target
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No target token.`);
      }
      return;
    }
    // Other target, handle reaction
    await handleTargetOnUseIsHitPost(
      workflow,
      token,
      scope.macroItem,
      options?.thirdPartyReactionResult
    );
  }

  /**
   * Handles the preTargeting phase of the Psionic Shield item.
   * Validates that the reaction was triggered by the tpr.isHit phase.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Psionic Shield item.
   *
   * @returns {boolean} true if all requirements are fulfilled, false otherwise.
   */
  function handleOnUsePreTargeting(currentWorkflow, sourceItem) {
    if (
      currentWorkflow.options?.thirdPartyReaction?.trigger !== 'tpr.isHit' ||
      !currentWorkflow.options?.thirdPartyReaction?.itemUuids?.includes(
        sourceItem.uuid
      )
    ) {
      // Reaction should only be triggered by third party reaction effect
      const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature or the owner is hit.`;
      ui.notifications.warn(msg);
      return false;
    }
    return true;
  }

  /**
   * Handles the tpr.isHit post reaction of the Psionic Shield item in the triggering midi-qol workflow.
   * If the reaction was used and completed successfully, re-execute checkHits to see if the added AC bonus
   * could convert a hit on the target into a miss.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem - The Psionic Shield item.
   * @param {object} thirdPartyReactionResult - The third party reaction result.
   */
  async function handleTargetOnUseIsHitPost(
    currentWorkflow,
    sourceItem,
    thirdPartyReactionResult
  ) {
    if (debug) {
      console.warn(DEFAULT_ITEM_NAME + ' | reaction result', {
        thirdPartyReactionResult,
      });
    }
    if (thirdPartyReactionResult?.uuid !== sourceItem.uuid) {
      return;
    }

    // Recompute checkHits to take into account the AC bonus
    currentWorkflow.checkHits({
      noProvokeReaction: true,
      noOnUseMacro: true,
      noTargetOnuseMacro: true,
    });
  }
}

;// CONCATENATED MODULE: ./scripts/automations/monsters/GoblinPsiCommander/goblinPsiCommander.js


let goblinPsiCommander = {
  psionicShield: psionicShield,
};

;// CONCATENATED MODULE: ./scripts/automations/monsters/monsters.js






let monsters = {
  banshee: banshee,
  goblinPsiCommander: goblinPsiCommander,
  lich: lich,
  shieldGuardian: shieldGuardian,
  vampire: vampire,
};

;// CONCATENATED MODULE: ./scripts/automations/raceFeatures/Human/vigilantGuardian.js
// ##################################################################################################
// Author: Elwin#1410
// Read First!!!!
// Adds a third party reaction active effect, that effect will trigger a reaction by the Mark of Sentinel Human
// when a creature within range is hit to allow him to switch places with the target.
// v3.1.0
// Dependencies:
//  - DAE
//  - MidiQOL "on use" actor macro [preTargeting][tpr.isHit]
//  - Helwin Helpers world script
//
// How to configure:
// The Feature details must be:
//   - Feature Type: Race Feature
//   - Activation cost: 1 Reaction
//   - Target: 1 Ally (RAW it's Creature, but use Ally to trigger reaction only on allies)
//   - Range: 5 Feet
//   - Limited Uses: 1 of 1 per Long Rest
//   - Uses Prompt: (checked)
//   - Action Type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | Called before targeting is resolved
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - Activation Conditions
//     - Reaction:
//       reaction === "tpr.isHit"
//   - This item macro code must be added to the DIME code of this feature.
// One effect must also be added:
//   - Vigilant Guardian:
//      - Transfer Effect to Actor on ItemEquip (checked)
//      - Effects:
//          - flags.midi-qol.onUseMacroName | Custom | ItemMacro,tpr.isHit|ignoreSelf=true;canSee=true;post=true
//
// Usage:
// This item has a passive effect that adds a third party reaction active effect.
// It is also a reaction item that gets triggered by the third party reaction effect when appropriate.
//
// Description:
// In the preTargeting (item OnUse) phase of the Vigilant Guardian item (in owner's workflow):
//   Validates that item was triggered by the remote tpr.isHit target on use,
//   otherwise the item workflow execution is aborted.
// In the tpr.isHit (TargetOnUse) post macro (in attacker's workflow) (on other target):
//   If the reaction was used and completed successfully, the current workflow target is switched to the owner
//   of the Vigilant Guardian item.
// ###################################################################################################

async function vigilantGuardian({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the feature
  const DEFAULT_ITEM_NAME = 'Vigilant Guardian';
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.2'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'preTargeting') {
    return handleOnUsePreTargeting(workflow, scope.macroItem);
  } else if (
    args[0].tag === 'TargetOnUse' &&
    args[0].macroPass === 'tpr.isHit.post'
  ) {
    if (!token) {
      // No target
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No target token.`);
      }
      return;
    }
    await handleTargetOnUseIsHitPost(
      workflow,
      token,
      scope.macroItem,
      options?.thirdPartyReactionResult
    );
  }

  /**
   * Handles the preTargeting phase of the Vigilant Guardian item midi-qol workflow.
   * Validates that the reaction was triggered by the tpr.isHit remote reaction.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Item5e} sourceItem The Vigilant Guardian item.
   *
   * @returns {boolean} true if all requirements are fulfilled, false otherwise.
   */
  function handleOnUsePreTargeting(currentWorkflow, sourceItem) {
    if (
      currentWorkflow.options?.thirdPartyReaction?.trigger !== 'tpr.isHit' ||
      !currentWorkflow.options?.thirdPartyReaction?.itemUuids?.includes(
        sourceItem.uuid
      )
    ) {
      // Reaction should only be triggered by third party reaction effect
      const msg = `${DEFAULT_ITEM_NAME} | This reaction can only be triggered when a nearby creature of the owner is hit.`;
      ui.notifications.warn(msg);
      return false;
    }
    return true;
  }

  /**
   * Handles the tpr.isHit post macro of the Vigilant Guardian item in the triggering midi-qol workflow.
   * If the reaction was used and completed successfully, the target is changed to the owner of the Vigilant Guardian.
   *
   * @param {MidiQOL.Workflow} currentWorkflow - The current midi-qol workflow.
   * @param {Token5e} targetToken - The target token that is hit.
   * @param {Item5e} sourceItem - The Vigilant Guardian item.
   * @param {object} thirdPartyReactionResult - The third party reaction result.
   */
  async function handleTargetOnUseIsHitPost(
    currentWorkflow,
    targetToken,
    sourceItem,
    thirdPartyReactionResult
  ) {
    if (debug) {
      console.warn(DEFAULT_ITEM_NAME + ' | reaction result', {
        thirdPartyReactionResult,
      });
    }
    if (thirdPartyReactionResult?.uuid !== sourceItem.uuid) {
      return;
    }

    const sourceActor = sourceItem.actor;

    if (!sourceActor || !targetToken) {
      console.error(
        `${DEFAULT_ITEM_NAME} | Missing sourceActor or targetToken`,
        { sourceActor, targetToken }
      );
      return;
    }

    const sourceToken = MidiQOL.tokenForActor(sourceActor);
    if (!sourceToken) {
      if (debug) {
        console.warn(`${DEFAULT_ITEM_NAME} | No source token could be found.`);
      }
      return;
    }

    // Change target
    currentWorkflow.targets.delete(targetToken);
    currentWorkflow.targets.add(sourceToken);
    if (currentWorkflow.hitTargets.delete(targetToken)) {
      currentWorkflow.hitTargets.add(sourceToken);
    }
    if (currentWorkflow.hitTargetsEC.delete(targetToken)) {
      currentWorkflow.hitTargetsEC.add(sourceToken);
    }

    const previousIsCritical = currentWorkflow.isCritical;

    const configSettings = MidiQOL.configSettings();

    // Reprocess critical flags for new target
    currentWorkflow.processCriticalFlags();

    // Keep previous data because displayTargets clear the current data
    const previousHitData =
      currentWorkflow.hitDisplayData[targetToken.document.uuid] ?? {};

    // Display new target
    await currentWorkflow.displayTargets(currentWorkflow.whisperAttackCard);

    // Set hitDisplay that was cleared by displayTargets
    if (currentWorkflow.hitDisplayData[sourceToken.document.uuid]) {
      const hitDisplay =
        currentWorkflow.hitDisplayData[sourceToken.document.uuid];
      hitDisplay.hitStyle = previousHitData.hitStyle;
      hitDisplay.hitSymbol = previousHitData.hitSymbol;
      hitDisplay.hitClass = previousHitData.hitClass;
      hitDisplay.attackType = previousHitData.attackType;
      hitDisplay.ac = Number.parseInt(
        sourceActor.system.attributes?.ac?.value ?? 10
      );
      hitDisplay.bonusAC = 0;
      hitDisplay.attackTotal = currentWorkflow.attackTotal;

      // We just display hits or criticals because the previous numeric values are not relevant anymore
      if (
        game.user?.isGM &&
        ['hitDamage', 'all'].includes(configSettings.hideRollDetails)
      ) {
        hitDisplay.hitSymbol = 'fa-tick';
      } else if (currentWorkflow.isCritical) {
        hitDisplay.hitSymbol = 'fa-check-double';
      } else {
        hitDisplay.hitSymbol = 'fa-check';
      }
      if (currentWorkflow.isCritical) {
        hitDisplay.hitString = game.i18n.localize('midi-qol.criticals');
        hitDisplay.hitResultNumeric = '++';
      } else {
        hitDisplay.hitString = game.i18n.localize('midi-qol.hits');
        hitDisplay.hitResultNumeric = `${hitDisplay.attackTotal}/${
          hitDisplay.attackTotal - hitDisplay.ac
        }`;
      }
    }
    // If the critical flag changed, redisplay attack roll
    if (previousIsCritical !== currentWorkflow.isCritical) {
      await currentWorkflow.displayAttackRoll(configSettings.mergeCard);
    }
    // Redisplay hits with the new data
    await currentWorkflow.displayHits(
      currentWorkflow.whisperAttackCard,
      configSettings.mergeCard
    );

    // Swap places
    const targetPos = { x: targetToken.document.x, y: targetToken.document.y };
    const sourcePos = { x: sourceToken.document.x, y: sourceToken.document.y };
    await MidiQOL.moveToken(sourceToken, targetPos, false);
    await MidiQOL.moveToken(targetToken, sourcePos, false);

    // Update current target selection
    const targetIds = currentWorkflow.targets.map((t) => t.id);
    game.user?.updateTokenTargets(targetIds);
    game.user?.broadcastActivity({ targets: targetIds });

    // Add info about target switch
    const targetDivs = elwinHelpers.getTargetDivs(
      targetToken,
      'The hit target <strong>${tokenName}</strong>'
    );
    const newTargetDivs = elwinHelpers.getTargetDivs(
      sourceToken,
      `was switched to <strong>\${tokenName}</strong> by <strong>${sourceItem.name}</strong>.`
    );
    const infoMsg = `${targetDivs}${newTargetDivs}`;
    await elwinHelpers.insertTextIntoMidiItemCard(
      'beforeHitsDisplay',
      currentWorkflow,
      infoMsg
    );
  }
}

;// CONCATENATED MODULE: ./scripts/automations/raceFeatures/Human/human.js


let human = {
  vigilantGuardian: vigilantGuardian,
};

;// CONCATENATED MODULE: ./scripts/automations/raceFeatures/raceFeatures.js


let raceFeatures = {
  human: human,
};

;// CONCATENATED MODULE: ./scripts/automations/spellItems/misleadSwitch.js
async function misleadSwitch({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const spawnedId = actor.getFlag('midi-item-showcase-community', 'mislead.spawnedTokenId');
  const currentVision = actor.getFlag('midi-item-showcase-community', 'mislead.sight');
  const itemS = actor.getFlag('midi-item-showcase-community', 'mislead.item');
  if (!canvas.scene.tokens.get(spawnedId)) return;
  let target;
  let remove;
  if (currentVision) {
    target = actor;
    remove = canvas.scene.tokens.get(spawnedId).actor;
  } else {
    target = canvas.scene.tokens.get(spawnedId).actor;
    remove = actor;
  }
  let activeEffect = await target.createEmbeddedDocuments('ActiveEffect', [
    remove.effects.getName('Mislead - Blinded'),
  ]);
  await remove.deleteEmbeddedDocuments('ActiveEffect', [
    remove.effects.getName('Mislead - Blinded').id,
  ]);
  await actor.setFlag('midi-item-showcase-community', 'mislead.sight', !currentVision);
  MidiQOL.addConcentrationDependent(target, activeEffect[0], itemS);
}

;// CONCATENATED MODULE: ./scripts/automations/spellItems/starMote.js
// @bakanabaka

async function starMote({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const macroItem = scope.macroItem;

  const originName = `Crown of Stars`;
  const effectUniqueName = `[${actor.id}] Crown of Stars`;

  async function postAttackRoll() {
    const randomIndex = Math.floor(Math.random() * remainingStars.length);
    let randomStar = remainingStars[randomIndex];
    await macroUtil.animation.crownOfStars.remove(
      token,
      { id: effectUniqueName },
      randomStar
    );

    remainingStars[randomIndex] = remainingStars[remainingStars.length - 1];
    remainingStars.pop();
    if (remainingStars.length == 3) {
      let allEffects = Array.from(actor.allApplicableEffects());
      let lightEffect = allEffects.find((ef) => ef.name == macroItem.name);
      let changes = lightEffect.changes;
      changes.pop(); // We have structured it so ATL.light.bright is at the end
      changes.find((ch) => ch.key == 'ATL.light.dim').value = '30';
      await lightEffect.update({ changes: changes });
    }

    if (!remainingStars.length) {
      let crownEffect = actor.effects.find((ef) => ef.name == originName);
      await crownEffect.delete();
    }
  }

  let remainingStars = actor.getFlag('world', originName);
  const callArguments = {
    speaker: speaker,
    actor: actor,
    token: token,
    character: character,
    item: item,
    args: args,
    scope: scope,
  };
  await macroUtil.runWorkflows(callArguments, {
    postAttackRoll: postAttackRoll,
  });
  await actor.setFlag('world', originName, remainingStars);
}

;// CONCATENATED MODULE: ./scripts/automations/spellItems/spellItems.js



let spellItems = {
  misleadSwitch: misleadSwitch,
  starMote: starMote,
};

;// CONCATENATED MODULE: ./scripts/automations/spells/absorbElements.js
async function absorbElements({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const damageTypes = [
    ['🧪 Acid', 'acid'],
    ['❄️ Cold', 'cold'],
    ['🔥 Fire', 'fire'],
    ['⚡ Lightning', 'lightning'],
    ['☁️ Thunder', 'thunder'],
  ]; //All possible damage types

  /* Choose wich element to absorb */
  const buttons = damageTypes.map(([label, value]) => ({ label, value }));
  const title = 'Absorb Elements';
  const content = '<strong>What type of element do you absorb ?</strong>';
  const absorbedElement = await warpgate.buttonDialog(
    { buttons, title, content },
    'column'
  );
  if (absorbedElement.buttons === false) return;

  /* Find & change the damage resistance AE */
  const drEffect = actor.effects.getName('Absorb Elements: DR');
  const newDR = duplicate(drEffect.changes);
  newDR[0].value = absorbedElement;
  await warpgate.mutate(
    token.document,
    {
      embedded: { ActiveEffect: { 'Absorb Elements: DR': { changes: newDR } } },
    },
    {},
    { permanent: true, comparisonKeys: { ActiveEffect: 'name' } }
  );

  /* Find & change the melee damage bonus AE */
  const damageBonusEffect = actor.effects.getName(
    'Absorb Elements: melee damage bonus'
  );
  const newDamageBonuses = duplicate(damageBonusEffect.changes);
  newDamageBonuses[0].value = newDamageBonuses[1].value =
    '+' + workflow.itemLevel + 'd6[' + absorbedElement + ']';
  await warpgate.mutate(
    token.document,
    {
      embedded: {
        ActiveEffect: {
          'Absorb Elements: melee damage bonus': { changes: newDamageBonuses },
        },
      },
    },
    {},
    { permanent: true, comparisonKeys: { ActiveEffect: 'name' } }
  );
}

;// CONCATENATED MODULE: ./scripts/automations/spells/borrowedKnowledge.js
async function borrowedKnowledge({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
}) {
  function dialogRender(html) {
    let ths = html[0].getElementsByTagName('th');
    for (let t of ths) {
      t.style.width = 'auto';
      t.style.textAlign = 'left';
    }
    let tds = html[0].getElementsByTagName('td');
    for (let t of tds) {
      t.style.width = '50px';
      t.style.textAlign = 'center';
      t.style.paddingRight = '5px';
    }
  }
  let selection = await warpgate.menu(
    {
      inputs: [
        {
          label: 'Skill:',
          type: 'select',
          options: Object.entries(CONFIG.DND5E.skills)
            .filter(
              ([key, value]) => workflow.actor.system.skills[key].value < 1
            )
            .map(([i, j]) => ({ value: i, html: j.label })),
        },
      ],
      buttons: [
        {
          label: 'Cancel',
          value: false,
        },
        {
          label: 'OK',
          value: true,
        },
      ],
    },
    {
      title: workflow.item.name,
      render: dialogRender,
    }
  );
  if (!selection.buttons) return;
  async function effectMacro() {
    await warpgate.revert(token.document, 'Borrowed Knowledge');
  }
  const imgPropName = game.version < 12 ? 'icon' : 'img';
  let effectData = {
    label: workflow.item.name,
    [imgPropName]: workflow.item.img,
    origin: workflow.item.uuid,
    duration: {
      seconds: 3600,
    },
    changes: [
      {
        key: 'system.skills.' + selection.inputs[0] + '.value',
        mode: 4,
        value: '1',
        priority: 20,
      },
    ],
    flags: {
      effectmacro: {
        onDelete: {
          script: `(${effectMacro.toString()})()`,
        },
      },
    },
  };
  let updates = {};
  foundry.utils.setProperty(
    updates,
    'embedded.ActiveEffect.' + workflow.item.name,
    effectData
  );
  let effect = workflow.actor.effects.getName(workflow.item.name);
  if (effect) {
    if (warpgate.util.firstOwner(effect).id === game.user.id) {
      await effect.delete();
    } else {
      await socket.executeAsGM('removeEffect', effect.uuid);
    }
  }
  let options = {
    permanent: false,
    name: 'Borrowed Knowledge',
    description: 'Borrowed Knowledge',
  };
  await warpgate.mutate(workflow.token.document, updates, {}, options);
}

;// CONCATENATED MODULE: ./scripts/automations/spells/flamingSphere.js
async function flamingSphere({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  try {
    if (args[0].tag === 'OnUse') {
      const casterToken = await fromUuid(args[0].tokenUuid);
      const caster = casterToken.actor;
      let sphereActor = game.actors.getName('Flaming Sphere');
      if (!sphereActor) {
        const jsonData = JSON.parse(
          '{"name":"Flaming Sphere","type":"npc","img":"icons/magic/fire/orb-vortex.webp","data":{"abilities":{"str":{"value":10,"proficient":0},"dex":{"value":10,"proficient":0},"con":{"value":10,"proficient":0},"int":{"value":10,"proficient":0},"wis":{"value":10,"proficient":0},"cha":{"value":10,"proficient":0}},"attributes":{"ac":{"flat":10,"calc":"natural","formula":""},"hp":{"value":10,"min":0,"max":10,"temp":0,"tempmax":null,"formula":""},"init":{"value":0,"bonus":0},"movement":{"burrow":0,"climb":0,"fly":0,"swim":0,"walk":30,"units":"ft","hover":false},"senses":{"darkvision":0,"blindsight":0,"tremorsense":0,"truesight":0,"units":"ft","special":""},"spellcasting":"int","death":{"success":0,"failure":0}},"details":{"biography":{"value":"","public":""},"alignment":"","race":"","type":{"value":"","subtype":"","swarm":"","custom":""},"environment":"","cr":1,"spellLevel":0,"xp":{"value":10},"source":"","gender":"","age":"","height":"","weight":"","eyes":"","skin":"","hair":"","notes1name":"","notes2name":"","notes3name":"","notes4name":""},"traits":{"size":"med","di":{"value":[],"custom":""},"dr":{"value":[],"custom":""},"dv":{"value":[],"custom":""},"ci":{"value":[],"custom":""},"languages":{"value":[],"custom":""}},"currency":{"pp":0,"gp":0,"ep":0,"sp":0,"cp":0},"skills":{"acr":{"value":0,"ability":"dex"},"ani":{"value":0,"ability":"wis"},"arc":{"value":0,"ability":"int"},"ath":{"value":0,"ability":"str"},"dec":{"value":0,"ability":"cha"},"his":{"value":0,"ability":"int"},"ins":{"value":0,"ability":"wis"},"itm":{"value":0,"ability":"cha"},"inv":{"value":0,"ability":"int"},"med":{"value":0,"ability":"wis"},"nat":{"value":0,"ability":"int"},"prc":{"value":0,"ability":"wis"},"prf":{"value":0,"ability":"cha"},"per":{"value":0,"ability":"cha"},"rel":{"value":0,"ability":"int"},"slt":{"value":0,"ability":"dex"},"ste":{"value":0,"ability":"dex"},"sur":{"value":0,"ability":"wis"}},"spells":{"spell1":{"value":0,"override":null},"spell2":{"value":0,"override":null},"spell3":{"value":0,"override":null},"spell4":{"value":0,"override":null},"spell5":{"value":0,"override":null},"spell6":{"value":0,"override":null},"spell7":{"value":0,"override":null},"spell8":{"value":0,"override":null},"spell9":{"value":0,"override":null},"pact":{"value":0,"override":null}},"bonuses":{"mwak":{"attack":"","damage":""},"rwak":{"attack":"","damage":""},"msak":{"attack":"","damage":""},"rsak":{"attack":"","damage":""},"abilities":{"check":"","save":"","skill":""},"spell":{"dc":""}},"resources":{"legact":{"value":0,"max":0},"legres":{"value":0,"max":0},"lair":{"value":false,"initiative":0}}},"token":{"_id":"wsnEu8ZSbBYL5S9i","name":"Flaming Sphere","displayName":0,"actorId":"WlOopcsUtThmw4gy","actorLink":false,"actorData":{},"img":"icons/magic/fire/orb-vortex.webp","tint":null,"width":1,"height":1,"scale":1,"mirrorX":false,"mirrorY":false,"x":null,"y":null,"elevation":null,"lockRotation":false,"rotation":0,"effects":[],"alpha":1,"hidden":false,"vision":false,"dimSight":0,"brightSight":30,"dimLight":40,"brightLight":20,"sightAngle":0,"lightAngle":0,"lightColor":"#a2642a","lightAlpha":0.4,"lightAnimation":{"speed":5,"intensity":5,"type":"torch"},"disposition":1,"displayBars":0,"bar1":{"attribute":"attributes.hp"},"bar2":{"attribute":""},"flags":{"conditional-visibility":{"invisible":false,"obscured":false,"indarkness":false,"hidden":false,"_ste":null},"tokenmagic":{},"ActiveAuras":false,"monks-tokenbar":{"movement":null}},"tokenId":null,"randomImg":false},"items":[{"_id":"O9ThymNjpRlq26u1","name":"Flaming Sphere Damage","type":"weapon","img":"icons/magic/fire/orb-vortex.webp","data":{"description":{"value":"","chat":"","unidentified":""},"source":"","quantity":1,"weight":0,"price":0,"attunement":0,"equipped":true,"rarity":"","identified":true,"activation":{"type":"special","cost":0,"condition":""},"duration":{"value":null,"units":""},"target":{"value":null,"width":null,"units":"","type":""},"range":{"value":null,"long":null,"units":""},"uses":{"value":0,"max":"0","per":""},"consume":{"type":"","target":"","amount":null},"ability":"","actionType":"save","attackBonus":0,"chatFlavor":"","critical":null,"damage":{"parts":[["2d6","fire"]],"versatile":""},"formula":"","save":{"ability":"dex","dc":15,"scaling":"flat"},"armor":{"value":10},"hp":{"value":0,"max":0,"dt":null,"conditions":""},"weaponType":"natural","properties":{"ada":false,"amm":false,"fin":false,"fir":false,"foc":false,"hvy":false,"lgt":false,"lod":false,"mgc":false,"rch":false,"rel":false,"ret":false,"sil":false,"spc":false,"thr":false,"two":false,"ver":false,"nodam":false,"fulldam":false,"halfdam":true},"proficient":true},"effects":[],"folder":null,"sort":1050000,"permission":{"default":3,"g4WGw0lAZ3nIhapn":3},"flags":{"betterRolls5e":{"critRange":{"type":"String","value":null},"critDamage":{"type":"String","value":""},"quickDesc":{"type":"Boolean","value":false,"altValue":false},"quickAttack":{"type":"Boolean","value":true,"altValue":true},"quickSave":{"type":"Boolean","value":true,"altValue":true},"quickDamage":{"type":"Array","value":[true],"altValue":[true],"context":{"0":""}},"quickVersatile":{"type":"Boolean","value":false,"altValue":false},"quickProperties":{"type":"Boolean","value":true,"altValue":true},"quickCharges":{"type":"Boolean","value":{"quantity":false,"use":false,"resource":true},"altValue":{"quantity":false,"use":true,"resource":true}},"quickTemplate":{"type":"Boolean","value":true,"altValue":true},"quickOther":{"type":"Boolean","value":true,"altValue":true,"context":""},"quickFlavor":{"type":"Boolean","value":true,"altValue":true},"quickPrompt":{"type":"Boolean","value":false,"altValue":false}},"midi-qol":{"onUseMacroName":""},"core":{"sourceId":"Item.os6WBKZ9m8aOjecL"},"magicitems":{"enabled":false,"equipped":false,"attuned":false,"charges":"0","chargeType":"c1","destroy":false,"destroyFlavorText":"reaches 0 charges: it crumbles into ashes and is destroyed.","rechargeable":false,"recharge":"0","rechargeType":"t1","rechargeUnit":"r1","sorting":"l"}}}],"tint":null,"selectedKey":"data.abilities.cha.dc","sort":0,"flags":{"tidy5e-sheet":{"allow-edit":true},"midi-qol":{"flamingSphere":"Scene.xMH6dt9g5Wt35rd3.Token.BLiAIGMjLp2oRc5L"},"dae":{"damageApplied":6}}}'
        );
        await MidiQOL.socket().executeAsGM('createActor', {
          actorData: jsonData,
        });
      }
      sphereActor = game.actors.getName('Flaming Sphere');
      if (!sphereActor) {
        console.error('No Flaming Sphere');
        return;
      }

      let tokenImg;
      if (game.modules.get('jb2a_patreon')?.active) {
        tokenImg =
          'modules/jb2a_patreon/Library/2nd_Level/Flaming_Sphere/FlamingSphere_01_Orange_200x200.webm';
      } else if (game.modules.get('JB2A_DnD5e')?.active) {
        tokenImg =
          'modules/JB2A_DnD5e/Library/2nd_Level/Flaming_Sphere/FlamingSphere_01_Orange_200x200.webm';
      }

      const changeValue = `turn=end,saveDC=${
        caster.data.data.attributes.spelldc ?? 10
      },saveAbility=dex,damageRoll=${
        args[0].spellLevel
      }d6,damageType=fire,saveDamage=halfdamage,saveRemove=false`;
      const imgPropName = game.version < 12 ? 'icon' : 'img';
      const embedded = {
        Item: {
          'Flaming Sphere Damage': {
            'data.damage.parts': [[`${args[0].spellLevel}d6`, 'fire']],
            'data.save.dc': caster.data.data.attributes.spelldc,
          },
        },
        ActiveEffect: {
          'Flaming Sphere Damage': {
            changes: [
              {
                key: 'flags.midi-qol.OverTime',
                mode: 5,
                value: changeValue,
                priority: '20',
              },
            ],
            disabled: false,
            label: 'Flaming Sphere Damage',
            [imgPropName]: 'icons/magic/fire/orb-vortex.webp',
            flags: {
              ActiveAuras: {
                isAura: true,
                aura: 'All',
                radius: 5,
                alignment: '',
                type: '',
                ignoreSelf: true,
                height: true,
                hidden: false,
                hostile: false,
                onlyOnce: false,
              },
            },
          },
        },
      };
      const updates = {
        actor: {
          prototypeToken: {
            texture: {
              src: tokenImg,
            },
          },
        },
        token: {
          texture: {
            src: tokenImg,
          },
        },
        embedded: embedded,
      };
      const summoned = await warpgate.spawn('Flaming Sphere', updates, {}, {});
      if (summoned.length !== 1) return;
      const summonedUuid = canvas.scene.tokens.get(summoned[0]).uuid;
      console.error('uuid is ', summonedUuid);
      await caster.createEmbeddedDocuments('ActiveEffect', [
        {
          changes: [
            {
              key: 'flags.dae.deleteUuid',
              mode: 5,
              value: summonedUuid,
              priority: '30',
            },
          ],
          label: 'Flaming Sphere Summon',
          duration: { seconds: 60, rounds: 10 },
          origin: args[0].itemUuid,
          [imgPropName]: 'icons/magic/fire/orb-vortex.webp',
        },
      ]);
    }
  } catch (err) {
    console.error(`${args[0].itemData.name} - Flaming Sphere`, err);
  }
}

;// CONCATENATED MODULE: ./scripts/automations/spells/goodberry.js
// ##################################################################################################
// Read First!!!!
// Creates a Goodberry item that expires and is deleted after 24h.
// If the caster has the Disciple of Life feature, the healing power of the berries is increased.
// v2.1.0
// Author: Elwin#1410, based on Crymic's Goodberry macro
// Dependencies:
//  - DAE
//  - MidiQOL "on use" item macro [postActiveEffects][preTargeting][preItemRoll]
//  - Elwin Helpers world script
//  - About Time (optional)
//  - Simple Calendar (optional)
//  - Rest Recovery for 5E (optional)
//
// How to configure:
// The item details must be:
//   - Activation cost: 1 Action
//   - Target: Self
//   - Range: Touch
//   - Duration: Instantaneous
//   - Action type: (empty)
// The Feature Midi-QOL must be:
//   - On Use Macros:
//       ItemMacro | After Active Effects
//   - Confirm Targets: Never
//   - Roll a separate attack per target: Never
//   - This item macro code must be added to the DIME code of this spell.
//
// Localization:
//   To localize the texts used by this item, you can either changed the content found in the initLocalization() function
//   of this macro, or add a world script that populates game.i18n.translations with the appropriates keys.
//   Values from existing keys will be used instead of using the values from initLocalization().
//   Note: the created item uses the same name as the spell, so localize it to change the spell name.
//   Keys to define with their corresponding localized texts:
//      world.dnd5e.spells.goodberry.description: Description of the created goodberry consumable.
//      world.dnd5e.spells.goodberry.chatFlavor: Chat flavor of the created goodberry consumable.
//      world.dnd5e.spells.goodberry.expirationOnUseWarn: Warning displayed in a notification when using
//                                                        an expired goodberry consumable.
//      world.dnd5e.spells.goodberry.expirationEventWarn: Chat message text displayed when using
//                                                        an expired goodberry consumable.
//
// Usage:
// This item need to be used to activate. It creates a batch of berries that will expire in 24h.
// The expiration is embedded in the item, so it can be copied to another actor and it will still expire at the
// appropriate time. If Rest Recovery for 5E is active, the berries are configured for a full day's worth of food.
// The format of the batch ID depends on the value of a world setting, by the default is not set,
// the "date-time" format is useed.
// - The uuid format is a random unique id generated with foundry.utils.randomID().
// - The date-time format is the game.time.worldTime + 24h (in seconds) or if Simple Calendar is installed
//   and active, the timestamp formatted using SimpleCalendar.api.formatTimestamp().
//
// Description:
// In the postActiveEffects phase (of source item):
//   Creates a Goodberry item and adds it to the caster inventory. The expiration date and time is added to the name
//   to differenciate each created batch and a flag is set with the batch expiration time, if Simple Calendar is present
//   the date and time are formatted in text instead of worldtime seconds. If About Time is active,
//   an event is added to delete the item from the caster. Data about this event is kept in a flag on the created item.
//   If the actor has the Disciple of Life feature, the healing power of the berries are increaed appropriately.
// In the preTargeting phase (of created item):
//   Verifies if the batch has expired, and if it's the case, deletes the batch and cancels the item use.
//   If About Time is active, it verifies if the actorUuid from the event is the same as the one that used
//   the item, if not, a new event is added to delete the item from the current actor.
//   If there is no selected targets and MidiQOL settings is not set for late targeting, changes the target's item
//   to self and setup a hook on midi-qol.RollComplete to reset it to 1 creature after.
// In the preItemRoll phase (of created item):
//   Forces fast forwarding and auto rolling damage because its a fixed value, so no dice rolling.
//   If the target is not the owner of the berry, setup of hook on "dnd5e.itemUsageConsumption" and disable
//   the Rest Recovery consumable info, because it will be handled in the postActiveEffects phase instead of the
//   Rest Recovery module.
// In the "midi-qol.RollComplete" hook:
//   Clears selected targets if the hook is called during the same workflow execution.
// In the "dnd5e.itemUsageConsumption" hook:
//   If called during the same workflow execution, saves the new usage info and the current item's usage.
//   This info is used to process the effects of the berries on the target.
// In the postActiveEffects phase (of created item):
//   Re-enables the Rest Recovery consumable info.
//   If the target is not the owner of the berry and Rest Recovery is active and the food and water setting is enabled,
//   applies the same logic of food and water consumption as the Rest Recovery module but on the target other
//   then the owner.
//
// ###################################################################################################

async function goodberry({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Default name of the item
  const DEFAULT_ITEM_NAME = 'Goodberry';
  const MODULE_ID = 'midi-item-showcase-community';
  const SPELL_DURATION = 60 * 60 * 24;
  // Default rest-recovery sated type as RAW, change to "both" to sate food and water.
  const SATED_TYPE = 'food';
  // Change this flag value to allow Disciple of Life to increase the healing value of the Goodberies.
  const ALLOW_DISCIPLE_OF_LIFE_EXTRA_HEALING = true;
  // Default name of Disciple of Life feat
  const DISCIPLE_OF_LIFE_ITEM_NAME = 'Disciple of Life';

  // Set to false to remove debug logging
  const debug = globalThis.elwinHelpers?.isDebugEnabled() ?? false;

  if (
    !foundry.utils.isNewerVersion(
      globalThis?.elwinHelpers?.version ?? '1.1',
      '2.0'
    )
  ) {
    const errorMsg = `${DEFAULT_ITEM_NAME}: The Elwin Helpers setting must be enabled.`;
    ui.notifications.error(errorMsg);
    return;
  }
  const dependencies = ['dae', 'midi-qol'];
  if (!elwinHelpers.requirementsSatisfied(DEFAULT_ITEM_NAME, dependencies)) {
    return;
  }

  if (debug) {
    console.warn(
      DEFAULT_ITEM_NAME,
      { phase: args[0].tag ? `${args[0].tag}-${args[0].macroPass}` : args[0] },
      arguments
    );
  }

  if (args[0].tag === 'OnUse' && args[0].macroPass === 'postActiveEffects') {
    const macroData = args[0];
    const i18nGoodberry = initLocalization();
    const tokenActor = actor;
    const expirationTime = game.time.worldTime + SPELL_DURATION;
    let batchId = getBatchId(expirationTime);
    let healingValue = 1;
    if (
      ALLOW_DISCIPLE_OF_LIFE_EXTRA_HEALING &&
      tokenActor.items.getName(DISCIPLE_OF_LIFE_ITEM_NAME)
    ) {
      healingValue += 2 + workflow.itemLevel;
      const infoMsg = `<p>Your ${DISCIPLE_OF_LIFE_ITEM_NAME} feature enhances the berries effectiveness.</p>`;
      await elwinHelpers.insertTextIntoMidiItemCard(
        'beforeButtons',
        workflow,
        infoMsg
      );
    }
    const newItemData = {
      name: `${workflow.item.name} (${batchId})`,
      type: 'consumable',
      img: 'icons/consumables/food/berries-ration-round-red.webp',
      system: {
        description: {
          value: game.i18n.localize(i18nGoodberry.description),
        },
        quantity: 10,
        weight: 0.002,
        rarity: 'common',
        activation: {
          type: 'action',
          cost: 1,
        },
        target: { value: 1, type: 'creature' },
        range: { units: 'touch' },
        uses: {
          value: 1,
          max: '1',
          per: 'charges',
          autoDestroy: true,
        },
        actionType: 'heal',
        chatFlavor: game.i18n.localize(i18nGoodberry.chatFlavor),
        damage: { parts: [[healingValue, 'healing']] },
        consumableType: 'food',
      },
      flags: {
        'midi-qol': {
          onUseMacroName:
            '[preTargeting]ItemMacro,[preItemRoll]ItemMacro,[postActiveEffects]ItemMacro',
        },
        [MODULE_ID]: { goodberry: { expirationTime: expirationTime } },
        dae: {
          macro: {
            data: {
              _id: null,
              name: workflow.item.name,
              type: 'script',
              scope: 'global',
              command: getConsumableMacro(),
            },
          },
        },
      },
    };
    if (game.modules.get('rest-recovery')?.active) {
      foundry.utils.setProperty(
        newItemData.flags,
        'rest-recovery.data.consumable',
        {
          enabled: true,
          dayWorth: true,
          type: SATED_TYPE,
        }
      );
    }

    const [newItem] = await tokenActor.createEmbeddedDocuments('Item', [
      newItemData,
    ]);
    // When about time is present, register a callback to delete the item when it expires
    if (game.modules.get('about-time')?.active) {
      const eventId = game.Gametime.doAt(
        expirationTime,
        deleteGoodberries,
        macroData.actorUuid,
        game.i18n.format(i18nGoodberry.expirationEventWarn, {
          actorName: tokenActor.name,
        })
      );
      const goodberryEvent = {
        expirationTime: expirationTime,
        eventId: eventId,
        actorUuid: macroData.actorUuid,
      };
      await newItem.setFlag(MODULE_ID, 'goodberry', goodberryEvent);
    }
  }

  /**
   * Initializes the i18n texts used by this item.
   *
   * @returns {object} The i18n keys to use with `game.i18n.localize` and `game.i18n.format`.
   */
  function initLocalization() {
    const i18nPrefix = 'world.dnd5e.spells.goodberry';
    const i18nKeys = {
      description: i18nPrefix + '.description',
      chatFlavor: i18nPrefix + '.chatFlavor',
      expirationOnUseWarn: i18nPrefix + '.expirationOnUseWarn',
      expirationEventWarn: i18nPrefix + '.expirationEventWarn',
    };
    // Note: use a flag to only setup i18n data once
    if (foundry.utils.getProperty(globalThis, i18nPrefix + '.i18n')) {
      return i18nKeys;
    }
    // Text used for the created goodberry consumable and expiration warning messages.
    // Note: you can update these text to localize it or add a world script that will localize the texts,
    // by adding the i18nKeys and their corresponding texts into game.i18n.translations.
    const i18nData = {
      description:
        '<p>Eating a berry restores 1 hit point, and the berry provides enough nourishment to sustain a creature for one day.</p>',
      chatFlavor: '[healing] 10 Berries (1 can be eaten per action)',
      expirationOnUseWarn: 'The berries lost their potency and vanish',
      expirationEventWarn:
        'Some berries lost their potency and vanish from {actorName}:',
    };

    const existingData =
      foundry.utils.getProperty(game.i18n.translations, i18nPrefix) ?? {};
    foundry.utils.setProperty(
      game.i18n.translations,
      i18nPrefix,
      foundry.utils.mergeObject(existingData, i18nData, { overwrite: false })
    );
    foundry.utils.setProperty(globalThis, i18nPrefix + '.i18n', true);

    return i18nKeys;
  }

  function getConsumableMacro() {
    return `
// Default name of the item
const DEFAULT_ITEM_NAME = "${DEFAULT_ITEM_NAME}";
const MODULE_ID = "${MODULE_ID}";
const debug = ${debug};

if (debug) {
  console.warn(DEFAULT_ITEM_NAME, { phase: args[0].tag ? \`\${args[0].tag}-\${args[0].macroPass}\` : args[0] }, arguments);
}

if (args[0].tag === "OnUse" && args[0].macroPass === "preTargeting") {
  return await handleGoodBerryPreTargeting(workflow);
} else if (args[0].tag === "OnUse" && args[0].macroPass === "preItemRoll") {
  await handleGoodBerryPreItemRoll(workflow);
} else if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
  await handleGoodBerryPostActiveEffects(workflow);
}

${initLocalization.toString()}

${handleGoodBerryPreTargeting.toString()}

${handleGoodBerryPreItemRoll.toString()}

${handleGoodBerryPostActiveEffects.toString()}

${deleteGoodberries.toString()}

${getActorConsumableValues.toString()}

${isRealNumber.toString()}
`;
  }

  /**
   * Handles the preTrageting phase of the workflow. Validates that the good berries are not expired, when expired the workflow
   * is cancelled and the berries are delete. If About Time is active, it registers a call back to delete the berries when they expire.
   * If there are no selected targets and the current midi setting does not allow late targeting, it selects the actor's token and
   * setup a hook on midi-qol.RollComplete to unselect it after.
   *
   * @param {MidiQOL.Workflow} gbWorkflow The current workflow.
   * @returns {boolean} true if the workflow should continue, false otherwise.
   */
  async function handleGoodBerryPreTargeting(gbWorkflow) {
    // Reset target type each time this item is used
    // This is to revert to the initial state if workflow was cancelled.
    if (gbWorkflow.item.system.target.type !== 'creature') {
      const newTarget = foundry.utils.deepClone(gbWorkflow.item.system.target);
      newTarget.value = 1;
      newTarget.type = 'creature';
      gbWorkflow.item.system.target = newTarget;
    }

    const i18nGoodberry = initLocalization();
    const expirationTime =
      foundry.utils.getProperty(
        gbWorkflow.item,
        `flags.${MODULE_ID}.goodberry.expirationTime`
      ) ?? 0;
    if (game.time.worldTime >= expirationTime) {
      ui.notifications.warn(
        game.i18n.localize(i18nGoodberry.expirationOnUseWarn)
      );
      await gbWorkflow.item.delete();
      return false;
    }
    // When about time is present, register a callback to delete the item when it expires if not already registerd
    if (game.modules.get('about-time')?.active) {
      if (
        gbWorkflow.item.getFlag(MODULE_ID, 'goodberry')?.actorUuid !==
        gbWorkflow.actor.uuid
      ) {
        const eventId = game.Gametime.doAt(
          expirationTime,
          deleteGoodberries,
          gbWorkflow.actor.uuid,
          game.i18n.format(i18nGoodberry.expirationEventWarn, {
            actorName: gbWorkflow.actor.name,
          })
        );
        const goodberryEvent = {
          expirationTime: expirationTime,
          eventId: eventId,
          actorUuid: gbWorkflow.actor.uuid,
        };
        await gbWorkflow.item.setFlag(MODULE_ID, 'goodberry', goodberryEvent);
      }
    }
    if (!game.user?.targets?.size) {
      const targetConfirmation = game.settings.get(
        'midi-qol',
        'TargetConfirmation'
      ) ?? { enabled: false };
      if (!targetConfirmation.enabled || !targetConfirmation.noneTargeted) {
        if (debug) {
          console.warn(`${DEFAULT_ITEM_NAME} | Change to self:`, {
            targetConfirmation,
          });
        }

        // Change target to self
        const newTarget = foundry.utils.deepClone(
          gbWorkflow.item.system.target
        );
        newTarget.value = null;
        newTarget.type = 'self';
        gbWorkflow.item.system.target = newTarget;

        // Register hook to reset target type after workflow completion
        Hooks.once(
          `midi-qol.postCleanup.${gbWorkflow.item.uuid}`,
          (currentWorkflow) => {
            if (currentWorkflow.item.system.target.type !== 'self') {
              console.warn(`${DEFAULT_ITEM_NAME} | Target type already reset.`);
              return;
            }
            const newTarget = foundry.utils.deepClone(
              currentWorkflow.item.system.target
            );
            newTarget.value = 1;
            newTarget.type = 'creature';
            currentWorkflow.item.system.target = newTarget;
          }
        );
      }
    } else {
      // Make sure the last set to self if was changed back
      if (gbWorkflow.item.system.target.type === 'self') {
        const newTarget = foundry.utils.deepClone(
          gbWorkflow.item.system.target
        );
        newTarget.value = 1;
        newTarget.type = 'creature';
        gbWorkflow.item.system.target = newTarget;
      }
    }
    return true;
  }

  /**
   * Handles the preItemRoll phase of the workflow. If the target is not the one that used the item and
   * Rest Recovery is active, sets the proper hooks to handle the benefits of the consumption on the target.
   *
   * @param {MidiQOL.Workflow} gbWorkflow The current workflow.
   */
  async function handleGoodBerryPreItemRoll(gbWorkflow) {
    // Note: we auto roll and fast forward because the healing is a fixed value.
    foundry.utils.setProperty(
      gbWorkflow,
      'workflowOptions.fastForwardDamage',
      true
    );
    foundry.utils.setProperty(
      gbWorkflow,
      'workflowOptions.autoRollDamage',
      'always'
    );
    // Reset consumable state if was not reset due to item cancellation
    const consumable = foundry.utils.getProperty(
      gbWorkflow.item,
      'flags.rest-recovery.data.consumable'
    );
    if (consumable) {
      consumable.enabled = true;
    }

    if (gbWorkflow.targets.first()?.id !== gbWorkflow.token.id) {
      if (
        game.modules.get('rest-recovery')?.active &&
        consumable &&
        game.settings.get('rest-recovery', 'enable-food-and-water')
      ) {
        // Create unique workflow id
        gbWorkflow.customUniqueId = randomID();
        // Prevent Rest Recovery to apply to owner of item
        consumable.enabled = false;
        // Register hook to keep handle usage consumption, we need to keep the usage info in the useItem hook
        Hooks.once('dnd5e.itemUsageConsumption', (item, _, __, usage) => {
          const itemWorkflow = MidiQOL.Workflow.getWorkflow(item?.uuid);
          if (gbWorkflow.customUniqueId !== itemWorkflow?.customUniqueId) {
            console.warn(
              `${DEFAULT_ITEM_NAME} | dnd5e.itemUsageConsumption hook called for a different workflow, expected ${gbWorkflow.id} but was ${itemWorkflow?.id}`
            );
            return;
          }
          // Keep usage info in current workflow with current item uses, because the item will possibly
          // be updated before the postActiveEffects phase is called.
          gbWorkflow.goodberryItem = {
            usage: usage,
            origUsage: foundry.utils.deepClone(item.system?.uses ?? {}),
          };
        });
      }
    }
  }

  /**
   * Handles postActiveEffects phase of the workflow. If Rest Recovery is active and food and water setting is enabled,
   * also handles food or food and water consumption for an actor other than the owner of the good berry.
   * This duplicates some code from Rest Recovery because it doesn't currently support it.
   *
   * @param {MidiQOL.Workflow} gbWorkflow The current workflow.
   */
  async function handleGoodBerryPostActiveEffects(gbWorkflow) {
    // Reset consumable state if was not reset due to item cancellation or target not owner
    const consumable = foundry.utils.getProperty(
      gbWorkflow.item,
      'flags.rest-recovery.data.consumable'
    );
    if (consumable) {
      consumable.enabled = true;
    }
    const targetToken = gbWorkflow.targets?.first();
    if (!targetToken) {
      return;
    }
    if (
      !(
        targetToken.id !== gbWorkflow.token.id &&
        game.modules.get('rest-recovery')?.active &&
        consumable &&
        game.settings.get('rest-recovery', 'enable-food-and-water')
      )
    ) {
      return;
    }

    // Handle consumption by target different than owner of item
    const actorUpdates = {};
    let {
      actorRequiredFood,
      actorRequiredWater,
      actorFoodSatedValue,
      actorWaterSatedValue,
    } = getActorConsumableValues(targetToken.actor);

    const currCharges = gbWorkflow.goodberryItem?.origUsage?.value;
    const newCharges =
      foundry.utils.getProperty(
        gbWorkflow.goodberryItem?.usage?.itemUpdates,
        'system.uses.value'
      ) ?? currCharges - 1.0;
    const chargesUsed =
      currCharges < newCharges ? currCharges : currCharges - newCharges;

    let message;

    if (consumable.type === 'both') {
      actorUpdates['flags.rest-recovery.data.sated.food'] = consumable.dayWorth
        ? 100000000000
        : actorFoodSatedValue + chargesUsed;
      actorUpdates['flags.rest-recovery.data.sated.water'] = consumable.dayWorth
        ? 100000000000
        : actorWaterSatedValue + chargesUsed;

      const localize =
        'REST-RECOVERY.Chat.ConsumedBoth' +
        (consumable.dayWorth ? 'DayWorth' : '');
      message =
        '<p>' +
        game.i18n.format(localize, {
          actorName: targetToken.name,
          itemName: item.name,
          charges: chargesUsed,
        }) +
        '</p>';

      if (!consumable.dayWorth) {
        message +=
          actorUpdates['flags.rest-recovery.data.sated.food'] >=
          actorRequiredFood
            ? '<p>' +
              game.i18n.localize('REST-RECOVERY.Chat.SatedFood') +
              '</p>'
            : '<p>' +
              game.i18n.format('REST-RECOVERY.Chat.RequiredSatedFood', {
                units:
                  actorRequiredFood -
                  actorUpdates['flags.rest-recovery.data.sated.food'],
              }) +
              '</p>';
        message +=
          actorUpdates['flags.rest-recovery.data.sated.water'] >=
          actorRequiredWater
            ? '<p>' +
              game.i18n.localize('REST-RECOVERY.Chat.SatedWater') +
              '</p>'
            : '<p>' +
              game.i18n.format('REST-RECOVERY.Chat.RequiredSatedWater', {
                units:
                  actorRequiredWater -
                  actorUpdates['flags.rest-recovery.data.sated.water'],
              }) +
              '</p>';
      }
    } else if (consumable.type === 'food') {
      actorUpdates['flags.rest-recovery.data.sated.food'] = consumable.dayWorth
        ? 100000000000
        : actorFoodSatedValue + chargesUsed;

      const localize =
        'REST-RECOVERY.Chat.ConsumedFood' +
        (consumable.dayWorth ? 'DayWorth' : '');
      message =
        '<p>' +
        game.i18n.format(localize, {
          actorName: targetToken.name,
          itemName: item.name,
          charges: chargesUsed,
        }) +
        '</p>';

      message +=
        actorUpdates['flags.rest-recovery.data.sated.food'] >= actorRequiredFood
          ? '<p>' + game.i18n.localize('REST-RECOVERY.Chat.SatedFood') + '</p>'
          : '<p>' +
            game.i18n.format('REST-RECOVERY.Chat.RequiredSatedFood', {
              units:
                actorRequiredFood -
                actorUpdates['flags.rest-recovery.data.sated.food'],
            }) +
            '</p>';
    }
    // Note: type water only not supported

    if (!foundry.utils.isEmpty(actorUpdates)) {
      await socketlib.modules.get('dae')?.executeAsGM('_updateActor', {
        actorUuid: targetToken.actor.uuid,
        update: actorUpdates,
      });
    }

    if (message) {
      await ChatMessage.create({
        flavor: 'Rest Recovery',
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: gbWorkflow.actor }),
        content: message,
      });
    }
  }

  /**
   * Deletes expired good berries from an actor.
   *
   * @param {string} actorUuid UUID of actor for which to process expired good berries.
   * @param {string} goodberryExpirationEventWarn Warning message to be displayed in chat if some berries were deleted.
   */
  async function deleteGoodberries(actorUuid, goodberryExpirationEventWarn) {
    const tokenOrActor = await fromUuid(actorUuid);
    let actor;
    if (tokenOrActor instanceof CONFIG.Token.documentClass) {
      actor = tokenOrActor.actor;
    }
    if (tokenOrActor instanceof CONFIG.Actor.documentClass) {
      actor = tokenOrActor;
    }
    if (!actor) {
      return;
    }
    const now = game.time.worldTime;
    const itemsToDelete = actor.itemTypes.consumable.filter(
      (it) =>
        foundry.utils.getProperty(
          it,
          `flags.${MODULE_ID}.goodberry.expirationTime`
        ) &&
        now >=
          foundry.utils.getProperty(
            it,
            `flags.${MODULE_ID}.goodberry.expirationTime`
          )
    );
    if (itemsToDelete.length > 0) {
      const deletedItems = await actor.deleteEmbeddedDocuments(
        'Item',
        itemsToDelete.map((it) => it.id)
      );
      let whisperTo = [];
      const player = MidiQOL.playerForActor(actor);
      if (player) {
        whisperTo.push(player);
      }
      await ChatMessage.create({
        user: game.user?.id,
        speaker: {
          scene: game.canvas.scene?.id,
          alias: game.user?.name,
          user: game.user?.id,
        },
        content:
          goodberryExpirationEventWarn +
          ' ' +
          deletedItems.map((it) => it.name).join(),
        whisper: whisperTo.map((u) => u.id),
        type:
          game.release.generation >= 12
            ? CONST.CHAT_MESSAGE_STYLES.OTHER
            : CONST.CHAT_MESSAGE_TYPES.OTHER,
      });
    }
  }

  //
  // The following functions were copied from Rest Recovery because they are not exported in its API
  //

  function getActorConsumableValues(actor) {
    const actorFoodSatedValue =
      foundry.utils.getProperty(actor, 'flags.rest-recovery.data.sated.food') ??
      0;
    const actorWaterSatedValue =
      foundry.utils.getProperty(
        actor,
        'flags.rest-recovery.data.sated.water'
      ) ?? 0;
    const actorNeedsNoFoodWater = foundry.utils.getProperty(
      actor,
      'flags.dnd5e.noFoodWater'
    );
    const actorNeedsNoFood = foundry.utils.getProperty(
      actor,
      'flags.dae.rest-recovery.force.noFood'
    );
    const actorNeedsNoWater = foundry.utils.getProperty(
      actor,
      'flags.dae.rest-recovery.force.noWater'
    );
    const foodUnitsSetting = game.settings.get(
      'rest-recovery',
      'food-units-per-day'
    );
    const actorRequiredFoodUnits =
      foundry.utils.getProperty(
        actor,
        'flags.dae.rest-recovery.require.food'
      ) ?? foundry.utils.getProperty(actor, 'flags.dnd5e.foodUnits');
    let actorRequiredFood =
      isRealNumber(actorRequiredFoodUnits) && foodUnitsSetting !== 0
        ? actorRequiredFoodUnits
        : foodUnitsSetting;
    const waterUnitsSetting = game.settings.get(
      'rest-recovery',
      'water-units-per-day'
    );
    const actorRequiredWaterUnits =
      foundry.utils.getProperty(
        actor,
        'flags.dae.rest-recovery.require.water'
      ) ?? foundry.utils.getProperty(actor, 'flags.dnd5e.waterUnits');
    let actorRequiredWater =
      isRealNumber(actorRequiredWaterUnits) && waterUnitsSetting !== 0
        ? actorRequiredWaterUnits
        : waterUnitsSetting;
    actorRequiredFood =
      actorNeedsNoFoodWater || actorNeedsNoFood ? 0 : actorRequiredFood;
    actorRequiredWater =
      actorNeedsNoFoodWater || actorNeedsNoWater ? 0 : actorRequiredWater;
    return {
      actorRequiredFood,
      actorRequiredWater,
      actorFoodSatedValue,
      actorWaterSatedValue,
    };
  }

  function isRealNumber(inNumber) {
    return (
      !isNaN(inNumber) && typeof inNumber === 'number' && isFinite(inNumber)
    );
  }

  function getBatchId(expirationTime) {
    // World setting for goodberry
    if (!game.settings?.settings?.has('world.dnd5e.goodberry.batchIdFormat')) {
      game.settings?.register('world', 'dnd5e.goodberry.batchIdFormat', {
        name: 'Goodberry batch id format',
        hint: 'The format can be uuid or date-time',
        scope: 'world',
        default: 'date-time',
        type: String,
        config: true,
      });
    }
    const batchIdFormat =
      game.settings?.get('world', 'dnd5e.goodberry.batchIdFormat') ??
      'date-time';
    let batchId;
    if (batchIdFormat === 'uuid') {
      batchId = randomID();
    } else {
      batchId = expirationTime;
      if (game.modules.get('foundryvtt-simple-calendar')?.active) {
        const result = SimpleCalendar.api.formatTimestamp(expirationTime);
        batchId = `${result.date} - ${result.time}`;
      }
    }
    return batchId;
  }
}

;// CONCATENATED MODULE: ./scripts/automations/spells/magicStone.js
async function magicStone({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const mutName = 'Magic Stones';
  const mutDescription = `Accept magic stones ?`;
  if (args[0].macroPass === 'postActiveEffects') {
    const num = await warpgate.buttonDialog({
      buttons: [
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
      ],
      title: 'Create how many magic stones?',
    });
    if (num === false) return;

    if (workflow.targets.size !== 1)
      return ui.notifications.warn('Please select One Target');

    let tokentarget = workflow.targets.first();
    let target = tokentarget.document;
    let stoneData = item.toObject();

    const modEval = await new Roll('@mod', item.getRollData()).evaluate({
      async: true,
    });

    const newItemMacro = `
            let uses = workflow.item.system.uses.value;
            if (uses === 0) {
                await warpgate.revert(token.document,"${mutName}");
            }
            `;

    const updates = {
      embedded: {
        //create Throw Stone part of this spell
        Item: {
          'Throw Stone': {
            type: 'spell',
            img: workflow.item.img,

            system: {
              attackBonus: `- @mod + ${modEval.total}`,

              damage: {
                parts: [[`1d6 + ${modEval.total}`, 'bludgeoning']],
              },
              preparation: {
                mode: 'atwill',
              },
              uses: {
                value: num,
                max: num,
                per: 'charges',
              },
              activation: {
                type: 'action',
                cost: 1,
              },
              target: {
                value: 1,
                type: 'creature',
              },
              description: {
                value: `A stone imbued by magic`,
              },

              actionType: 'rsak',
            },

            flags: {
              favtab: {
                isFavorite: true,
              },
            },
            //Here we assign the macro used by Throw Stones
            'flags.midi-qol.onUseMacroName': 'ItemMacro',
            'flags.itemacro.macro.data.name': 'Attack',
            'flags.itemacro.macro.data.type': 'script',
            'flags.itemacro.macro.data.scope': 'global',
            'flags.itemacro.macro.data.command': newItemMacro,
          },
        },
      },
    };

    await warpgate.mutate(
      target,
      updates,
      {},
      { name: mutName, description: mutDescription }
    );
    await actor.setFlag(
      'midi-item-showcase-community',
      'magicStonesTarget',
      target.id
    );

    new Sequence()

      .effect()
      .name('Casting')
      .atLocation(token)
      .file(`jb2a.magic_signs.circle.02.enchantment.loop.dark_purple`)
      .scaleToObject(1.25)
      .rotateIn(180, 600, { ease: 'easeOutCubic' })
      .scaleIn(0, 600, { ease: 'easeOutCubic' })
      .loopProperty('sprite', 'rotation', {
        from: 0,
        to: -360,
        duration: 10000,
      })
      .belowTokens()
      .fadeOut(2000)
      .zIndex(0)

      .effect()
      .atLocation(tokentarget)
      .file(`jb2a.magic_signs.circle.02.enchantment.loop.dark_purple`)
      .scaleToObject(1.25)
      .rotateIn(180, 600, { ease: 'easeOutCubic' })
      .scaleIn(0, 600, { ease: 'easeOutCubic' })
      .loopProperty('sprite', 'rotation', {
        from: 0,
        to: -360,
        duration: 10000,
      })
      .belowTokens(true)
      .filter('ColorMatrix', { saturate: -1, brightness: 2 })
      .filter('Blur', { blurX: 5, blurY: 10 })
      .zIndex(1)
      .duration(1200)
      .fadeIn(200, { ease: 'easeOutCirc', delay: 500 })
      .fadeOut(300, { ease: 'linear' })

      .repeats(5, 200, 200)
      .fadeOut(500)

      .play();
  }

  if (args[0] === 'off') {
    const getTarget = canvas.scene.tokens.get(
      actor.getFlag('midi-item-showcase-community', 'magicStonesTarget')
    );
    await warpgate.revert(getTarget, mutName);
    await actor.unsetFlag('midi-item-showcase-community', 'magicStonesTarget');
  }
}

;// CONCATENATED MODULE: ./scripts/automations/spells/meteorSwarm.js
async function meteorSwarm({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // @sayshal    - Original Author
  // @bakanabaka - Rewrite for extra functionality

  const macroItem = scope.macroItem;
  let config = {
    t: CONST.MEASURED_TEMPLATE_TYPES.CIRCLE,
    distance: 40,
    fillColor: 'red',
    icon: {
      texture: macroItem.img,
      borderVisible: false,
    },
    snap: {
      position:
        CONST.GRID_SNAPPING_MODES.CENTER |
        CONST.GRID_SNAPPING_MODES.EDGE_MIDPOINT |
        CONST.GRID_SNAPPING_MODES.VERTEX,
    },
    lockDrag: true,
    label: {
      text: 'Meteor Swarm (X/4)',
    },
    location: {
      limitMaxRange: 5280,
      showRange: true,
    },
  };

  async function postPreambleComplete() {
    let targetSet = new Set();
    let templateSet = new Set();
    let positionSet = new Set();
    for (let idx = 0; idx < 4; ++idx) {
      config.label.text = `Meteor Swarm (${idx + 1}/4)`;
      let position = await Sequencer.Crosshair.show(config);
      if (!position) break;
      positionSet.add(position);
      let circle = await macroUtil.template.circle(position, 40);
      templateSet.add(circle);
      let targets = macroUtil.template.targets(circle);
      for (let target of targets) targetSet.add(target);
    }

    workflow.meteorSwarmPositions = positionSet;
    workflow.aborted = templateSet.size == 0;
    for (let t of templateSet) t.delete();
    game.user.updateTokenTargets(targetSet.map((t) => t.id));
  }

  async function postDamageRoll() {
    // Animate the explosions
    async function explosions(pos) {
      new Sequence()
        .effect()
        .file('jb2a.fireball.explosion.orange')
        .atLocation(pos)
        .scaleToObject(1.5)
        .play();
      if (game.modules.getName('dnd5e-animations')) {
        const audio_cfg = {
          src: 'modules/dnd5e-animations/assets/sounds/Damage/Explosion/explosion-echo-5.mp3',
          volume: 0.5,
          autoplay: true,
          loop: false,
        };
        AudioHelper.play(audio_cfg, false);
      }
    }

    // The delays are just to give the animations a sense of rhythm
    let positions = workflow.meteorSwarmPositions;
    for (let position of positions) {
      await explosions(position);
      await Sequencer.Helpers.wait(Math.floor(Math.random() * 750));
    }
  }

  const callArguments = {
    speaker: speaker,
    actor: actor,
    token: token,
    character: character,
    item: item,
    args: args,
    scope: scope,
  };
  await macroUtil.runWorkflows(callArguments, {
    postPreambleComplete: postPreambleComplete,
    postDamageRoll: postDamageRoll,
  });
}

;// CONCATENATED MODULE: ./scripts/automations/spells/mislead.js
async function mislead({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
}) {
  let updates = {
    token: {
      name: `${actor.name}`,
      texture: token.document.texture,
      detectionModes: token.document.detectionModes,
      sight: token.document.sight,
      rotation: token.document.rotation,
    },
    actor: {
      name: `${actor.name} Mislead`,
      system: {
        attributes: {
          hp: {
            value: 100,
            max: 100,
          },
          movement: {
            walk: actor.system.attributes.movement.walk * 2,
          },
        },
        details: {
          type: {
            custom: 'NoTarget',
            value: 'custom',
          },
        },
      },
    },
    flags: {
      'mid-qol': {
        neverTarget: true,
      },
    },
  };
  const callbacks = {
    post: async (template, token, updates) => {
      const sourceActorOrToken = fromUuidSync(
        updates.actor.flags.warpgate.control.actor
      );
      const sourceActor = sourceActorOrToken.actor ?? sourceActorOrToken;
      MidiQOL.addConcentrationDependent(sourceActor, token, item);
    },
  };
  const options = { controllingActor: actor };
  const spawningActor = game.actors.getName('Mislead');
  if (!spawningActor) {
    ui.notifications.warn(
      'Actor named "Mislead" not found. Please create actor.'
    );
    return false;
  }
  const ids = await warpgate.spawnAt(
    token.center,
    await spawningActor.getTokenDocument(),
    updates,
    callbacks,
    options
  );
  if (!ids) return;

  await actor.setFlag(
    'midi-item-showcase-community',
    'mislead.spawnedTokenId',
    ids[0]
  );
  await actor.setFlag(
    'midi-item-showcase-community',
    'mislead.item',
    item
  );
  await actor.setFlag(
    'midi-item-showcase-community',
    'mislead.sight',
    false
  );
  const spawnedActor = canvas.scene.tokens.get(ids[0]).actor;
  await DAE.setFlag(spawnedActor, 'spawnedByTokenUuid', token.document.uuid);

  let hookIdForSpawnedCreatures = Hooks.on(
    'preDeleteToken',
    async (tokenDoc) => {
      const sourceTokenUuid = tokenDoc.actor.getFlag(
        'dae',
        'spawnedByTokenUuid'
      );
      if (!sourceTokenUuid) return;
      new Sequence()
        .effect()
        .atLocation(tokenDoc.object.center)
        .file(`jb2a.smoke.puff.centered.grey.2`)
        .scale(tokenDoc.width / canvas.scene.grid.distance)
        .play();
      const sourceActor = fromUuidSync(sourceTokenUuid).actor;
      const spawnedId = sourceActor.getFlag(
        'midi-item-showcase-community',
        'mislead.spawnedTokenId'
      );
      if (!spawnedId) return;
      let spawnedTokenDoc;
      if (canvas.scene.tokens.get(spawnedId)) {
        spawnedTokenDoc = canvas.scene.tokens.get(spawnedId);
      }
      if (spawnedTokenDoc) {
        await sourceActor.unsetFlag(
          'midi-item-showcase-community',
          'mislead.spawnedTokenId'
        );
        Hooks.off('preDeleteToken', hookIdForSpawnedCreatures);
      }
    }
  );
}

;// CONCATENATED MODULE: ./scripts/automations/spells/mordenkainensSword.js
async function mordenkainensSword({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const actorD = game.actors.get(args[0].actor._id);
  const tokenD = canvas.tokens.get(args[0].tokenId);
  const summonName = 'Magic Sword';
  const summonerDc = actorD.system.attributes.spelldc;
  const summonerAttack = summonerDc - 8;

  let updates = {
    token: { alpha: 0 },
    embedded: {
      Item: {
        'Magic Sword Attack': {
          'system.attackBonus': `${summonerAttack}`,
        },
      },
    },
  };

  const [summon] = await warpgate.spawn(summonName, updates);

  new Sequence()
    .effect()
    .file('jb2a.magic_signs.circle.02.evocation.complete.pink')
    .atLocation(summon)
    .belowTokens()
    .scale(0.2)
    .playbackRate(2)
    .waitUntilFinished(-1000)
    .effect()
    .file('jb2a.cure_wounds.200px.pink')
    .atLocation(summon)
    .animation()
    .on(summon)
    .fadeIn(500)
    .opacity(1.0)
    .play();
}

;// CONCATENATED MODULE: ./scripts/automations/spells/powerWordPain.js
async function powerWordPain({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const params = args[0];
  const itemP = params.item;
  if (itemP.type != 'spell') return;
  const sourceToken = canvas.tokens.get(params.tokenId);
  const originEffect = await params.actor.effects.find(
    (ef) => ef.label === 'Power Word Pain'
  );
  const originItem = await fromUuid(originEffect.origin);

  let actorSave = await params.actor.rollAbilitySave('con');
  if (actorSave.total >= originItem.system.save.dc) {
    return;
  } else {
    await ChatMessage.create({
      content: `<i><strong>${sourceToken.name}</strong> is too wracked with pain to cast the spell!</i>`,
    });
    this.aborted = true;
    await game.user.updateTokenTargets();
  }
  Hooks.once('AutomatedAnimations-WorkflowStart', (data) => {
    data.stopWorkflow = true;
  });
}

;// CONCATENATED MODULE: ./scripts/automations/spells/slow.js
async function slow({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const effectImage = scope.effect.img;
  if (args[0] === 'each') {
    await foundry.applications.api.DialogV2.prompt({
      window: { title: 'Effect Reminder' },
      position: { width: 400 },
      content: `<img src="${effectImage}">
        
        ${actor.name} can use an Action OR a Bonus Action.
        
        <br>
        
        Can only make ONE attack.
        
        <br>
        
        Cannot take Reactions.
        
        <br>
        
        When casting a (1-Action) spell, roll a d20.
        
        <hl>
        
        Automatically applied:
        
        <ul style="margin: 0;">
        <li>1/2 Speed</li>
        <li>-2 to AC</li>
        <li>-2 to Dex Saves</li>
        </ul>`,
    });
  }
}

;// CONCATENATED MODULE: ./scripts/automations/spells/mageHand.js
async function mageHand({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  let sourceActor = game.actors.getName('Mage Hand');
  let duration = 60; //Seconds
  let range = 30; //feet
  await chrisPremades.Summons.spawn(
    [sourceActor],
    undefined,
    workflow.item,
    workflow.token,
    { duration: duration, range: range, animation: 'default' }
  );
}

;// CONCATENATED MODULE: ./scripts/automations/spells/beastSense.js
async function beastSense({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // check to see if Beast Sense is not enabled to apply actor conditions.
  async function disabledBeastSense() {
    try {
      // Ensure a token is selected
      if (!token) {
        console.error('No token selected.');
        ui.notifications.warn('Please select your token.');
        return;
      }

      // Ensure casterActor is defined
      const casterActor = token.actor;
      if (!casterActor) {
        console.error('No caster actor found.');
        ui.notifications.warn('Caster actor not found.');
        return;
      }
      const concentrating = casterActor.effects.find(
        (e) => e.name === 'Concentrating: Beast Sense (Spirit Seeker)'
      );
      const casterActorId = casterActor.id;
      const casterActorUuid = casterActor.uuid;

      // Automatically target the first selected token
      const targetTokens = Array.from(game.user.targets);
      if (targetTokens.length === 0) {
        console.error('No target selected.');
        ui.notifications.warn('Please select a target.');
        if (concentrating) await concentrating.delete();
        return;
      }

      const targetToken = targetTokens[0];
      const tokenType = MidiQOL.typeOrRace(targetToken);

      if (!tokenType == 'beast') {
        ui.notifications.warn('Target is NOT a beast!');
        if (concentrating) await concentrating.delete();
        return;
      }

      let tokenUuid = targetToken.document.uuid;
      let parts = tokenUuid.split('.');
      let tokenId = parts[parts.length - 1]; // The last part of the split array is the token ID

      const targetActor = targetToken.actor;

      // Define the origin for the effect if not already defined
      const beastSenseOrigin = concentrating._id;
      const beastSenseOriginUuid = concentrating.uuid;

      const concEffect = MidiQOL.getConcentrationEffect(casterActor);
      const imgPropName = game.version < 12 ? 'icon' : 'img';
      //The After Effects
      const beastSenseEffects = {
        name: 'Beast Sense Effects',
        [imgPropName]: 'graphics/Zantor/icons/humanoid-single-green-blue.png',
        changes: [
          {
            key: 'macro.CE',
            mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
            value: 'Blinded',
          },
          {
            key: 'macro.CE',
            mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
            value: 'Deafened',
          },
        ],
        origin: beastSenseOrigin,
        disabled: false,
        flags: { dae: { showIcon: true } },
      };

      //apply the after effects
      const [newAE] = await casterActor.createEmbeddedDocuments(
        'ActiveEffect',
        [beastSenseEffects]
      );
      ``;

      // add as dependent to concentration
      MidiQOL.addConcentrationDependent(casterActor, newAE);
    } catch (error) {
      console.error('Error applying conditions:', error);
      ui.notifications.error('Failed to apply conditions.');
    }
  }

  //check if Beast Sense is already enabled to remove conditiions.
  async function enableBeastSense() {
    try {
      // Ensure casterActor is defined
      const casterActor = token.actor;
      if (!casterActor) {
        console.error('No caster actor found.');
        ui.notifications.warn('Caster actor not found.');
        return;
      }
      const custom = casterActor.effects.find(
        (e) => e.name === 'Beast Sense Effects'
      );
      const concentrating = casterActor.effects.find(
        (e) => e.name === 'Concentrating: Beast Sense (Spirit Seeker)'
      );

      if (custom) await custom.delete(); // Corrected line
      if (concentrating) await concentrating.delete();

      //executeSetPermissionAsGM("setPermissionToDefault", tokenId);
    } catch (error) {
      console.error('Error removing conditions:', error);
      ui.notifications.error('Failed to remove conditions.');
    }
  }

  // Ensure a token is selected
  if (!token) {
    console.error('No token selected.');
    ui.notifications.warn('Please select your token.');
    return;
  }

  // Find the "Beast Sense (Enabled)" effect on the caster
  const beastSenseEffect = token.actor?.effects.find(
    (e) => e.name === 'Beast Sense Effects'
  );

  if (beastSenseEffect) {
    await enableBeastSense();
  } else {
    await disabledBeastSense();
  }

  // Ensure to clear targets to avoid issues with left-clicking in the future
  game.user.updateTokenTargets([]);
}

;// CONCATENATED MODULE: ./scripts/automations/spells/augury.js
async function augury({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
}) {
  /* Version: 1.1.3
   * Creator: Fridan99
   * Colaborators: Krig (advice an away code), MikeyTheMoose [Suggestion: ui.notifications.warn() instead of console.log()], Freeze (redundancy notice for canvas.tokens.controlled[0], and item as predefined variable)
   * The macro auto-detects how many times the Augury spell has been used, and automatically rolls 1d100 from the 2nd use, respecting the percentage for each subsequent use to get a random answer. Both the chat text and the 1d100 roll are private and only seen by the GM.
   */

  let options = [
    'Weal, for good results',
    'Woe, for bad results',
    'Weal and woe, for both good and bad results',
  ];

  async function auguryResult(question, isPublic) {
    let availableUses = item.system.uses.value;
    let maxUses = item.system.uses.max;
    let chance;

    if (availableUses === maxUses - 1) {
      chance = 0;
    } else if (availableUses === maxUses - 2) {
      chance = 25;
    } else if (availableUses === maxUses - 3) {
      chance = 50;
    } else if (availableUses === maxUses - 4) {
      chance = 75;
    } else {
      chance = 100;
    }

    let result = '';
    let rollResult = '';
    if (availableUses === maxUses - 1) {
      result = `None, GM chooses. NO roll.`;
    } else {
      let roll = new Roll('1d100');
      await roll.evaluate();
      rollResult = `The result of the d100 roll is: <span style="color:blue">${roll.total}</span>`;

      if (roll.total <= chance) {
        let randomOption = options[Math.floor(Math.random() * options.length)];
        result = `${randomOption}`;
      } else {
        result = `None, GM chooses.`;
      }

      if (game.dice3d) {
        await game.dice3d.showForRoll(
          roll,
          game.user,
          true,
          game.users.contents.filter((u) => u.isGM),
          { blind: true }
        );
      }
    }

    let description = `<b>${token.name}</b> is casting the <i>Augury</i> spell to predict the outcome of a specific course of action.<br/><br/><b>Question:</b><br/>${question}`;

    let chatData = {
      user: game.user._id,
      speaker: { alias: token.name },
      content: `${description}`,
    };

    if (!isPublic) {
      chatData.whisper = game.users.contents
        .filter((u) => u.isGM)
        .map((u) => u._id);
    }

    ChatMessage.create(chatData);

    let resultData = {
      user: game.user._id,
      speaker: { alias: token.name },
      content: `<b>Choose one between:</b><br/><br/>- ${options.join(
        '<br/>- '
      )}<br/><br/><b>The random result is as follows:</b><br/>${result}<br/><br/><b>${rollResult}</b>`,
      whisper: game.users.contents.filter((u) => u.isGM).map((u) => u._id),
      blind: true,
    };

    ChatMessage.create(resultData);

    let responseRequirement = isPublic
      ? `<b><span style="color:blue">Public</span></b>`
      : `<b><span style="color:blue">Whisper</span></b>`;
    let responseMessage = `${token.name} requires responses to be sent by ${responseRequirement}.`;

    let responseData = {
      user: game.user._id,
      speaker: { alias: token.name },
      content: responseMessage,
    };

    if (!isPublic) {
      responseData.whisper = game.users.contents
        .filter((u) => u.isGM)
        .map((u) => u._id);
    }

    ChatMessage.create(responseData);
  }

  new Dialog({
    title: 'Ask your question',
    content: `
        <form style="background-color: #f2f2f2; border-radius: 15px; padding: 20px;">
            <p style="color: #333; font-size: 16px;">If you want to make public your question and answer, let empty the question field and press <b style="color: #4CAF50;">Skip</b></p>
            <p style="color: #333; font-size: 16px;">If you want to make secretly your question and answer, fill the question and press <b style="color: #4CAF50;">Secretly</b></p>
            <div class="form-group">
                <label style="color: #333; font-size: 14px;">Question:</label>
                <input name="question" type="text" style="width: 100%; padding: 12px 20px; margin: 8px 0; box-sizing: border-box;"/>
            </div>
        </form>
    `,
    buttons: {
      skip: {
        label: 'Skip',
        callback: (html) =>
          auguryResult(html.find('[name="question"]').val(), true),
      },
      submit: {
        label: 'Secretly',
        callback: (html) =>
          auguryResult(html.find('[name="question"]').val(), false),
      },
    },
    default: 'submit',
  }).render(true);
}

;// CONCATENATED MODULE: ./scripts/automations/spells/divination.js
async function divination({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  /* Version: 1.0.0
   * Creator: Fridan99
   * The macro auto-detects how many times the Divination spell has been used, and automatically rolls 1d100 from the 2nd use, respecting the percentage for each subsequent use to get a random answer. You can choose to make it public or private, in case of public just click the Skip button, you don't need to fill in the question fields, just ask your GM. For private, fill in the question fields, then press Secretly, and wait for your GM to send you a whisper.
   * The GM is the only one who sees the relevant information whether it is public or secret..
   */

  let descriptions = [
    'You feel a divine presence surrounding you, filling the air with a sense of calm and wisdom.',
    'A mystical energy envelops you, and you sense a connection with a higher power.',
    'You reach out with your mind, and feel a celestial entity gently touch your consciousness.',
    "You close your eyes and when you open them, you're in a different realm, filled with divine energy.",
    'You whisper your questions into the void, and feel a comforting presence wrap around you, ready to guide you.',
    'You feel a warm, gentle energy envelop you as you reach out to the divine.',
    'You feel your consciousness expand, reaching out to touch a divine presence.',
    'A soft, ethereal light surrounds you, and you feel a connection with the divine.',
    'You feel a gentle tug at your mind, a divine entity making its presence known.',
    'You reach out with your senses, and feel a divine presence reach back.',
  ];

  async function divinationResult(html, isPublic) {
    let questions = [html.find('[name="question1"]').val()];

    let availableUses = item.system.uses.value;
    let maxUses = item.system.uses.max;
    let chance;

    if (availableUses === maxUses - 1) {
      chance = 0;
    } else if (availableUses === maxUses - 2) {
      chance = 25;
    } else if (availableUses === maxUses - 3) {
      chance = 50;
    } else if (availableUses === maxUses - 4) {
      chance = 75;
    } else {
      chance = 100;
    }

    let result = '';
    let rollResult = '';
    if (availableUses === maxUses - 1 || chance === 0) {
      result = `<b>${token.name}</b> <b><span style="color:blue">The DM offers a truthful reply. The reply might be a short phrase, a cryptic rhyme, or an omen.</span></b>`;
    } else {
      let roll = new Roll('1d100');
      await roll.evaluate({ async: true });

      if (roll.total > chance) {
        result = `<b>${token.name}</b> <span style="color:blue"><b>The DM offers a truthful reply. The reply might be a short phrase, a cryptic rhyme, or an omen.</span></b>`;
        rollResult = `The result of the d100 roll is: <span style="color:blue">${roll.total}</span>`;
      } else {
        result = `<b>${token.name}</b> <span style="color:blue">get a random reading.</span></b>`;
      }

      if (game.dice3d) {
        await game.dice3d.showForRoll(
          roll,
          game.user,
          true,
          game.users.contents.filter((u) => u.isGM),
          { blind: true }
        );
      }
    }

    let description =
      descriptions[Math.floor(Math.random() * descriptions.length)];

    let questionContent = questions
      .map((question, index) =>
        question ? `<b>Question ${index + 1}:</b> ${question}<br/>` : ''
      )
      .join('');

    // Send the casting message, description, questions, and whisper requirement to the chat
    ChatMessage.create({
      user: game.user._id,
      speaker: { alias: token.name },
      content: `<b>${
        token.name
      }</b> is casting <i>Divination</i> spell......<br/><br/>${description}<br/><br/>${questionContent}<br/><b>The entity takes its time to give you an answer...</b><br/><br/>(The <b>${
        token.name
      }</b> requires responses to be sent by <b><span style="color:blue">${
        isPublic ? 'Public' : 'Whisper'
      }</span></b>.)`,
      whisper: isPublic ? null : ChatMessage.getWhisperRecipients('GM'),
    });

    // Send the result and roll result to the GM
    ChatMessage.create({
      user: game.user._id,
      speaker: { alias: token.name },
      content: `<b>${result}</b><br/><br/><b>${rollResult}</b>`,
      whisper: ChatMessage.getWhisperRecipients('GM'),
      blind: true,
    });
  }

  new Dialog({
    title: 'Ask your questions',
    content: `
        <form style="background-color: #f2f2f2; border-radius: 15px; padding: 20px;">
            <p style="color: #333; font-size: 16px;">If you want to make public your questions and answers, let empty the questions field and press <b style="color: #4CAF50;">Skip</b></p>
            <p style="color: #333; font-size: 16px;">If you want to make secretly your questions and answers, fill the questions and press <b style="color: #4CAF50;">Secretly</b></p>
            <div class="form-group">
                <label style="color: #333; font-size: 14px;">Question 1:</label>
                <input name="question1" type="text" style="width: 100%; padding: 12px 20px; margin: 8px 0; box-sizing: border-box;"/>
            </div>
        </form>
    `,
    buttons: {
      skip: {
        label: 'Skip',
        callback: (html) => divinationResult(html, true),
      },
      submit: {
        label: 'Secretly',
        callback: (html) => divinationResult(html, false),
      },
    },
    default: 'submit',
  }).render(true);
}

;// CONCATENATED MODULE: ./scripts/automations/spells/commune.js
async function commune({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  /* Version: 1.0.0
   * Creator: Fridan99
   * Colaborator: Freeze (Help blinding 3d dice roll for player)
   * The macro auto-detects how many times the Commune spell has been used, and automatically rolls 1d100 from the 2nd use, respecting the percentage for each subsequent use to get a random answer. You can choose to make it public or private, in case of public just click the Skip button, you don't need to fill in the question fields, just ask your GM. For private, fill in the question fields, then press Secretly, and wait for your GM to send you a whisper.
   * The GM is the only one who sees the relevant information whether it is public or secret.
   */

  let descriptions = [
    'You feel a divine presence surrounding you, filling the air with a sense of calm and wisdom.',
    'A mystical energy envelops you, and you sense a connection with a higher power.',
    'You reach out with your mind, and feel a celestial entity gently touch your consciousness.',
    "You close your eyes and when you open them, you're in a different realm, filled with divine energy.",
    'You whisper your questions into the void, and feel a comforting presence wrap around you, ready to guide you.',
    'You feel a warm, gentle energy envelop you as you reach out to the divine.',
    'You feel your consciousness expand, reaching out to touch a divine presence.',
    'A soft, ethereal light surrounds you, and you feel a connection with the divine.',
    'You feel a gentle tug at your mind, a divine entity making its presence known.',
    'You reach out with your senses, and feel a divine presence reach back.',
  ];

  async function communeResult(html, isPublic) {
    let questions = [
      html.find('[name="question1"]').val(),
      html.find('[name="question2"]').val(),
      html.find('[name="question3"]').val(),
    ];

    let availableUses = item.system.uses.value;
    let maxUses = item.system.uses.max;
    let chance;

    if (availableUses === maxUses - 1) {
      chance = 0;
    } else if (availableUses === maxUses - 2) {
      chance = 25;
    } else if (availableUses === maxUses - 3) {
      chance = 50;
    } else if (availableUses === maxUses - 4) {
      chance = 75;
    } else {
      chance = 100;
    }

    let result = '';
    let rollResult = '';
    if (availableUses === maxUses - 1 || chance === 0) {
      result = `<b><span style="color:blue">${token.name} is answered.</span></b>`;
    } else {
      let roll = new Roll('1d100');
      await roll.evaluate({ async: true });

      if (roll.total > chance) {
        result = `<b><span style="color:blue">${token.name} is answered.</span></b>`;
        rollResult = `The result of the d100 roll is: <span style="color:blue">${roll.total}</span>`;
      } else {
        result = `<b><span style="color:blue">${token.name} is NOT answered.</span></b>`;
      }

      if (game.dice3d) {
        await game.dice3d.showForRoll(
          roll,
          game.user,
          true,
          game.users.contents.filter((u) => u.isGM),
          { blind: true }
        );
      }
    }

    let description =
      descriptions[Math.floor(Math.random() * descriptions.length)];

    let questionContent = questions
      .map((question, index) =>
        question ? `<b>Question ${index + 1}:</b> ${question}<br/>` : ''
      )
      .join('');

    // Send the casting message, description, questions, and whisper requirement to the chat
    ChatMessage.create({
      user: game.user._id,
      speaker: { alias: token.name },
      content: `<b>${
        token.name
      }</b> is casting <i>Commune</i> spell......<br/><br/>${description}<br/><br/>${questionContent}<br/><b>The entity takes its time to give you an answer...</b><br/><br/>(The <b>${
        token.name
      }</b> requires responses to be sent by <b><span style="color:blue">${
        isPublic ? 'Public' : 'Whisper'
      }</span></b>.)`,
      whisper: isPublic ? null : ChatMessage.getWhisperRecipients('GM'),
    });

    // Send the result and roll result to the GM
    ChatMessage.create({
      user: game.user._id,
      speaker: { alias: token.name },
      content: `<b>${result}</b><br/><br/><b>${rollResult}</b>`,
      whisper: ChatMessage.getWhisperRecipients('GM'),
      blind: true,
    });
  }

  new Dialog({
    title: 'Ask your questions',
    content: `
        <form style="background-color: #f2f2f2; border-radius: 15px; padding: 20px;">
            <p style="color: #333; font-size: 16px;">If you want to make public your questions and answers, let empty the questions field and press <b style="color: #4CAF50;">Skip</b></p>
            <p style="color: #333; font-size: 16px;">If you want to make secretly your questions and answers, fill the questions and press <b style="color: #4CAF50;">Secretly</b></p>
            <div class="form-group">
                <label style="color: #333; font-size: 14px;">Question 1:</label>
                <input name="question1" type="text" style="width: 100%; padding: 12px 20px; margin: 8px 0; box-sizing: border-box;"/>
            </div>
            <div class="form-group">
                <label style="color: #333; font-size: 14px;">Question 2:</label>
                <input name="question2" type="text" style="width: 100%; padding: 12px 20px; margin: 8px 0; box-sizing: border-box;"/>
            </div>
            <div class="form-group">
                <label style="color: #333; font-size: 14px;">Question 3:</label>
                <input name="question3" type="text" style="width: 100%; padding: 12px 20px; margin: 8px 0; box-sizing: border-box;"/>
            </div>
        </form>
    `,
    buttons: {
      skip: {
        label: 'Skip',
        callback: (html) => communeResult(html, true),
      },
      submit: {
        label: 'Secretly',
        callback: (html) => communeResult(html, false),
      },
    },
    default: 'submit',
  }).render(true);
}

;// CONCATENATED MODULE: ./scripts/automations/spells/message.js
async function message({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  /* Version: 1.0.0
   * Creator: Fridan99
   * You can choose a Player Character, or an NPC (for which you must write a name) and it will be sent to the GM.
   */

  let tokens = canvas.tokens.placeables.filter((t) => t.actor.hasPlayerOwner);
  let controlledTokenName = canvas.tokens.controlled[0]?.name || game.user.name;
  let tokenNames = tokens
    .map((t) => t.name)
    .sort()
    .filter((name) => name !== controlledTokenName);

  new Dialog({
    title: 'Message Spell',
    content: `
    <style>
      .message-dialog {
        background-color: #f0f8ff;
        border-radius: 8px;
        padding: 20px;
      }
      .message-dialog h3 {
        color: #4b9cd3;
        font-family: 'Arial', sans-serif;
      }
      .message-dialog p {
        color: #333;
        font-family: 'Verdana', sans-serif;
      }
      .message-dialog .form-group {
        margin-bottom: 15px;
      }
      .message-dialog label {
        color: #555;
        font-weight: bold;
      }
      .message-dialog input[type="text"],
      .message-dialog select {
        width: 100%;
        padding: 8px 12px;
        margin-top: 5px;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
      }
      .message-dialog select {
        height: auto; /* Ensures the height adjusts properly */
        line-height: normal; /* Default line height to avoid cropping text */
      }
      .message-dialog input[type="radio"] {
        margin-right: 10px;
      }
      .message-dialog .small-text {
        font-size: 12px;
        color: #888;
      }
      .dialog-buttons {
        margin-top: 20px;
      }
      .dialog-buttons .button {
        background-color: #4b9cd3;
        color: #fff;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
      }
      .dialog-buttons .button:hover {
        background-color: #357aab;
      }
    </style>
    <div class="message-dialog">
      <h3>You are casting the <i>message</i> spell</h3>
      <p>Send a whisper message to a creature up to 120 feet of distance.</p><br>
      <form>
        <div class="form-group">
          <label>Whisper message:</label>
          <input id="message-text" name="message-text" type="text"/>
        </div>
        <div class="form-group">
          <label><input type="radio" name="target-type" value="token" checked> Choose Player:</label>
          <select id="target-token" name="target-token">
            ${tokenNames
              .map((name) => `<option value="${name}">${name}</option>`)
              .join('')}
          </select>
        </div>
        <div class="form-group">
          <label><input type="radio" name="target-type" value="npc"> Choose NPC:</label>
          <input id="target-npc" name="target-npc" type="text" placeholder="Write the NPC name"/>
        </div>
      </form>
      <p class="small-text">If you choose a NPC, then write the name and the message will be sent to the GM.</p>
    </div>
  `,
    buttons: {
      send: {
        label: 'Send',
        callback: (html) => {
          let messageText = html.find('#message-text')[0].value;
          let targetType = html.find('input[name="target-type"]:checked')[0]
            .value;
          let targetTokenName = html.find('#target-token')[0].value;
          let targetNpcName = html.find('#target-npc')[0].value;
          let targetName =
            targetType === 'token' ? targetTokenName : targetNpcName;

          if (targetType === 'token') {
            let targetToken = tokens.find((t) => t.name === targetName);
            if (targetToken) {
              let whisperRecipients = targetToken.actor
                .getActiveTokens()
                .map((t) => t.actor)
                .filter((a) => a.hasPlayerOwner && a.owner)
                .map((a) => a.owner);
              whisperRecipients.push(game.user); // Add the current user to the recipients
              whisperRecipients = whisperRecipients
                .filter((u) => u)
                .map((u) => u.id); // Convert to user IDs

              ChatMessage.create({
                content: `<b>${controlledTokenName}</b> is sending a <span style="color:blue;font-weight:bold">whisper</span> message to <b>${targetName}</b>:<br><br><i>${messageText}</i><br><br><br>You can reply to <b>${controlledTokenName}</b> in a <span style="color:blue;font-weight:bold">whisper</span>.`,
                whisper: whisperRecipients,
              });
            } else {
              ui.notifications.warn(
                `No token named "${targetName}" was found.`
              );
            }
          } else {
            // If the target is an NPC, we send a whisper to the GM.
            let gm = game.users.find((u) => u.isGM);
            if (gm) {
              ChatMessage.create({
                content: `<b>${controlledTokenName}</b> is sending a <span style="color:blue;font-weight:bold">whisper</span> message to <b>${targetName} (NPC Character)</b>:<br><br><i>${messageText}</i><br><br><br>You can reply to <b>${controlledTokenName}</b> in a <span style="color:blue;font-weight:bold">whisper</span>.`,
                whisper: [gm.id],
              });
            } else {
              ui.notifications.warn(`No GM found.`);
            }
          }
        },
      },
    },
    default: 'send',
  }).render(true);
}

;// CONCATENATED MODULE: ./scripts/automations/spells/powerWordKill.js
async function powerWordKill({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  /* Version: 1.1.0
   * Creator: Fridan99
   * Colaborator: thatlonelybugbear (help improving the macro)
   * Target an enemy, and the macro auto-detects how many current hit points has the target. If higher to 100, then the GM receives a green card (the spell doesn't nothing), if fewer or equal to 100, then the GM receives a red card (the spell autoreduce to 0 hit points the target)
   * The macro auto-detects if the target has an active DAE effect called "Death Ward" spell. So you can create a DAE effect, put Duration: 28800, Details: active Always Show Effect Icon. If the effect of Death Ward is active, then prevent the Power Word Kill, and the effect dissapears.
   */

  // Power Word Kill Macro

  // Get the targeted token
  const target = workflow.targets.first();
  const targetActor = target.actor;

  // Check the current hit points of the targeted token
  const targetHP = targetActor.system.attributes.hp.value;

  // Check if the targeted token has the "Death Ward" effect
  const deathWardEffect = targetActor.appliedEffects.find(
    (e) => e.name === 'Death Ward'
  );

  // Determine the message and action based on the current hit points and "Death Ward" effect
  let message;
  let color;
  if (targetHP > 100) {
    message = `The spell doesn't do anything because the targeted token <strong>${target.name}</strong> has more than 100 hit points (<strong style="color:white;">${targetHP} current HP</strong>).`;
    color = '#4CAF50'; // Green
  } else if (deathWardEffect) {
    // The token has the "Death Ward" effect, so prevent the damage and remove the effect
    await MidiQOL.socket().executeAsGM('removeEffects', {
      actorUuid: targetActor.uuid,
      effects: [deathWardEffect.id],
    });
    message = `The token <strong>${target.name}</strong> prevents to die, and the Death Ward spell is lost.`;
    color = '#4CAF50'; // Green
  } else {
    // Reduce the token's hit points to 0 using MidiQOL
    const damage = targetHP + (targetActor.system.attributes.hp.temp ?? 0);
    await MidiQOL.applyTokenDamage(
      [{ damage, type: 'necrotic' }],
      damage,
      new Set([target]),
      scope.rolledItem,
      new Set(),
      { forceApply: true }
    );
    message = `The token <strong>${target.name}</strong> dies because it has less than 100 hit points (<strong style="color:white;">${targetHP} current HP</strong>).`;
    color = '#F44336'; // Red
  }

  // Create the chat card
  const chatCard = `
<div style="border-radius: 8px; padding: 16px; background-color: ${color}; color: white; font-family: Arial, sans-serif;">
  <h3 style="margin-top: 0;">Power Word: Kill</h3>
  <p>${message}</p>
</div>
`;

  // Whisper the chat card to the GM
  ChatMessage.create({
    content: chatCard,
    whisper: [game.users.find((u) => u.isGM).id],
  });
}

;// CONCATENATED MODULE: ./scripts/automations/spells/soulCage.js
async function soulCage({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  let tokenDoc = token.document;
  const featMacros =
    'const params = args[0];\nconst sourceToken = canvas.tokens.get(params.tokenId);\nconst sourceActor = params.actor;\nconst soulEffect = await sourceActor.effects.find(\n  (ef) => ef.label === "Soul Cage"\n);\nconst soulItem = await sourceActor.items.find((i) => i.name === "Trapped Soul");\nif (soulItem.system.uses.value === 0) {\n  await soulEffect.delete();\n}';

  if (args[0] === 'on') {
    const soulUpdates = {
      name: 'Trapped Soul',
      type: 'consumable',
      img: 'icons/magic/unholy/strike-body-explode-disintegrate.webp',
      system: {
        identified: true,
        unidentified: {
          description: '',
        },
        quantity: 1,
        equipped: true,
        activation: {
          type: 'special',
          cost: null,
          condition: '',
        },
        duration: {
          value: '',
          units: '',
        },
        uses: {
          value: 6,
          max: '6',
          per: 'charges',
          recovery: '',
          prompt: true,
          autoDestroy: true,
        },
      },
    };
    await chrisPremades.utils.itemUtils.createItems(actor, [soulUpdates], {
      favorite: true,
      parentEntity: scope.effect,
    });
    let trappedSoul = actor.items.getName('Trapped Soul');
    console.log('trappedSoul', trappedSoul);
    let trappedSoulId = trappedSoul.id;
    const soulFeatUpdates = [
      {
        name: 'Trapped Soul - Borrow Experience',
        type: 'feat',
        img: 'icons/magic/unholy/strike-body-explode-disintegrate.webp', //Example: "icons/magic/holy/projectiles-blades-salvo-yellow.webp"
        _id: randomID(),
        system: {
          activation: {
            type: 'bonus',
            cost: 1,
            condition: '',
          },
          target: {
            value: null,
            width: null,
            units: '',
            type: 'self',
            prompt: true,
          },
          range: {
            value: null,
            long: null,
            units: 'self',
          },
          consume: {
            type: 'charges',
            target: trappedSoulId,
            amount: 1,
            scale: false,
          },
          ability: null,
          actionType: 'other',
          attack: {
            bonus: '',
            flat: false,
          },
        },
        effects: [
          {
            name: 'Trapped Soul - Borrow Experience',
            changes: [
              {
                key: 'flags.midi-qol.advantage.all',
                mode: 0,
                value: '1',
                priority: 20,
              },
            ],
            transfer: false,
            icon: 'icons/magic/unholy/strike-body-explode-disintegrate.webp',
            disabled: false,
            duration: {
              startTime: null,
              seconds: 6,
              combat: null,
              rounds: null,
              turns: null,
              startRound: null,
              startTurn: null,
            },
            description: '',
            origin: null,
            statuses: [],
            flags: {
              dae: {
                disableIncapacitated: false,
                selfTarget: false,
                selfTargetAlways: false,
                dontApply: false,
                stackable: 'noneName',
                showIcon: false,
                durationExpression: '',
                macroRepeat: 'none',
                specialDuration: ['1Attack', 'isCheck', 'isSkill', 'isSave'],
              },
            },
          },
        ],
        flags: {
          dae: {
            macro: {
              name: 'Trapped Soul - Borrow Experience',
              img: 'icons/magic/unholy/strike-body-explode-disintegrate.webp',
              type: 'script',
              scope: 'global',
              command: featMacros,
              author: 'jM4h8qpyxwTpfNli',
              ownership: {
                default: 3,
              },
              _id: null,
              folder: null,
              sort: 0,
              flags: {},
            },
          },
          'midi-qol': {
            rollAttackPerTarget: 'default',
            itemCondition: '',
            effectCondition: '',
            onUseMacroName: '[preActiveEffects]ItemMacro',
          },
        },
      },
      {
        name: 'Trapped Soul - Steal Life',
        type: 'feat',
        img: 'icons/magic/unholy/strike-body-explode-disintegrate.webp',
        _id: randomID(),

        system: {
          source: {},
          activation: {
            type: 'bonus',
            cost: 1,
            condition: '',
          },
          target: {
            value: null,
            width: null,
            units: '',
            type: 'self',
            prompt: true,
          },
          range: {
            value: null,
            long: null,
            units: 'self',
          },
          consume: {
            type: 'charges',
            target: trappedSoulId,
            amount: 1,
            scale: false,
          },
          actionType: 'heal',
          damage: {
            parts: [['2d8', 'healing']],
          },
        },
        flags: {
          dae: {
            macro: {
              name: 'Trapped Soul - Steal Life',
              img: 'icons/magic/unholy/strike-body-explode-disintegrate.webp',
              type: 'script',
              scope: 'global',
              command: featMacros,
              author: 'jM4h8qpyxwTpfNli',
              ownership: {
                default: 3,
              },
              _id: null,
              folder: null,
              sort: 0,
              flags: {},
            },
          },
          'midi-qol': {
            rollAttackPerTarget: 'default',
            itemCondition: '',
            effectCondition: '',
            onUseMacroName: '[preDamageApplication]ItemMacro',
          },
        },
      },
      {
        name: 'Trapped Soul - Eyes of the Dead',
        type: 'feat',
        img: 'icons/magic/unholy/strike-body-explode-disintegrate.webp',
        _id: randomID(),
        system: {
          source: {},
          activation: {
            type: 'action',
            cost: 1,
            condition: '',
          },
          duration: {
            value: '10',
            units: 'minute',
          },
          consume: {
            type: 'charges',
            target: trappedSoulId,
            amount: 1,
            scale: false,
          },
          ability: null,
          actionType: 'other',
          attack: {
            bonus: '',
            flat: false,
          },
        },
        flags: {
          dae: {
            macro: {
              name: 'Trapped Soul - Eyes of the Dead',
              img: 'icons/magic/unholy/strike-body-explode-disintegrate.webp',
              type: 'script',
              scope: 'global',
              command: featMacros,
              author: 'jM4h8qpyxwTpfNli',
              ownership: {
                default: 3,
              },
              _id: null,
              folder: null,
              sort: 0,
              flags: {},
            },
          },
          'midi-qol': {
            rollAttackPerTarget: 'default',
            itemCondition: '',
            effectCondition: '',
            onUseMacroName: '[postActiveEffects]ItemMacro',
          },
        },
      },
      {
        name: 'Trapped Soul - Query Soul',
        type: 'feat',
        img: 'icons/magic/unholy/strike-body-explode-disintegrate.webp',
        _id: randomID(),

        system: {
          activation: {
            type: 'special',
            cost: 1,
            condition: '',
          },
          consume: {
            type: 'charges',
            target: trappedSoulId,
            amount: 1,
            scale: false,
          },
          ability: null,
          actionType: 'other',
          attack: {
            bonus: '',
            flat: false,
          },
        },
        flags: {
          dae: {
            macro: {
              name: 'Trapped Soul - Query Soul',
              img: 'icons/magic/unholy/strike-body-explode-disintegrate.webp',
              type: 'script',
              scope: 'global',
              command: featMacros,
              author: 'jM4h8qpyxwTpfNli',
              ownership: {
                default: 3,
              },
              _id: null,
              folder: null,
              sort: 0,
              flags: {},
            },
          },
          'midi-qol': {
            rollAttackPerTarget: 'default',
            itemCondition: '',
            effectCondition: '',
            onUseMacroName: '[postActiveEffects]ItemMacro',
          },
        },
      },
    ];
    await chrisPremades.utils.itemUtils.createItems(actor, soulFeatUpdates, {
      favorite: true,
      parentEntity: trappedSoul,
    });
  } else if (args[0] === 'off') {
    // await actor.items.getName("Trapped Soul").delete();
    // for (let feat of soulFeatUpdates) {
    //   await actor.items.getName(feat.name).delete();
    // }
    //   // await warpgate.revert(tokenDoc, soulFeatOptions.name);
    //   // await warpgate.revert(tokenDoc, soulOptions.name);
    // }
  }
}

;// CONCATENATED MODULE: ./scripts/automations/spells/tashasMindWhip.js
async function tashasMindWhip({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  if (args[0] === 'each') {
    const effectImage = scope.effect.img;
    await foundry.applications.api.DialogV2.prompt({
      window: { title: 'Effect Reminder' },
      position: { width: 400 },
      content: `<img src="${effectImage}"><br/><br/><p>${token.actor.name} can’t take a reaction until the end of this turn. Moreover, on this next turn, ${token.actor.name} must choose whether it gets a <strong>move</strong>, an <strong>action</strong>, or a <strong>bonus action</strong>; it gets <strong>only one of the three</strong>.</p>`,
    });
  }
}

;// CONCATENATED MODULE: ./scripts/automations/spells/tensersTransformation.js
async function tensersTransformation({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  let exAtk = actor.items.getName('Extra Attack');
  if (exAtk) return;
  let featuresToGrant = await game.packs.get('midi-item-showcase-community.misc-spell-items').getDocuments({name: 'Extra Attack (Special)'});
  await actor.createEmbeddedDocuments('Item', featuresToGrant);
}

;// CONCATENATED MODULE: ./scripts/automations/spells/flameArrows.js
async function flameArrows({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  // Variables needed for the code to work
  let target = workflow.targets.first().actor;
  const hasConcApplied = MidiQOL.getConcentrationEffect(actor, scope.macroItem.uuid);
  let spellLevel = workflow.castData.castLevel;
  let effect = target.effects.getName('Flame Arrows');
  if (effect) return; // Exit if the effect is already on the target
  let ammo = 2 * spellLevel + 6; // 2 * (spellLevel - 3) + 12
  const effectData = {
    name: scope.macroItem.name,
    changes: [
      {
        key: 'flags.midi-qol.optional.flameArrows.activation',
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: "workflow.hitTargets.size, item.actionType === 'rwak'",
      },
      {
        key: 'flags.midi-qol.optional.flameArrows.damage.rwak',
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: '1d6[fire]',
      },
      {
        key: 'flags.midi-qol.optional.flameArrows.label',
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: 'Flame Arrows',
      },
      {
        key: 'flags.midi-qol.optional.flameArrows.force',
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: 'true',
      }, // Change to flase if you don't want to always use the flame arrows
      {
        key: 'flags.midi-qol.optional.flameArrows.count',
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: ammo,
      },
    ],
    icon: 'icons/weapons/ammunition/arrow-broadhead-glowing-orange.webp', // Place the path of your image here in between the ` `
    origin: hasConcApplied.uuid,
    duration: {
      seconds: 3600,
    },
  };
  let effectName = await MidiQOL.socket().executeAsGM('createEffects', {
    actorUuid: target.uuid,
    effects: [effectData],
  });
  await MidiQOL.socket().executeAsGM('addDependent', {
    concentrationEffectUuid: hasConcApplied.uuid,
    dependentUuid: `${effectName[0].uuid}`,
  });
}

;// CONCATENATED MODULE: ./scripts/automations/spells/crownOfStars.js
// @bakanabaka

async function crownOfStars_crownOfStars({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const macroItem = scope.macroItem;
  const effect = scope.effect;

  const ANIMATION_FILE = 'jb2a.twinkling_stars.points07.white';

  const spellLevel = args[args.length - 2];
  const moteCount = 2 * (spellLevel ?? 7) - 7;
  const effectUniqueName = `[${actor.id}] Crown of Stars`;

  async function onEffect() {
    let starMoteItem = actor.items.find((it) => it.name == 'Star Mote');
    await starMoteItem.update({
      'system.uses': { value: moteCount, max: moteCount, per: 'charges' },
    });
    ui.notifications.notify(
      'Your Star Motes have been created as a spell in your spellbook.'
    );

    // Don"t realistically need to wait on either of these
    actor.setFlag(
      'world',
      `${macroItem.name}`,
      [...Array(moteCount).keys()].map((i) => i + 1)
    );
    macroUtil.animation.crownOfStars.create(token, moteCount, {
      effect: effect,
      id: effectUniqueName,
      file: ANIMATION_FILE,
    });
  }

  async function offEffect() {
    macroUtil.animation.crownOfStars.destroy(token, { id: effectUniqueName });
    await actor.unsetFlag('world', `${macroItem.name}`);
  }

  const callArguments = {
    speaker: speaker,
    actor: actor,
    token: token,
    character: character,
    item: item,
    args: args,
    scope: scope,
  };
  await macroUtil.runWorkflows(callArguments, {
    on: onEffect,
    off: offEffect,
  });
}

;// CONCATENATED MODULE: ./scripts/automations/spells/produceFlame.js
// @bakanabaka

async function produceFlame({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const macroItem = scope.macroItem;

  async function preTargeting() {
    let produceFlameEffect = macroItem.effects.find(
      (ef) => ef.name == 'Produce Flame'
    );
    if (!workflow.targets.size) {
      const updates = {
        system: { target: { value: null, units: null, type: 'self' } },
      };
      workflow.item = await macroUtil.item.syntheticItem(
        workflow.item,
        actor,
        updates
      );
      produceFlameEffect.update({ disabled: !produceFlameEffect.disabled });
    }
  }

  async function preItemRoll() {
    if (!workflow.targets.size) {
      workflow.aborted = true;
    }
  }

  async function postAttackRoll() {
    let produceFlameEffect = macroItem.effects.find(
      (ef) => ef.name == 'Produce Flame'
    );
    if (produceFlameEffect) produceFlameEffect.update({ disabled: true });
  }

  const callArguments = {
    speaker: speaker,
    actor: actor,
    token: token,
    character: character,
    item: item,
    args: args,
    scope: scope,
  };
  await macroUtil.runWorkflows(callArguments, {
    preTargeting: preTargeting,
    preItemRoll: preItemRoll,
    postAttackRoll: postAttackRoll,
  });
}

;// CONCATENATED MODULE: ./scripts/automations/spells/negativeEnergyFlood.js
// @bakanabaka

async function negativeEnergyFlood({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const macroItem = scope.macroItem;

  async function preDamageRoll() {
    const targetToken = workflow.targets.first();
    const targetType =
      targetToken.actor.system.details.type.value?.toLowerCase();
    if (targetType == undefined || targetType == '')
      console.warn(
        `Token ${targetToken.id} has no creature type (eg 'undead, humanoid, ooze,...')`,
        targetToken
      );

    if (targetType != 'undead') return;

    const updates = {
      'system.actionType': 'heal',
      'system.damage.parts': [['5d12', 'temphp']],
      'system.save.ability': '',
      'system.save.dc': null,
      'system.save.scaling': 'flag',
    };
    workflow.item = await macroUtil.item.syntheticItem(
      workflow.item,
      actor,
      updates
    );
  }

  async function preDamageApplication() {
    if (!workflow.damageItem.oldHP) return;
    if (workflow.damageItem.oldHP != workflow.damageItem.hpDamage) return;

    const zombification = macroItem.effects.find(
      (ef) => ef.name == 'Zombification'
    );
    const target = canvas.tokens.get(workflow.damageItem.tokenId);
    await macroUtil.effect.create(target.actor, zombification);
  }

  async function offEffect() {
    let zombie = game.actors.getName('Zombie');
    if (!zombie)
      zombie = fromUuidSync(macroItem.system.summons?.profiles?.first().uuid);
    if (!zombie)
      ui.notifications.error(
        "No zombie actor detected in either actor's tab or in configured summons"
      );
    else await actor.transformInto(zombie, {}, { renderSheet: false });
  }

  const callArguments = {
    speaker: speaker,
    actor: actor,
    token: token,
    character: character,
    item: item,
    args: args,
    scope: scope,
  };
  await macroUtil.runWorkflows(callArguments, {
    preDamageRoll: preDamageRoll,
    preDamageApplication: preDamageApplication,
    off: offEffect,
  });
}

;// CONCATENATED MODULE: ./scripts/automations/spells/spells.js

























let spells = {
  absorbElements: absorbElements,
  borrowedKnowledge: borrowedKnowledge,
  crownOfStars: crownOfStars_crownOfStars,
  flamingSphere: flamingSphere,
  goodberry: goodberry,
  magicStone: magicStone,
  meteorSwarm: meteorSwarm,
  mislead: mislead,
  mordenkainensSword: mordenkainensSword,
  powerWordPain: powerWordPain,
  slow: slow,
  mageHand: mageHand,
  beastSense: beastSense,
  augury: augury,
  divination: divination,
  commune: commune,
  message: message,
  powerWordKill: powerWordKill,
  soulCage: soulCage,
  tashasMindWhip: tashasMindWhip,
  tensersTransformation: tensersTransformation,
  flameArrows: flameArrows,
  produceFlame: produceFlame,
  negativeEnergyFlood: negativeEnergyFlood,
};

;// CONCATENATED MODULE: ./scripts/automations/unearthedArcana/ClassFeatures/Cleric/channelDivinityDivineSpark.js
async function channelDivinityDivineSpark({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  const clericLevel = actor.classes.cleric?.levels;
  let damageDice = 1;
  if (clericLevel > 17) {
    damageDice = 4;
  } else if (clericLevel > 12) {
    damageDice = 3;
  } else if (clericLevel > 6) {
    damageDice = 2;
  }

  const choices = [
    {
      label: 'Healing',
      value: { id: 'healing', string: 'Healing' },
    },
    {
      label: 'Radiant damage',
      value: { id: 'radiant', string: 'Radiant' },
    },
    {
      label: 'Necrotic damage',
      value: { id: 'necrotic', string: 'Necrotic' },
    },
  ];

  const choice = await warpgate.buttonDialog(
    { buttons: choices, title: 'Divine Spark' },
    'column'
  );

  let itemData;
  if (choice.id === 'healing') {
    itemData = {
      name: 'Channel Divinity: Divine Spark (Heal)',
      type: 'feat',
      img: 'icons/magic/light/explosion-star-small-blue-yellow.webp',
      system: {
        description: {
          value: `<p>As a Magic action, you point your Holy Symbol at another creature you can see within 30 feet of yourself and focus divine energy at them. Roll ${damageDice}d8 and add your Wisdom modifier. You restore Hit Points to the creature equal to that total</p>`,
          chat: '',
          unidentified: '',
        },
        activation: {
          type: 'action',
          cost: 1,
        },
        target: {
          value: 1,
          type: 'creature',
        },
        range: {
          value: 30,
          units: 'ft',
        },
        ability: 'wis',
        actionType: 'heal',
        damage: {
          parts: [['1d8[healing] + @mod', 'healing']],
        },
      },
      flags: {
        midiProperties: {
          magicdam: true,
          magiceffect: true,
        },
      },
    };
  } else if (choice) {
    itemData = {
      name: 'Channel Divinity: Divine Spark (Harm)',
      type: 'feat',
      img: 'icons/magic/light/explosion-star-small-blue-yellow.webp',
      system: {
        description: {
          value: `<p>As a Magic action, you point your Holy Symbol at another creature you can see within 30 feet of yourself and focus divine energy at them. Roll ${damageDice}d8 and add your Wisdom modifier. You force the creature to make a Constitution saving throw. On a failed save, the creature takes ${choice.string} damage equal to that total. On a successful save, the creature takes half as much damage (round down).</p>`,
          chat: '',
          unidentified: '',
        },
        activation: {
          type: 'action',
          cost: 1,
        },
        target: {
          value: 1,
          type: 'creature',
        },
        range: {
          value: 30,
          units: 'ft',
        },
        ability: 'wis',
        actionType: 'save',
        damage: {
          parts: [[`1d8[${choice.id}] + @mod`, choice]],
        },
        formula: '',
        save: {
          ability: 'con',
          dc: null,
          scaling: 'spell',
        },
      },
      flags: {
        midiProperties: {
          halfdam: true,
          magicdam: true,
          magiceffect: true,
        },
      },
    };
  }

  if (choice) {
    let itemToRoll = new Item.implementation(itemData, { parent: actor });
    await MidiQOL.completeItemUse(itemToRoll);
    game.messages.get(args[0].itemCardId).delete();
  }
}

;// CONCATENATED MODULE: ./scripts/automations/unearthedArcana/ClassFeatures/Wizard/memorizeSpell.js
async function memorizeSpell({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
}) {
  const mutName = 'Memorize Spell';
  const thisToken = token.document;

  function sortFunc(a, b) {
    if (a.system.level > b.system.level) return 1;
    else if (b.system.level > a.system.level) return -1;
    else return a.name.localeCompare(b.name);
  }

  const spells = actor.items
    .filter(
      (i) =>
        i.type === 'spell' &&
        i.system.level > 0 &&
        i.system.preparation.mode === 'prepared' &&
        !i.system.preparation.prepared
    )
    .sort(sortFunc);

  const options = spells.reduce((acc, curr) => {
    acc.push({
      label: `<img src="${curr.img}" width="32px" style="margin-bottom:-8px;border:none"> ${curr.name}`,
      value: curr,
    });
    return acc;
  }, []);

  const selection = await warpgate.buttonDialog(
    { buttons: options, title: 'Choose a spell.' },
    'column'
  );
  if (!selection) return;

  const toShorthand = (shorthand, item) => {
    shorthand[item.id] = {
      'system.preparation.prepared': true,
    };

    return shorthand;
  };

  const hasMutation = (tokenDoc) => {
    const stack = warpgate.mutationStack(tokenDoc);
    return !!stack.getName(mutName);
  };

  const thisActor = thisToken.actor;
  const entries = [selection].reduce(toShorthand, {});

  if (hasMutation(thisToken)) await warpgate.revert(thisToken, mutName);
  await warpgate.mutate(
    thisToken,
    { embedded: { Item: entries } },
    {},
    { name: mutName, comparisonKeys: { Item: 'id' } }
  );
}

;// CONCATENATED MODULE: ./scripts/automations/unearthedArcana/Spells/sorcerousBurst.js
async function sorcerousBurst({
  speaker,
  actor,
  token,
  character,
  item,
  args,
  scope,
  workflow,
  options,
}) {
  let damageTypes = {
    acid: '🧪 Acid',
    cold: '❄️ Cold',
    fire: '🔥 Fire',
    lightning: '⚡ Lightning',
    poison: '☠️ Poison',
    psychic: '🧠 Psychic',
    thunder: '☁️ Thunder',
  };

  const menu = new Portal.FormBuilder();
  menu.title('Sorcerous Burst').select({
    name: 'damageType',
    options: damageTypes,
    label: 'Select a damage type',
  });

  let selection = await menu.render();

  if (!selection) {
    return;
  }

  let damageFormula = workflow.item.system.damage.parts[0][0].replace(
    'none',
    selection.damageType
  );
  let damage = [[damageFormula, selection.damageType]];
  let animation, color;

  switch (selection.damageType) {
    case 'acid':
      animation = 'rayoffrost';
      color = 'green';
      break;
    case 'cold':
      animation = 'rayoffrost';
      color = 'blue';
      break;
    case 'fire':
      animation = 'firebolt';
      color = 'orange';
      break;
    case 'lightning':
      animation = 'chainlightning';
      color = 'purpleblue';
      break;
    case 'poison':
      animation = 'scorchingray';
      color = 'green';
      break;
    case 'psychic':
      animation = 'firebolt';
      color = 'purple';
      break;
    case 'thunder':
      animation = 'rayoffrost';
      color = 'yellowblue';
      break;
  }

  const updates = {
    'system.damage.parts': damage,
    'system.prof': workflow.item.system.prof,
    'flags.autoanimations.primary.video.animation': animation,
    'flags.autoanimations.primary.video.color': color,
  };

  let newItem = workflow.item.clone(updates, { keepId: true });
  newItem.prepareFinalAttributes();
  workflow.item = newItem;
}

;// CONCATENATED MODULE: ./scripts/automations/unearthedArcana/unearthedArcana.js




let UA = {
  channelDivinityDivineSpark: channelDivinityDivineSpark,
  memorizeSpell: memorizeSpell,
  sorcerousBurst: sorcerousBurst,
};

;// CONCATENATED MODULE: ./scripts/macros.js















let scripts = {
  runElwinsHelpers: runElwinsHelpers,
  runElwinsHelpersCoating: runElwinsHelpersCoating,
  setupBakanaMacros: setupBakanaMacros,
};

let macros = {
  actions: actions,
  classFeatures: classFeatures,
  features: features,
  homebrew: homebrew,
  itemFeatures: itemFeatures,
  items: items,
  monsters: monsters,
  raceFeatures: raceFeatures,
  spellItems: spellItems,
  spells: spells,
  UA: UA,
};

;// CONCATENATED MODULE: ./scripts/settings.js




function registerSettings() {
  game.settings.register(moduleName, 'Update Actors', {
    name: 'Create Module Actors',
    hint: 'Enabling this will create actors from this module in the sidebar',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: async (value) => {
      if (value && game.user.isGM) await setupActors();
    },
  });
  game.settings.register(moduleName, 'Elwin Helpers', {
    name: 'Use Elwin Helpers',
    hint: "Enabling this will enable automations that rely on Elwin's Helper Script",
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: async (value) => {
      if (value) {
        await scripts.runElwinsHelpers();
        await scripts.runElwinsHelpersCoating();
      }
    },
  });
}

;// CONCATENATED MODULE: ./scripts/config.js


function setConfig() {
  foundry.utils.setProperty(CONFIG, moduleName, {
    module: moduleName,
    automations: {
      'Absorbing Tattoo, Acid': {
        name: 'Absorbing Tattoo, Acid',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      'Absorbing Tattoo, Cold': {
        name: 'Absorbing Tattoo, Cold',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      'Absorbing Tattoo, Fire': {
        name: 'Absorbing Tattoo, Fire',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      'Absorbing Tattoo, Force': {
        name: 'Absorbing Tattoo, Force',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      'Absorbing Tattoo, Lightning': {
        name: 'Absorbing Tattoo, Lightning',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      'Absorbing Tattoo, Necrotic': {
        name: 'Absorbing Tattoo, Necrotic',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      'Absorbing Tattoo, Poison': {
        name: 'Absorbing Tattoo, Poison',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      'Absorbing Tattoo, Psychic': {
        name: 'Absorbing Tattoo, Psychic',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      'Absorbing Tattoo, Radiant': {
        name: 'Absorbing Tattoo, Radiant',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      'Absorbing Tattoo, Thunder': {
        name: 'Absorbing Tattoo, Thunder',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      "Alchemist's Fire (flask)": {
        name: "Alchemist's Fire (flask)",
        type: 'Item',
        version: '1.0.1',
        authors: ['Moto Moto'],
      },
      'All or Nothing Armor': {
        name: 'All of Nothing Armor',
        type: 'Item',
        homebrew: true,
        version: '0.1.2',
        authors: ['CoolHand'],
      },
      'Arms of the Astral Self': {
        name: 'Arms of the Astral Self',
        type: 'Class Feature',
        version: '1.0.1',
        authors: ['Spoob'],
      },
      'Arrow-Catching Shield': {
        name: 'Arrow-Catching Shield',
        type: 'Item',
        version: '3.2.1',
        authors: ['Elwin'],
      },
      'Aspect of the Beast: Bear': {
        name: 'Aspect of the Beast: Bear',
        type: 'Class Feature',
        version: '1.0.1',
        authors: ['Moto Moto'],
      },
      Assassinate: {
        name: 'Assassinate',
        type: 'Class Feature',
        version: '1.0.1',
        authors: ['thatlonelybugbear'],
      },
      Augury: {
        name: 'Augury',
        type: 'Spell',
        version: '1.0.1',
        authors: ['Fridan99'],
      },
      'Beast Sense': {
        name: 'Beast Sense',
        type: 'Spell',
        version: '1.0.1',
        authors: ['Luvac Zantor'],
      },
      Bless: {
        name: 'Bless',
        type: 'Spell',
        version: '0.1.3',
        authors: ['Moto Moto'],
      },
      'Blessed Healer': {
        name: 'Blessed Healer',
        type: 'Class Feature',
        version: '1.0.2',
        authors: ['SagaTympana, Moto Moto'],
      },
      'Channel Divinity: Guided Strike': {
        name: 'Channel Divinity: Guided Strike',
        type: 'Class Feature',
        version: '1.0.0',
        authors: ['Lin Dong'],
      },
      'Channel Divinity: Rebuke the Violent': {
        name: 'Channel Divinity: Rebuke the Violent',
        type: 'Class Feature',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      'Channel Divinity: Turn the Tide': {
        name: 'Channel Divinity: Turn the Tide',
        type: 'Class Feature',
        version: '1.0.2',
        authors: ['Christopher'],
      },
      'Channel Divinity: Vow of Enmity': {
        name: 'Channel Divinity: Vow of Enmity',
        type: 'Class Feature',
        version: '2.3.0',
        authors: ['Elwin'],
      },
      'Clockwork Amulet': {
        name: 'Clockwork Amulet',
        type: 'Item',
        version: '0.1.2',
        authors: ['thatlonelybugbear'],
      },
      'Colossus Slayer': {
        name: 'Colossus Slayer',
        type: 'Class Feature',
        version: '1.0.1',
        authors: ['Bakana'],
      },
      Commune: {
        name: 'Commune',
        type: 'Spell',
        version: '1.0.1',
        authors: ['Fridan99'],
      },
      'Corpse Slayer Longbow': {
        name: 'Corpse Slayer Longbow',
        type: 'Item',
        version: '0.1.2',
        authors: ['SagaTympana'],
      },
      Countercharm: {
        name: 'Countercharm',
        type: 'Class Feature',
        version: '1.0.3',
        authors: ['Moto Moto'],
      },
      'Crown of Stars': {
        name: 'Crown of Stars',
        type: 'Spell',
        version: '1.0.0',
        authors: ['Bakana', 'Xenophes'],
      },
      'Dagger of Venom': {
        name: 'Dagger of Venom',
        type: 'Item',
        version: '1.0.1',
        authors: ['Bakana'],
      },
      'Dampen Elements': {
        name: 'Dampen Elements',
        type: 'Class Feature',
        version: '1.1.0',
        authors: ['Elwin'],
      },
      'Dark Ones Own Luck': {
        name: 'Dark Ones Own Luck',
        type: 'Class Feature',
        version: '1.0.1',
        authors: ['Moto Moto'],
      },
      'Deflect Missiles': {
        name: 'Deflect Missiles',
        type: 'Class Feature',
        version: '1.1.1',
        authors: ['thatlonelybugbear'],
      },
      'Deflect Missiles Attack': {
        name: 'Deflect Missiles Attack',
        type: 'Class Feature',
        version: '0.1.1',
        authors: ['Moto Moto'],
      },
      'Deft Strike': {
        name: 'Deft Strike',
        type: 'Class Feature',
        version: '0.1.1',
        authors: ['Moto Moto'],
      },
      'Divine Allegiance': {
        name: 'Divine Allegiance',
        type: 'Class Feature',
        version: '3.1.0',
        authors: ['Elwin'],
      },
      Divination: {
        name: 'Divination',
        type: 'Spell',
        version: '1.0.1',
        authors: ['Fridan99'],
      },
      'Drow Posion': {
        name: 'Drow Poison',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      'Dungeon Delver': {
        name: 'Dungeon Delver',
        type: 'Feat',
        version: '0.1.2',
        authors: ['TMinz'],
      },
      'Dust of Dryness': {
        name: 'Dust of Dryness',
        type: 'Item',
        version: '0.1.1',
        authors: ['Moto Moto'],
      },
      'Dust of Sneezing and Choking': {
        name: 'Dust of Sneezing and Choking',
        type: 'Item',
        version: '1.0.1',
        authors: ['SaltyJ'],
      },
      'Eldritch Cannon': {
        name: 'Eldritch Cannon',
        type: 'Class Feature',
        version: '0.1.2',
        authors: ['allgoodtogrow'],
      },
      Elusive: {
        name: 'Elusive',
        type: 'Class Feature',
        version: '0.1.1',
        authors: ['SagaTympana'],
      },
      'Eyes of Minute Seeing': {
        name: 'Eyes of Minute Seeing',
        type: 'Item',
        version: '1.9.1',
        authors: ['Moto Moto'],
      },
      'Fighting Style: Great Weapon Fighting': {
        name: 'Fighting Style: Great Weapon Fighting',
        type: 'Class Feature',
        version: '0.1.4',
        authors: ['WurstKorn'],
      },
      'Flame Arrows': {
        name: 'Flame Arrows',
        type: 'Spell',
        version: '1.0.1',
        authors: ['Lin Dong'],
      },
      'Flame Tongue Rapier': {
        name: 'Flame Tongue Rapier',
        type: 'Item',
        version: '1.0.1',
        authors: ['Moto Moto'],
      },
      'Flames of Phlegethos': {
        name: 'Flames of Phlegethos',
        type: 'Feat',
        version: '2.2.1',
        authors: ['Elwin'],
      },
      'Flash of Genius': {
        name: 'Flash of Genius',
        type: 'Class Feature',
        version: '1.2.0',
        authors: ['Elwin'],
      },
      'Foe Slayer': {
        name: 'Foe Slayer',
        type: 'Class Feature',
        version: '1.0.1',
        authors: ['Moto Moto'],
      },
      Forage: {
        name: 'Forage',
        type: 'Generic Action',
        version: '0.1.2',
        authors: ['Fridan99', 'Christopher'],
      },
      'Gift of Alacrity': {
        name: 'Gift of Alacrity',
        type: 'Spell',
        version: '0.1.2',
        authors: ['Moto Moto'],
      },
      'Gift of the Metallic Dragon': {
        name: 'Gift of the Metallic Dragon',
        type: 'Feat',
        version: '3.1.0',
        authors: ['Elwin'],
      },
      'Goggles of Object Reading': {
        name: 'Goggles of Object Reading',
        type: 'Item',
        version: '1.0.1',
        authors: ['Moto Moto'],
      },
      Goodberry: {
        name: 'Goodberry',
        type: 'Spell',
        version: '2.1.0',
        authors: ['Elwin'],
      },
      'Great Weapon Master': {
        name: 'Great Weapon Master',
        type: 'Feat',
        version: '2.2.0',
        authors: ['Elwin'],
      },
      'Great Weapon Master Attack': {
        name: 'Great Weapon Master Attack',
        type: 'Feat',
        version: '2.2.0',
        authors: ['Elwin'],
      },
      'Guardian Emblem': {
        name: 'Guardian Emblem',
        type: 'Item',
        version: '3.2.0',
        authors: ['Elwin'],
      },
      Healer: {
        name: 'Healer',
        type: 'Feat',
        version: '0.1.2',
        authors: ['SagaTympana', 'WurstKorn'],
      },
      'Hero Points': {
        name: 'Hero Points',
        type: 'Generic Feature',
        version: '1.0.2',
        authors: ['Moto Moto'],
      },
      Immolation: {
        name: 'Immolation',
        type: 'Spell',
        version: '0.1.2',
        authors: ['Moto Moto', 'SagaTympana', 'Worthlesston'],
      },
      'Indomitable Might': {
        name: 'Indomitable Might',
        type: 'Class Feature',
        version: '0.1.1',
        authors: ['Muhammad2126'],
      },
      'Inspiring Leader': {
        name: 'Inspiring Leader',
        type: 'Feat',
        version: '1.0.1',
        authors: ['SagaTympana'],
      },
      Light: {
        name: 'Light',
        type: 'Spell',
        version: '1.0.0',
        authors: ['Moto Moto'],
      },
      "Lila's Famous Mushroom Tea": {
        name: "Lila's Famous Mushroom Tea",
        type: 'Item',
        homebrew: true,
        version: '0.1.1',
        authors: ['Moto Moto'],
      },
      Lucky: {
        name: 'Lucky',
        type: 'Feat',
        version: '1.0.1',
        authors: ['Moto Moto'],
      },
      'Mage Hand': {
        name: 'Mage Hand',
        type: 'Spell',
        version: '1.1.0',
        authors: ['Moto Moto'],
      },
      'Medium Armor Master': {
        name: 'Medium Armor Master',
        type: 'Feat',
        version: '0.1.2',
        authors: ['Muhammad2126'],
      },
      'Mental Prison': {
        name: 'Mental Prison',
        type: 'Spell',
        version: '1.0.1',
        authors: ['Spoob'],
      },
      Message: {
        name: 'Message',
        type: 'Spell',
        version: '1.0.1',
        authors: ['Fridan99'],
      },
      'Meteor Swarm': {
        name: 'Meteor Swarm',
        type: 'Spell',
        version: '2.0.0',
        authors: ['Bakana, Tyler'],
      },
      'Moon-Touched Sword, Greatsword': {
        name: 'Moon-Touched Sword, Greatsword',
        type: 'Item',
        version: '0.1.1',
        authors: ['Moto Moto'],
      },
      'Moon-Touched Sword, Longsword': {
        name: 'Moon-Touched Sword, Longsword',
        type: 'Item',
        version: '0.1.1',
        authors: ['Moto Moto'],
      },
      'Moon-Touched Sword, Scimitar': {
        name: 'Moon-Touched Sword, Scimitar',
        type: 'Item',
        version: '0.1.1',
        authors: ['Moto Moto'],
      },
      'Moon-Touched Sword, Shortsword': {
        name: 'Moon-Touched Sword, Shortsword',
        type: 'Item',
        version: '0.1.1',
        authors: ['Moto Moto'],
      },
      'Moon-Touched, Rapier': {
        name: 'Moon-Touched, Rapier',
        type: 'Item',
        version: '0.1.1',
        authors: ['Moto Moto'],
      },
      'Negative Energy Flood': {
        name: 'Negative Energy Flood',
        type: 'Spell',
        version: '1.0.0',
        authors: ['Bakana'],
      },
      Net: {
        name: 'Net',
        type: 'Item',
        version: '0.1.1',
        authors: ['Moto Moto'],
      },
      Oathbow: {
        name: 'Oathbow',
        type: 'Item',
        version: '1.1.2',
        authors: ['Christopher'],
      },
      Piercer: {
        name: 'Piercer',
        type: 'Feat',
        version: '1.0.1',
        authors: ['Bakana'],
      },
      'Poison, Basic (vial)': {
        name: 'Poison, Basic (vial)',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      Poisoner: {
        name: 'Poisoner',
        type: 'Class Features',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      'Potent Poison': {
        name: 'Potent Poison',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      'Potion of Healing': {
        name: 'Potion of Healing',
        type: 'Item',
        homebrew: true,
        version: '0.1.2',
        authors: ['TreeDragon', 'thatlonelybugbear'],
      },
      'Potion of Healing (Greater)': {
        name: 'Potion of Healing (Greater)',
        type: 'Item',
        homebrew: true,
        version: '0.1.2',
        authors: ['TreeDragon', 'thatlonelybugbear'],
      },
      'Potion of Healing (Superior)': {
        name: 'Potion of Healing (Superior)',
        type: 'Item',
        homebrew: true,
        version: '0.1.2',
        authors: ['TreeDragon', 'thatlonelybugbear'],
      },
      'Potion of Healing (Supreme)': {
        name: 'Potion of Healing (Supreme)',
        type: 'Item',
        homebrew: true,
        version: '0.1.2',
        authors: ['TreeDragon', 'thatlonelybugbear'],
      },
      'Power Word Kill': {
        name: 'Power Word Kill',
        type: 'Spell',
        version: '1.0.1',
        authors: ['Fridan99'],
      },
      'Power Word Pain': {
        name: 'Power Word Pain',
        type: 'Spell',
        version: '0.1.3',
        authors: ['Xenophes'],
      },
      'Primal Champion': {
        name: 'Primal Champion',
        type: 'Class Feature',
        version: '0.1.1',
        authors: ['Muhammad2126'],
      },
      'Primeval Awareness': {
        name: 'Primeval Awareness',
        type: 'Class Feature',
        version: '1.0.1',
        authors: ['Bakana'],
      },
      'Produce Flame': {
        name: 'Produce Flame',
        type: 'Spell',
        version: '1.0.0',
        authors: ['Bakana'],
      },
      'Protection from Poison': {
        name: 'Protection from Poison',
        type: 'Spell',
        version: '1.1.0',
        authors: ['Moto Moto'],
      },
      'Psionic Power: Protective Field': {
        name: 'Psionic Power: Protective Field',
        type: 'Class Feature',
        version: '3.1.0',
        authors: ['Elwin'],
      },
      'Psychic Blades': {
        name: 'Psychic Blades',
        type: 'Class Feature',
        version: '1.0.1',
        authors: ['SagaTympana'],
      },
      'Purple Worm Poison': {
        name: 'Purple Worm Poison',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      'Raise Dead': {
        name: 'Raise Dead',
        type: 'Spell',
        version: '0.1.1',
        authors: ['SagaTympana'],
      },
      'Recall Monster Lore': {
        name: 'Recall Monster Lore',
        type: 'Generic Action',
        version: '0.1.2',
        authors: ['Fridan99'],
      },
      'Relentless Rage': {
        name: 'Relentless Rage',
        type: 'Class Feature',
        version: '1.0.0',
        authors: ['Bakana'],
      },
      Resurrection: {
        name: 'Resurrection',
        type: 'Spell',
        version: '0.1.1',
        authors: ['SagaTympana'],
      },
      'Ryath Root': {
        name: 'Ryath Root',
        type: 'Item',
        version: '0.1.1',
        authors: ['Moto Moto'],
      },
      'Scaled Ornament (Stirring)': {
        name: 'Scaled Ornament (Stirring)',
        type: 'Item',
        version: '0.1.1',
        authors: ['Muhammad2126'],
      },
      "Sentinel at Death's Door": {
        name: "Sentinel at Death's Door",
        type: 'Class Feature',
        version: '3.1.0',
        authors: ['Elwin'],
      },
      'Serpent Venom': {
        name: 'Serpent Venom',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
      Sharpshooter: {
        name: 'Sharpshooter',
        type: 'Feat',
        version: '2.1.0',
        authors: ['Elwin'],
      },
      'Shield of Missile Attraction': {
        name: 'Shield of Missile Attraction',
        type: 'Item',
        version: '1.0.1',
        authors: ['Ris'],
      },
      Slow: {
        name: 'Slow',
        type: 'Spell',
        version: '1.1.1',
        authors: ['Moto Moto'],
      },
      Snare: {
        name: 'Snare',
        type: 'Spell',
        version: '1.0.0',
        authors: ['Quinn Dexter'],
      },
      'Sorrowful Fate': {
        name: 'Sorrowful Fate',
        type: 'Class Feature',
        version: '1.1.0',
        authors: ['Elwin'],
      },
      'Sorcerous Burst': {
        name: 'Sorcerous Burst',
        type: 'Spell',
        UA: true,
        version: '2.0.0',
        authors: ['SagaTympana'],
      },
      'Soul Cage': {
        name: 'Soul Cage',
        type: 'Spell',
        version: '1.0.0',
        authors: ['Christopher'],
      },
      'Soul of Artifice': {
        name: 'Soul of Artifice',
        type: 'Class Feature',
        version: '0.1.2',
        authors: ['SagaTympana'],
      },
      'Spirit Shield': {
        name: 'Spirit Shield',
        type: 'Class Feature',
        version: '3.1.0',
        authors: ['Elwin'],
      },
      'Spirit Totem: Bear Spirit': {
        name: 'Spirit Totem: Bear Spirit',
        type: 'Class Feature',
        version: '0.1.2',
        authors: ['Moto Moto'],
      },
      'Squire of Solamnia: Precise Strike': {
        name: 'Squire of Solamnia: Precise Strike',
        type: 'Feat',
        version: '1.0.1',
        authors: ['Moto Moto'],
      },
      'St. Markovia Statuette': {
        name: 'St. Markovia Statuette',
        type: 'Item',
        hombrew: true,
        version: '1.0.1',
        authors: ['Moto Moto'],
      },
      'Starry Wisp': {
        name: 'Starry Wisp',
        type: 'Spell',
        UA: true,
        version: '0.1.1',
        authors: ['SagaTympana'],
      },
      'Steady Aim': {
        name: 'Steady Aim',
        type: 'Class Feature',
        version: '2.3.0',
        authors: ['Elwin'],
      },
      'Sun Blade': {
        name: 'Sun Blade',
        type: 'Item',
        version: '1.2.0',
        authors: ['Elwin'],
      },
      'Tangler Grenade': {
        name: 'Tangler Grenade',
        type: 'Item',
        version: '1.0.0',
        authors: ['Lukas'],
      },
      "Tasha's Mind Whip": {
        name: "Tasha's Mind Whip",
        type: 'Spell',
        version: '1.0.1',
        authors: ['Moto Moto'],
      },
      "Tenser's Transformation": {
        name: "Tenser's Transformation",
        type: 'Spell',
        version: '1.0.0',
        authors: ['Lin Dong'],
      },
      'Tomb of Levistus': {
        name: 'Tomb of Levistus',
        type: 'Class Feature',
        version: '0.1.4',
        authors: ['pospa4'],
      },
      'Toughened Skin': {
        name: 'Toughened Skin',
        type: 'Feat',
        homebrew: true,
        version: '0.1.1',
        authors: ['Muhammad2126'],
      },
      'Unwavering Mark': {
        name: 'Unwavering Mark',
        type: 'Class Feature',
        version: '2.2.0',
        authors: ['Elwin'],
      },
      'Vengeful Ancestors': {
        name: 'Vengeful Ancestors',
        type: 'Class Feature',
        version: '2.1.0',
        authors: ['Elwin'],
      },
      Vial: {
        name: 'Vial',
        type: 'Item',
        version: '1.0.1',
        authors: ['Moto Moto'],
      },
      'Vigilant Guardian': {
        name: 'Vigilant Guardian',
        type: 'Race Feature',
        version: '3.1.0',
        authors: ['Elwin'],
      },
      'Wand of Winter': {
        name: 'Wand of Winter',
        type: 'Item',
        version: '0.1.2',
        authors: ['thatlonelybugbear'],
      },
      'Warding Flare': {
        name: 'Warding Flare',
        type: 'Class Feature',
        version: '2.1.0',
        authors: ['Elwin'],
      },
      'Warding Maneuver': {
        name: 'Warding Maneuver',
        type: 'Class Feature',
        version: '1.1.0',
        authors: ['Elwin'],
      },
      'Wukka Nuts': {
        name: 'Wukka Nuts',
        type: 'Item',
        version: '0.1.1',
        authors: ['Moto Moto'],
      },
      Wildroot: {
        name: 'Wildroot',
        type: 'Item',
        version: '0.1.1',
        authors: ['Moto Moto'],
      },
      'Wyvern Poison': {
        name: 'Wyvern Poison',
        type: 'Item',
        version: '1.0.0',
        authors: ['Elwin'],
      },
    },
    monsterAutomations: {
      'Adrix, The Hammer': {
        'Dreadful Smite': {
          name: 'Dreadful Smite',
          version: '1.0.0',
          authors: ['TMinz'],
        },
        'Dreadful Wrath': {
          name: 'Dreadful Wrath',
          version: '1.0.0',
          authors: ['TMinz'],
        },
      },
      'Awakened White Moose': {
        Charge: {
          name: 'Charge',
          version: '1.0.0',
          authors: ['Moto Moto'],
        },
        'Sure-Footed': {
          name: 'Sure-Footed',
          version: '1.0.1',
          authors: ['Moto Moto'],
        },
      },
      Banshee: {
        Wail: {
          name: 'Wail',
          version: '0.1.1',
          authors: ['Moto Moto'],
        },
        'Horrifying Visage': {
          name: 'Horrifying Visage',
          version: '0.1.1',
          authors: ['Moto Moto'],
        },
      },
      Bulezau: {
        'Sure-Footed': {
          name: 'Sure-Footed',
          version: '1.0.1',
          authors: ['Moto Moto'],
        },
      },
      'Burnished Hart': {
        Charge: {
          name: 'Charge',
          version: '1.0.0',
          authors: ['Moto Moto'],
        },
        'Sure-Footed': {
          name: 'Sure-Footed',
          version: '1.0.1',
          authors: ['Moto Moto'],
        },
      },
      Dao: {
        'Sure-Footed': {
          name: 'Sure-Footed',
          version: '1.0.1',
          authors: ['Moto Moto'],
        },
      },
      Fraughashar: {
        'Deft Snow Walk': {
          name: 'Deft Snow Walk',
          version: '1.0.1',
          authors: ['Moto Moto'],
        },
      },
      'Fulgorax: The Beacon': {
        Evasion: {
          name: 'Evasion',
          version: '1.0.0',
          authors: ['TMinz'],
        },
        'Magic Resistance': {
          name: 'Magic Resistance',
          version: '1.0.0',
          authors: ['TMinz'],
        },
        Move: {
          name: 'Move',
          version: '1.0.0',
          authors: ['TMinz'],
        },
        'Turn Immunity': {
          name: 'Turn Immunity',
          version: '1.0.0',
          authors: ['TMinz'],
        },
      },
      'Giant Goat': {
        Charge: {
          name: 'Charge',
          version: '1.0.0',
          authors: ['Moto Moto'],
        },
        'Sure-Footed': {
          name: 'Sure-Footed',
          version: '1.0.1',
          authors: ['Moto Moto'],
        },
      },
      'Giant Spider': {
        Web: {
          name: 'Web',
          version: '0.1.0',
          authors: ['CoolHand'],
        },
      },
      Goat: {
        Charge: {
          name: 'Charge',
          version: '1.0.0',
          authors: ['Moto Moto'],
        },
        'Sure-Footed': {
          name: 'Sure-Footed',
          version: '1.0.1',
          authors: ['Moto Moto'],
        },
      },
      'Goat-Knight Steed': {
        Charge: {
          name: 'Charge',
          version: '1.0.0',
          authors: ['Moto Moto'],
        },
        'Sure-Footed': {
          name: 'Sure-Footed',
          version: '1.0.1',
          authors: ['Moto Moto'],
        },
      },
      'Goblin Psi Commander': {
        'Psionic Shield': {
          name: 'Psionic Shield',
          version: '1.0.0',
          authors: ['Elwin'],
        },
      },
      'Hobgoblin Recruit': {
        'Infernal Ichor': {
          name: 'Infernal Ichor',
          version: '1.0.0',
          homebrew: true,
          authors: ['Matdir'],
        },
        'Tactical Positioning': {
          name: 'Tactical Positioning',
          version: '1.0.0',
          homebrew: true,
          authors: ['Matdir'],
        },
      },
      'Hundred-Handed One': {
        Reactive: {
          name: 'Reactive',
          version: '0.1.0',
          authors: ['Muhammad2126'],
        },
      },
      Lich: {
        'Negative Energy Tether': {
          name: 'Negative Energy Tether',
          version: '1.2.0',
          authors: ['Elwin'],
        },
      },
      Lindwurm: {
        'Sure-Footed Skater': {
          name: 'Sure-Footed Skater',
          version: '1.0.1',
          authors: ['Moto Moto'],
        },
      },
      Marilith: {
        Reactive: {
          name: 'Reactive',
          version: '0.1.0',
          authors: ['Muhammad2126'],
        },
      },
      'Marilith (Summoner Variant)': {
        Reactive: {
          name: 'Reactive',
          version: '0.1.0',
          authors: ['Muhammad2126'],
        },
      },
      'Mountain Goat': {
        Charge: {
          name: 'Charge',
          version: '1.0.0',
          authors: ['Moto Moto'],
        },
        'Sure-Footed': {
          name: 'Sure-Footed',
          version: '1.0.1',
          authors: ['Moto Moto'],
        },
      },
      Mule: {
        'Sure-Footed': {
          name: 'Sure-Footed',
          version: '1.0.1',
          authors: ['Moto Moto'],
        },
      },
      Nimblewright: {
        'Sure-Footed': {
          name: 'Sure-Footed',
          version: '1.0.1',
          authors: ['Moto Moto'],
        },
      },
      Sheep: {
        'Sure-Footed': {
          name: 'Sure-Footed',
          version: '1.0.1',
          authors: ['Moto Moto'],
        },
      },
      'Spider King': {
        Web: {
          name: 'Web',
          version: '0.1.0',
          authors: ['CoolHand'],
        },
      },
      Vampire: {
        Bite: {
          name: 'Bite',
          version: '2.0.0',
          authors: ['TreeDragon', 'Moto Moto', 'thatlonelybugbear'],
        },
        'Bite (Bat or Vampire Form Only)': {
          name: 'Bite (Bat or Vampire Form Only)',
          version: '2.0.0',
          authors: ['TreeDragon', 'Moto Moto', 'thatlonelybugbear'],
        },
        Move: {
          name: 'Move',
          version: '2.0.0',
          authors: ['TreeDragon'],
        },
        Regeneration: {
          name: 'Regeneration',
          version: '2.0.0',
          authors: ['TreeDragon'],
        },
        'Unarmed Strike (Vampire Form Only)': {
          name: 'Unarmed Strike (Vampire Form Only)',
          version: '2.0.0',
          authors: ['TreeDragon', 'Christopher', 'thatlonelybugbear'],
        },
        'Unarmed Strike': {
          name: 'Unarmed Strike',
          version: '2.0.0',
          authors: ['TreeDragon', 'Christopher', 'thatlonelybugbear'],
        },
      },
      'Vampire Spawn': {
        Bite: {
          name: 'Bite',
          version: '2.0.0',
          authors: ['TreeDragon', 'Moto Moto'],
        },
        Claws: {
          name: 'Claws',
          version: '2.0.0',
          authors: ['TreeDragon', 'Christopher', 'thatlonelybugbear'],
        },
        Regeneration: {
          name: 'Regeneration',
          version: '2.0.0',
          authors: ['TreeDragon'],
        },
      },
      'Vampire Spellcaster': {
        Bite: {
          name: 'Bite',
          version: '2.0.0',
          authors: ['TreeDragon', 'Moto Moto', 'thatlonelybugbear'],
        },
        'Bite (Bat or Vampire Form Only)': {
          name: 'Bite (Bat or Vampire Form Only)',
          version: '2.0.0',
          authors: ['TreeDragon', 'Moto Moto', 'thatlonelybugbear'],
        },
        Move: {
          name: 'Move',
          version: '2.0.0',
          authors: ['TreeDragon'],
        },
        Regeneration: {
          name: 'Regeneration',
          version: '2.0.0',
          authors: ['TreeDragon'],
        },
        'Unarmed Strike (Vampire Form Only)': {
          name: 'Unarmed Strike (Vampire Form Only)',
          version: '2.0.0',
          authors: ['TreeDragon', 'Christopher', 'thatlonelybugbear'],
        },
        'Unarmed Strike': {
          name: 'Unarmed Strike',
          version: '2.0.0',
          authors: ['TreeDragon', 'Christopher', 'thatlonelybugbear'],
        },
      },
      'Vampire Warrior': {
        Bite: {
          name: 'Bite',
          version: '2.0.0',
          authors: ['TreeDragon', 'Moto Moto', 'thatlonelybugbear'],
        },
        'Bite (Bat or Vampire Form Only)': {
          name: 'Bite (Bat or Vampire Form Only)',
          version: '2.0.0',
          authors: ['TreeDragon', 'Moto Moto', 'thatlonelybugbear'],
        },
        Move: {
          name: 'Move',
          version: '2.0.0',
          authors: ['TreeDragon'],
        },
        Regeneration: {
          name: 'Regeneration',
          version: '2.0.0',
          authors: ['TreeDragon'],
        },
        'Unarmed Strike (Vampire Form Only)': {
          name: 'Unarmed Strike (Vampire Form Only)',
          version: '2.0.0',
          authors: ['TreeDragon', 'Christopher', 'thatlonelybugbear'],
        },
        'Unarmed Strike': {
          name: 'Unarmed Strike',
          version: '2.0.0',
          authors: ['TreeDragon', 'Christopher', 'thatlonelybugbear'],
        },
      },
      Vrock: {
        Spores: {
          name: 'Spores',
          version: '0.1.0',
          authors: ['natesummers#8576'],
        },
        'Stunning Screech': {
          name: 'Stunning Screech',
          version: '0.1.0',
          authors: ['Muhammad2126'],
        },
      },
      'Vrock (Summoner Variant)': {
        Spores: {
          name: 'Spores',
          version: '0.1.0',
          authors: ['natesummers#8576'],
        },
        'Stunning Screech': {
          name: 'Stunning Screech',
          version: '0.1.0',
          authors: ['Muhammad2126'],
        },
      },
      'Wooden Donkey': {
        'Sure-Footed': {
          name: 'Sure-Footed',
          version: '1.0.0',
          authors: ['Moto Moto'],
        },
      },
    },
  });
}

;// CONCATENATED MODULE: ./scripts/module.js






Hooks.once('init', async function () {
  registerSettings();
  setConfig();
});

Hooks.once('ready', async function () {
  if (game.user.isGM) {
    if (game.settings.get(moduleName, 'Update Actors')) await setupActors();
  }
  if (game.settings.get(moduleName, 'Elwin Helpers')) {
    await scripts.runElwinsHelpers();
    await scripts.runElwinsHelpersCoating();
  }
  // TODO(bakanabaka) : make a setting to enable
  scripts.setupBakanaMacros();
});

globalThis['MISC'] = {
  macros: macros,
};

/******/ })()
;
//# sourceMappingURL=main.js.map