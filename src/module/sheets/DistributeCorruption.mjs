import BaseDistributeModal from './DistributeBase.mjs'

export default class DistributeCorruption extends BaseDistributeModal {
  /** @override */
  static DEFAULT_OPTIONS = {
    id: "distribute-corruption",
    window: {
      title: "ZWEI.partytab.distribute.corruption"
    }
  };

  static updateKey = 'system.alignment.corruption';
  static successKey = 'ZWEI.partytab.distribute.success.corruption';
}
