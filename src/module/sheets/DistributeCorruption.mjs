import BaseDistributeModal from './DistributeBase.mjs'

export default class DistributeCorruption extends BaseDistributeModal {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "distribute-corruption",
      title: "ZWEI.partytab.distribute.corruption"
    });
  }

  static updateKey = 'system.alignment.corruption';
  static successKey = 'ZWEI.partytab.distribute.success.corruption';
}
