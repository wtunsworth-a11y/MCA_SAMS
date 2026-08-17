// config.js — single source of truth for the things a supervisor may want to
// change without touching app logic: the app version stamped into every export,
// the project attribution, and the consent script read aloud before an
// interview begins.
//
// The instrument itself (sections, questions, options) lives in js/questions.js.
// The photographic schedule lives in js/photo-subjects.js.

export const CONFIG = {
  // Bumped when the instrument or the export shape changes. Written into every
  // record as `app_version` so an export can be traced to the build that
  // produced it.
  appVersion: '1.0.0',

  instrument:
    'Managalas Conservation Area — Small-Scale Mining Site & Miner Survey',

  project:
    'Managalas and Oro Province Project (MOPP) — CIFOR-ICRAF, funded by the ' +
    'European Union.',

  // Section 0 of the paper form, read aloud before the interview begins.
  consentScript:
    'Hello. My name is ____, representing the survey team. We are conducting a ' +
    'survey on small-scale mining in the Managalas Conservation Area.\n\n' +
    'This survey aims to understand small-scale mining activities, livelihoods, ' +
    'mining practices, environmental impacts, conservation concerns, and ' +
    'opportunities for safer and more sustainable mining within and around the ' +
    'Managalas Conservation Area.\n\n' +
    'Your participation is voluntary, and all responses will remain strictly ' +
    'confidential. You may choose to skip any question or stop the interview at ' +
    'any time. The survey takes approximately 30–45 minutes.\n\n' +
    'Information collected will be used strictly for research, planning, ' +
    'training, and the development of appropriate approaches to sustainable ' +
    'small-scale mining and conservation.',

  // Read at the end of the interview, on the survey screen once every section
  // has been worked through.
  thankYouScript:
    'Thank you very much for your time and for sharing your knowledge. Your ' +
    'answers will help inform planning for small-scale mining and conservation ' +
    'in the Managalas Conservation Area.',
};
