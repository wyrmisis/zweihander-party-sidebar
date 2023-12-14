const lookupActor = (actor) => {
  actor = (typeof actor === 'string')
    ? game.actors.get(actor)
    : actor;
  return (actor?.type !== "character")
    ? null
    : actor;
}

export const isInParty = (actor) => {
  actor = lookupActor(actor);
  return (!actor)
    ? false
    : !!actor.getFlag(game.system.id, "party");
}

export const addToParty = async (actor) => {
  actor = lookupActor(actor);
  await actor?.setFlag(game.system.id, "party", true);
  ui.sidebar.render();
}

export const removeFromParty = async (actor) => {
  actor = lookupActor(actor);
  await actor?.setFlag(game.system.id, "party", false);
  ui.sidebar.render();
}

