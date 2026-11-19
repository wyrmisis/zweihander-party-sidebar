import BaseDistributeModal from './DistributeBase.mjs'

export default class DistributeRP extends BaseDistributeModal {
  /** @override */
  static DEFAULT_OPTIONS = {
    id: "distribute-rp",
    window: {
      title: "ZWEI.partytab.distribute.rp"
    }
  };

  static updateKey = 'system.stats.rewardPoints.total';
  static successKey = 'ZWEI.partytab.distribute.success.rp';
}
