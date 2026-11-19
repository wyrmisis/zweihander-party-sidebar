const lookupActor = (actor) => {
  actor = (typeof actor === 'string')
    ? game.actors.get(actor)
    : actor;
  return (actor?.type !== "character")
    ? null
    : actor;
}

/**
 * Re-render the party sidebar tab (and its popout, if open).
 * Only the GM has the tab, so this is a no-op for everyone else.
 */
export const refreshPartySidebar = () => {
  const tab = ui.party;
  if (!tab) return;
  if (tab.rendered) tab.render();
  if (tab.popout?.rendered) tab.popout.render();
}

export const isPartyCandidate = (actor) => !!lookupActor(actor);

export const isInParty = (actor) => {
  actor = lookupActor(actor);
  return (!actor)
    ? false
    : !!actor.getFlag(game.system.id, "party");
}

export const addToParty = async (actor) => {
  actor = lookupActor(actor);
  await actor?.setFlag(game.system.id, "party", true);
  refreshPartySidebar();
}

export const removeFromParty = async (actor) => {
  actor = lookupActor(actor);
  await actor?.setFlag(game.system.id, "party", false);
  refreshPartySidebar();
}
