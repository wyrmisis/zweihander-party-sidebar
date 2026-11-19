/**
 * Compute the effective chance of success for a skill on an actor.
 *
 * Mirrors how the Zweihander system derives the value of Dodge/Parry/etc.
 * (see `prepareDerivedData` in the system's PC data model): primary attribute
 * + skill bonus, modified by the actor's current Peril malus.
 *
 * @param {Actor} actor
 * @param {string} skillName - Name of the skill item to look up (case/diacritics insensitive).
 * @returns {number|null} The chance, or null if the actor doesn't have that skill.
 */
const normalize = (name) =>
  String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const getSkillChance = (actor, skillName) => {
  const wanted = normalize(skillName);
  const skill = actor.items.find(
    (i) => i.type === 'skill' && normalize(i.name) === wanted
  );
  if (!skill) return null;

  const stats = actor.system?.stats;
  const primary = stats?.primaryAttributes?.[
    skill.system.associatedPrimaryAttribute?.toLowerCase()
  ];
  if (!primary) return null;

  const alternativePerilSystem = game.settings.get(game.system.id, 'alternativePerilSystem');
  const effectivePeril = stats.secondaryAttributes.perilCurrent.effectiveValue
    ?? stats.secondaryAttributes.perilCurrent.value;
  const perilMalus = actor.getPerilMalus(effectivePeril, alternativePerilSystem);

  const bonus = alternativePerilSystem
    ? skill.system.bonus + perilMalus
    : Math.max(0, skill.system.bonus - perilMalus);

  return Math.max(0, primary.value + bonus);
}
