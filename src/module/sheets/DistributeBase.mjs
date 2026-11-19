import { templatePath } from "../config/constants.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Base dialog for handing out a numeric amount (RP, Corruption...) to party members.
 * Subclasses must define the static `updateKey` and `successKey`.
 */
export default class BaseDistributeModal extends HandlebarsApplicationMixin(ApplicationV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["distribute"],
    position: {
      width: 250,
      height: "auto"
    },
    window: {
      icon: "fa-solid fa-plus",
      resizable: false
    },
    actions: {
      distributeAll: BaseDistributeModal.#onDistributeAll,
      submit: BaseDistributeModal.#onSubmit
    }
  };

  /** @override */
  static PARTS = {
    body: {
      template: `${templatePath}/distribute.hbs`
    }
  };

  /** Data path (on the actor) that will be incremented. Defined by subclasses. */
  static updateKey = null;

  /** i18n key of the success notification. Defined by subclasses. */
  static successKey = null;

  get partyMembers() {
    return game.actors.filter(a => a.getFlag(game.system.id, 'party'));
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.party = this.partyMembers.map(a => ({
      id: a.id,
      name: a.name,
      img: a.img
    }));
    return context;
  }

  /**
   * Tick every party member's checkbox.
   * @this {BaseDistributeModal}
   */
  static #onDistributeAll() {
    this.element
      .querySelectorAll('input[type="checkbox"]')
      .forEach(box => { box.checked = true; });
  }

  /**
   * Validate the form and apply the amount to the selected party members.
   * @this {BaseDistributeModal}
   */
  static async #onSubmit() {
    const { updateKey, successKey } = this.constructor;

    const actors = Array.from(this.element.querySelectorAll('input[name="selected"]:checked'))
      .map(input => game.actors.get(input.value))
      .filter(a => !!a);
    const value = parseInt(this.element.querySelector('[name="amount"]')?.value, 10);

    if (!actors.length)
      return ui.notifications.warn('ZWEI.partytab.distribute.empty.selection', { localize: true });

    if (!value || Number.isNaN(value))
      return ui.notifications.warn('ZWEI.partytab.distribute.empty.value', { localize: true });

    await Promise.all(actors.map(a =>
      a.update({
        [updateKey]: (foundry.utils.getProperty(a, updateKey) ?? 0) + value
      })
    ));

    ui.notifications.info(successKey, { localize: true });
    this.close();
  }
}
