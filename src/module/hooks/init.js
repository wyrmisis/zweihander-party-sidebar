import prepareHandlebars from "../config/handlebars.mjs";
import PartySidebar from "../sheets/PartySidebar.mjs";
import {
  isInParty,
  isPartyCandidate,
  addToParty,
  removeFromParty
} from '../helpers/party-membership.mjs';

/**
 * Register the Party tab with the core Sidebar, right after the Combat tab.
 *
 * Sidebar.TABS is an ordered record, so to place the tab we remove everything
 * after `combat`, add ours, then restore the rest in their original order.
 */
const registerPartyTab = () => {
  const { Sidebar } = foundry.applications.sidebar;

  CONFIG.ui.party = PartySidebar;

  const tabs = Sidebar.TABS;
  const names = Object.keys(tabs);
  const combatIdx = names.indexOf('combat');
  const trailing = (combatIdx === -1 ? [] : names.slice(combatIdx + 1))
    .map((name) => [name, tabs[name]]);

  for (const [name] of trailing) delete tabs[name];

  tabs.party = {
    tooltip: PartySidebar.tooltip,
    icon: PartySidebar.icon,
    gmOnly: true
  };

  for (const [name, descriptor] of trailing) tabs[name] = descriptor;
}

Hooks.once('init', () => {
  prepareHandlebars();
  registerPartyTab();
});

/**
 * Add "Add to Party" / "Remove from Party" to the Actors directory context menu.
 * Replaces the old libWrapper patch of ActorDirectory#_getEntryContextOptions.
 */
Hooks.on('getActorContextOptions', (application, menuItems) => {
  if (!(application instanceof foundry.applications.sidebar.tabs.ActorDirectory)) return;

  const entryId = (element) => element.dataset.entryId;

  menuItems.push(
    {
      label: 'ZWEI.partytab.addToParty',
      icon: '<i class="fa-solid fa-users"></i>',
      visible: (element) =>
        game.user.isGM && isPartyCandidate(entryId(element)) && !isInParty(entryId(element)),
      onClick: (_event, element) => addToParty(entryId(element))
    },
    {
      label: 'ZWEI.partytab.removeFromParty',
      icon: '<i class="fa-solid fa-users-slash"></i>',
      visible: (element) => game.user.isGM && isInParty(entryId(element)),
      onClick: (_event, element) => removeFromParty(entryId(element))
    }
  );
});
