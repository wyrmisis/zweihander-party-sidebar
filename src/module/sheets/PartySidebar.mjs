import { templatePath, partialPath } from "../config/constants.mjs";
import { isInParty, removeFromParty } from '../helpers/party-membership.mjs';
import DistributeRP from './DistributeRP.mjs';
import DistributeCorruption from './DistributeCorruption.mjs';

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { AbstractSidebarTab } = foundry.applications.sidebar;
const { DragDrop, TextEditor } = foundry.applications.ux;

/**
 * Build the minimal "event" the Zweihander actor sheet expects in `_onRollSkill`.
 *
 * ApplicationV2 action handlers receive the clicked element as `target`, but the
 * system's sheet handler reads `event.currentTarget.dataset.label`, which in a
 * delegated listener would be the application root instead.
 *
 * @param {HTMLElement} target - The `[data-action]` element that was clicked.
 */
const asSheetEvent = (target) => ({
  currentTarget: target,
  target,
  preventDefault: () => {},
  stopPropagation: () => {},
  stopImmediatePropagation: () => {}
});

/** @returns {Actor|undefined} The party member the clicked element belongs to. */
const memberFromElement = (element) => {
  const entryId = element?.closest('[data-entry-id]')?.dataset.entryId;
  return game.actors.get(entryId);
};

