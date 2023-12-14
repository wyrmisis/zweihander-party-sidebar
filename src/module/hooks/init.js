import prepareHandlebars from "../config/handlebars.mjs";
import PartySidebar from "../sheets/PartySidebar.mjs";
import { isInParty, addToParty, removeFromParty } from '../helpers/party-membership.mjs';

Hooks.once('init', async function() {
  libWrapper.register(
    'zweihander-party-sidebar',
    'ActorDirectory.prototype._getEntryContextOptions',
    (wrapped, ...args) =>
      [{
        name: 'ZWEI.partytab.addToParty',
        icon: '<i class="fas fa-users-medical"></i>',
        condition: (node) => game.user.isGM && isInParty(node.data('entry-id')) === false,
        callback: (node) => game.user.isGM && addToParty(node.data('entry-id'))
      },
      {
        name: 'ZWEI.partytab.removeFromParty',
        icon: '<i class="fa-light fa-users"></i>',
        condition: (node) => game.user.isGM && isInParty(node.data('entry-id')) === true,
        callback: (node) => game.user.isGM && removeFromParty(node.data('entry-id'))
      },
      ...wrapped(...args)],
  );

  // prepareSettings();
  prepareHandlebars();
});
