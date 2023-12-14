import { templatePath } from "../config/constants.mjs";

export default class BaseDistributeModal extends FormApplication {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["distribute"],
      width: 250,
      height: 320,
      template: `${templatePath}/distribute.hbs`,
    });
  }
  
  get partyMembers() {
    return game.actors.filter(a => a.getFlag(game.system.id, 'party'));
  }

  /** @override */
  async getData(options = {}) {
    let context = await super.getData(options);
    context.party = this.partyMembers;
    return context;
  }

  async submit() {
    const actors = this.element.find(':checked')
      .map( (_idx, n) => game.actors.get(n.value))
      .toArray()
      .filter(a => !!a);
    const value = parseInt(this.element.find('[name="amount"]').val(), 10);
  
    if (!actors.length)
      return ui.notifications.warn('ZWEI.partytab.distribute.empty.selection', {
      localize: true
    })
    else if (!value || Number.isNaN(value))
      return ui.notifications.warn('ZWEI.partytab.distribute.empty.value', {
      localize: true
    })
    else
      await Promise.all(actors.map(a =>
        a.update({
          [this.constructor.updateKey]: flattenObject(a)[this.constructor.updateKey] + value
        })
      ));
      ui.notifications.info(this.constructor.successKey, {localize: true});
      this.close();
  }
  
  activateListeners(html) {
    super.activateListeners(html);
    html.find('[data-action="distribute-all"]').click(e => {
      html.find('[type="checkbox"]').prop('checked', true)
    });

    html.find('[data-action="submit"]').click(this.submit.bind(this));
  }
}
