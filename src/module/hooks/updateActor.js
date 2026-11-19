import PartySidebar from '../sheets/PartySidebar.mjs';
import { refreshPartySidebar } from '../helpers/party-membership.mjs';

/**
 * If everything checks out, rerender the sidebar UI to account for party member updates.
 *
 * @param {foundry.abstract.Document} doc - The Foundry document that triggered the check.
 */
const conditionallyRenderSidebar = (doc) => {
  const actor = (doc?.documentName === 'Item') ? doc.parent : doc;

  if (
    actor?.documentName === 'Actor' &&
    actor.getFlag(game.system.id, 'party')
  ) refreshPartySidebar();

  PartySidebar.refreshDistributeApps();
}

Hooks.on('createActor', conditionallyRenderSidebar);
Hooks.on('updateActor', conditionallyRenderSidebar);
Hooks.on('deleteActor', () => {
  refreshPartySidebar();
  PartySidebar.refreshDistributeApps();
});
Hooks.on('createItem', conditionallyRenderSidebar);
Hooks.on('updateItem', conditionallyRenderSidebar);
Hooks.on('deleteItem', conditionallyRenderSidebar);
