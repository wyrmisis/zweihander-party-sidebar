import BaseDistributeModal from './DistributeBase.mjs'

export default class DistributeRP extends BaseDistributeModal {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "distribute-rp",
      title: "ZWEI.partytab.distribute.rp"
    });
  }

  static updateKey = 'system.stats.rewardPoints.total';
  static successKey = 'ZWEI.partytab.distribute.success.rp';
}