export default class PartySidebar extends HandlebarsApplicationMixin(AbstractSidebarTab) {
  /** @override */
  static tabName = "party";

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["party-sidebar"],
    window: {
      title: "ZWEI.partytab.title",
      icon: "fa-solid fa-users"
    },
    actions: {
      addRp: PartySidebar.#onOpenRPApp,
      addCorruption: PartySidebar.#onOpenCorruptionApp,
      openSheet: PartySidebar.#onOpenPartyMemberSheet,
      dodge: PartySidebar.#onDodge,
      parry: PartySidebar.#onParry,
      madness: PartySidebar.#onMadness,
      setActions: PartySidebar.#onSetActions,
      setDamage: PartySidebar.#onSetDamage,
      setPeril: PartySidebar.#onSetPeril
    }
  };

  /** @override */
  static PARTS = {
    party: {
      template: `${templatePath}/party.hbs`,
      templates: [`${partialPath}/chip.hbs`],
      scrollable: [".party-list"]
    }
  };

  static tooltip = "ZWEI.partytab.title";
  static icon = "fa-solid fa-users";

  /* -------------------------------------------- */
  /*  Child apps                                  */
  /* -------------------------------------------- */

  // Created lazily: constructing an ApplicationV2 while the module is still
  // being evaluated (before `init`) is needlessly early.
  static #distributeRP;
  static #distributeCorruption;

  static get DistributeRPApp() {
    return (PartySidebar.#distributeRP ??= new DistributeRP());
  }

  static get DistributeCorruptionApp() {
    return (PartySidebar.#distributeCorruption ??= new DistributeCorruption());
  }

  /** Re-render the Distribute dialogs, but only if they are currently open. */
  static refreshDistributeApps() {
    if (PartySidebar.#distributeRP?.rendered) PartySidebar.#distributeRP.render();
    if (PartySidebar.#distributeCorruption?.rendered) PartySidebar.#distributeCorruption.render();
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @type {DragDrop[]} */
  #dragDrop = this.#createDragDropHandlers();

  /**
   * Action Points as a row of squares: `max` steps, the first `value` of them filled.
   * @param {Actor} actor
   */
  static #actionsContext(actor) {
    const { value = 0, max = 0 } = actor.system.stats.actionPoints ?? {};
    return {
      value,
      max,
      steps: Array.from({ length: Math.max(0, max) }, (_, i) => ({
        step: i + 1,
        filled: i < value
      }))
    };
  }

  get partyMembers() {
    return game.actors.filter(a => a.getFlag(game.system.id, 'party'));
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.isGM = game.user.isGM;
    context.party = this.partyMembers.map(actor => ({
      id: actor.id,
      name: actor.name,
      img: actor.img,
      system: actor.system,
      actions: PartySidebar.#actionsContext(actor)
    }));
    return context;
  }

  /** @override */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    this._createContextMenu(
      this._getEntryContextOptions.bind(this),
      ".party-list__item"
    );
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#dragDrop.forEach(d => d.bind(this.element));
  }

  /**
   * Get the set of ContextMenu options which should be used for party members
   * @returns {foundry.ContextMenuEntry[]}
   * @protected
   */
  _getEntryContextOptions() {
    return [
      {
        label: 'ZWEI.partytab.removeFromParty',
        icon: '<i class="fa-solid fa-users-slash"></i>',
        visible: (element) => game.user.isGM && isInParty(element.dataset.entryId),
        onClick: (_event, element) => removeFromParty(element.dataset.entryId)
      }
    ];
  }

  /* -------------------------------------------- */
  /*  Drag & drop                                 */
  /* -------------------------------------------- */

  #createDragDropHandlers() {
    return [{
      dragSelector: ".party-list__item",
      // The whole tab is a drop target so the very first actor can be dropped
      // while the party (and therefore the list) is still empty.
      dropSelector: ".party-sidebar__body"
    }].map(config => new DragDrop.implementation({
      ...config,
      permissions: {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this)
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        drop: this._onDrop.bind(this)
      }
    }));
  }

  /** @protected */
  _canDragStart(_selector) {
    return game.user.isGM;
  }

  /** @protected */
  _canDragDrop(_selector) {
    return game.user.isGM;
  }

  /**
   * @param {DragEvent} event - The drag event fired when starting to drag a party member
   * @protected
   */
  _onDragStart(event) {
    const actor = memberFromElement(event.target);
    if (!actor) return;
    const dragData = actor.toDragData();
    if (!dragData) return;
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /**
   * @param {DragEvent} event - The drag event fired when dropping an item onto the party list
   * @protected
   */
  async _onDrop(event) {
    const typesAllowed = [
      'Actor',
      'Item',
      'Folder'
    ];

    const performAddToParty = (doc) => {
      if (
        doc &&
        doc.documentName === 'Actor' &&
        doc.type === 'character' &&
        !doc.pack &&
        !isInParty(doc.id)
      ) {
        doc.setFlag(game.system.id, 'party', true);
        return true;
      }
    }

    const performAddItemToPartyMember = (actor, item) => {
      if (!actor || item?.documentName !== 'Item') return;
      actor.createEmbeddedDocuments('Item', [item.toObject()]);
      return true;
    }

    const targetId = event.target.closest('[data-entry-id]')?.dataset.entryId;
    const { type, uuid } = TextEditor.implementation.getDragEventData(event);

    // Kick out things that aren't actors or embedded into actors
    if (!typesAllowed.includes(type)) return;

    // An item can't be a party member.
    // It must be dropped onto a party member.
    if (type === 'Item' && !targetId) return;

    // This is the latest we can wait to fetch the dropped document
    const sourceDoc = await fromUuid(uuid);
    if (!sourceDoc) return;

    // If it's not a character, don't allow it to join the party
    // @todo - Maybe this should change in the system
    //         (for mounts, pets, beastfolk, etc)?
    if (type === 'Actor' && sourceDoc.type !== 'character') return;

    if (performAddToParty(sourceDoc)) return;

    // This is the latest we can wait to fetch the target document
    const targetDoc = game.actors.get(targetId);

    if (performAddItemToPartyMember(targetDoc, sourceDoc)) return;

    if (type === 'Folder') {
      sourceDoc.contents.forEach(doc => {
        if (doc.documentName === 'Item') {
          performAddItemToPartyMember(targetDoc, doc);
          return;
        }

        if (doc.documentName === 'Actor') {
          performAddToParty(doc);
          return;
        }
      })
    }
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  /** @this {PartySidebar} */
  static #onOpenRPApp() {
    PartySidebar.DistributeRPApp.render({ force: true });
  }

  /** @this {PartySidebar} */
  static #onOpenCorruptionApp() {
    PartySidebar.DistributeCorruptionApp.render({ force: true });
  }

  /** @this {PartySidebar} */
  static #onOpenPartyMemberSheet(_event, target) {
    memberFromElement(target)?.sheet?.render({ force: true });
  }

  /** @this {PartySidebar} */
  static #onDodge(_event, target) {
    memberFromElement(target)?.sheet?._onRollSkill(
      asSheetEvent(target),
      CONFIG.ZWEI.testTypes.dodge
    );
  }

  /** @this {PartySidebar} */
  static #onParry(_event, target) {
    memberFromElement(target)?.sheet?._onRollSkill(
      asSheetEvent(target),
      CONFIG.ZWEI.testTypes.parry
    );
  }

  /** @this {PartySidebar} */
  static #onMadness(_event, target) {
    memberFromElement(target)?.sheet?._onRollSkill(
      asSheetEvent(target),
      CONFIG.ZWEI.testTypes.madness
    );
  }

  /**
   * Click a square to set Action Points to that step; clicking the last
   * filled square empties it, so the counter can also reach 0.
   * @this {PartySidebar}
   */
  static async #onSetActions(_event, target) {
    const actor = memberFromElement(target);
    if (!actor) return;
    const step = Number(target.dataset.step);
    const current = actor.system.stats.actionPoints.value;
    await actor.update({
      'system.stats.actionPoints.value': current === step ? step - 1 : step
    });
  }

  /** @this {PartySidebar} */
  static async #onSetDamage(_event, target) {
    await memberFromElement(target)?.update({
      'system.stats.secondaryAttributes.damageCurrent.value': Number(target.dataset.step)
    });
  }

  /** @this {PartySidebar} */
  static async #onSetPeril(_event, target) {
    await memberFromElement(target)?.update({
      'system.stats.secondaryAttributes.perilCurrent.value': Number(target.dataset.step)
    });
  }
}
