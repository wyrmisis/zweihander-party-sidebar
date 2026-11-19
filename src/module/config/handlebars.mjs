import { partialPath } from "./constants.mjs";

/**
 * Register the Handlebars helpers used by this module's templates.
 *
 * Templates themselves are no longer pre-loaded here: ApplicationV2 loads every
 * template declared in a part's `template` / `templates` entries on first render.
 */
const prepareHandlebars = () => {
  Handlebars.registerHelper(
    'partial',
    (path) => `${partialPath}/${path}`
  );

  // Foundry core ships comparison helpers (gt, gte, lte...) since v13. Only
  // register our own as a fallback so we never shadow the core implementation.
  const fallbacks = {
    gt: (a, b) => a > b,
    gte: (a, b) => a >= b,
    lte: (a, b) => a <= b,
  };

  for (const [name, fn] of Object.entries(fallbacks))
    if (!Handlebars.helpers[name]) Handlebars.registerHelper(name, fn);
}

export default prepareHandlebars;
