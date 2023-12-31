import { templatePath } from "../config/constants.mjs";
import { isInParty, addToParty, removeFromParty } from '../helpers/party-membership.mjs';
import DistributeRP from './DistributeRP.mjs';
import DistributeCorruption from './DistributeCorruption.mjs';

export default class PartySidebar extends SidebarTab {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "party",
      template: `${templatePath}/party.hbs`,
      title: "ZWEI.partytab.title",
      dragDrop: [{ dragSelector: ".party-list__item", dropSelector: ".party-list" }],
      contextMenuSelector: ".party-list__item",
    });
  }

  static DistributeRPApp = new DistributeRP();
  static DistributeCorruptionApp = new DistributeCorruption();

  static tooltip = "ZWEI.partytab.title";
  static icon = "fas fa-users";


  /** @override */
  async getData(options = {}) {
    let context = await super.getData(options);
    context.party = this.partyMembers;
    return context;
  }

  get partyMembers() {
    return game.actors.filter(a => a.getFlag(game.system.id, 'party'));
  }

  _onDragStart(event) {
    const entryId = event.target.closest('[data-entry-id]').dataset.entryId;
    const actor = game.actors.get(entryId);
    if (!actor) return;
    const dragData = actor.toDragData();
    if (!dragData) return;
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /**
   * @override
   * @param  {DragEvent} event - The drag event fired when dropping an item onto the party list 
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
        !isInParty(doc.id)
      ) {
        doc.setFlag(game.system.id, 'party', true);
        return true;
      }
    }

    const performAddItemToPartyMember = (actor, item) => {
      if (item.documentName !== 'Item') return;
      actor.createEmbeddedDocuments('Item', [item]);
      return true;
    }

    const targetId = event.target.closest('[data-entry-id]')?.dataset.entryId;
    const { type, uuid } = TextEditor.getDragEventData(event);

    // Kick out things that aren't actors or embedded into actors
    if (!typesAllowed.includes(type)) return;

    // An item can't be a party member.
    // It must be dropped onto a party member.
    if (type === 'Item' && !targetId) return;

    // This is the latest we can wait to fetch the dropped document
    const sourceDoc = await fromUuid(uuid);

    // If it's not a character, don't allow it to join the party
    // @todo - Maybe this should change in the system
    //         (for mounts, pets, beastfolk, etc)?
    if (type === 'Actor' && (!sourceDoc || sourceDoc?.type !== 'character')) return;

    if (performAddToParty(sourceDoc)) return;

    // This is the latest we can wait to fetch the target document
    const targetDoc = game.actors.get(targetId);

    if (performAddItemToPartyMember(targetDoc, sourceDoc)) return true;

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
      return;
    }
  }

  /**
   * @todo - This app needs built
   */
  #openRPApp() {
    PartySidebar.DistributeRPApp.render(true);
  }
  /**
   * @todo - This app needs built
   */
  #openCorruptionApp() {
    PartySidebar.DistributeCorruptionApp.render(true);
  }

  #openPartyMemberSheet(event) {
    const { entryId } = event.target?.closest('[data-entry-id]')?.dataset;
    game.actors.get(entryId)?.sheet?.render(true);
  }

  #doDodge(event) {
    const { entryId } = event.target?.closest('[data-entry-id]')?.dataset;
    game.actors.get(entryId)?.sheet?._onRollSkill(
      event,
      CONFIG.ZWEI.testTypes.dodge
    );
  }

  #doParry(event) {
    const { entryId } = event.target?.closest('[data-entry-id]')?.dataset;
    game.actors.get(entryId)?.sheet?._onRollSkill(
      event,
      CONFIG.ZWEI.testTypes.dodge
    );
  }

  #doSkill(event) {
    const { entryId } = event.target?.closest('[data-entry-id]')?.dataset;
    game.actors.get(entryId)?.sheet?._onRollSkill(
      event,
      CONFIG.ZWEI.testTypes.skill
    );
  }

  async #setDamage(event) {
    const { entryId } = event.target?.closest('[data-entry-id]')?.dataset;
    const { step } = event.target.dataset;
    await game.actors.get(entryId)?.update({
      'system.stats.secondaryAttributes.damageCurrent.value': step
    });
  }

  async #setPeril(event) {
    const { entryId } = event.target?.closest('[data-entry-id]')?.dataset;
    const { step } = event.target.dataset;
    await game.actors.get(entryId)?.update({
      'system.stats.secondaryAttributes.perilCurrent.value': step
    });
  }

  /**
   * @todo Set up for non-GM use
   * @override
   * */
  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-action='add-rp']").click(this.#openRPApp.bind(this));
    html.find("[data-action='add-corruption']").click(this.#openCorruptionApp.bind(this));
    html.find('.thumbnail, .entry-name').click(
      this.#openPartyMemberSheet.bind(this)
    );
    html.find('[data-action="dodge"]').click(this.#doDodge.bind(this));
    html.find('[data-action="parry"]').click(this.#doParry.bind(this));
    html.find('.party-meter--damage [data-step]').click(this.#setDamage.bind(this));
    html.find('.party-meter--peril [data-step]').click(this.#setPeril.bind(this));

    this._contextMenu(html);
  }

  /** @override */
  _contextMenu(html) {
    ContextMenu.create(this, html, this.options.contextMenuSelector, this._getEntryContextOptions());
  }

  /**
   * Get the set of ContextMenu options which should be used for party members
   * @returns {object[]}   The Array of contextaction passed to the ContextMenu instance
   * @protected
   */
  _getEntryContextOptions() {

    return [
      {
        name: 'ZWEI.partytab.removeFromParty',
        icon: '<i class="fa-light fa-users"></i>',
        condition: (node) => game.user.isGM && isInParty(node.data('entry-id')) === true,
        callback: (node) => game.user.isGM && removeFromParty(node.data('entry-id'))
      }
    ]
  }
}
