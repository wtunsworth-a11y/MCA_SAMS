// The Managalas small-scale mining site & miner survey, transcribed from
// incoming/Managalas_Small_Scale_Mining_Survey(1).pdf.
//
// Question numbers and wording follow the paper form exactly so a completed
// record can be reconciled against a paper one. Section numbering likewise.
//
// Question shapes:
//   text | textarea | number | date   simple inputs; `unit` labels a number
//   single                            one option (radio)
//   multi                             several options (checkbox)
//   group                             several labelled sub-fields, `fields`
//
// Modifiers:
//   other: true    the "Other" option reveals a free-text box
//   follow: {...}  a conditional sub-question; `when` lists the parent answers
//                  that reveal it, or is omitted for "always show"

import { CONFIG } from './config.js';

const YES_NO = ['Yes', 'No'];

export const SECTIONS = [
  {
    id: 'consent',
    number: 0,
    title: 'Informed consent',
    preamble: CONFIG.consentScript,
    questions: [
      { id: 'c1', label: 'Name of person taking consent', type: 'text' },
      {
        id: 'c2',
        label: 'Consent',
        type: 'single',
        options: ['Respondent consents to participate', 'Respondent declines to participate'],
        required: true,
      },
      { id: 'c3', label: 'Signature / mark of respondent', type: 'text' },
      { id: 'c4', label: 'Date', type: 'date' },
    ],
  },

  {
    id: 's1',
    number: 1,
    title: 'Miner particulars',
    questions: [
      { id: 'q1', n: 1, label: 'Survey ID', type: 'text' },
      { id: 'q2', n: 2, label: 'Date', type: 'date' },
      { id: 'q3', n: 3, label: 'Name of mining site', type: 'text' },
      { id: 'q4', n: 4, label: 'Village / Community', type: 'text' },
      { id: 'q5', n: 5, label: 'Ward / LLG', type: 'text' },
      { id: 'q6', n: 6, label: 'Sex', type: 'single', options: ['Male', 'Female'] },
      { id: 'q7', n: 7, label: 'Age', type: 'number', unit: 'years' },
      { id: 'q8', n: 8, label: 'Place of origin', type: 'text' },
      { id: 'q9', n: 9, label: 'Current place of residence', type: 'text' },
      {
        id: 'q10',
        n: 10,
        label: 'How long have you been involved in mining?',
        type: 'single',
        options: ['Less than 1 year', '1–5 years', '6–10 years', 'More than 10 years'],
      },
      {
        id: 'q11',
        n: 11,
        label: 'Is mining your main source of income?',
        type: 'single',
        options: YES_NO,
        follow: { label: 'If no, what is your main livelihood?', type: 'text', when: ['No'] },
      },
    ],
  },

  {
    id: 's2',
    number: 2,
    title: 'Land ownership and access',
    questions: [
      {
        id: 'q12',
        n: 12,
        label: 'Who owns the land where you are mining?',
        type: 'single',
        options: [
          'My own customary land',
          'Family/clan customary land',
          'Another clan',
          'Individual landowner',
          'Conservation Area',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q13',
        n: 13,
        label: 'Did you obtain permission before commencing mining?',
        type: 'single',
        options: YES_NO,
      },
      {
        id: 'q14',
        n: 14,
        label: 'Who gave you permission?',
        type: 'single',
        options: [
          'Clan/landowner',
          'Community leader',
          'Government',
          'Mining company/lease holder',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q15',
        n: 15,
        label: 'Is there an agreement between the miner/mining group and the landowner?',
        type: 'single',
        options: ['Yes, written', 'Yes, verbal', 'No', "Don't know"],
      },
      {
        id: 'q16',
        n: 16,
        label: 'Do you pay the landowner for access to the mining area?',
        type: 'single',
        options: YES_NO,
        follow: {
          label: 'If yes, how?',
          type: 'single',
          options: ['Cash', 'Gold', 'Share of production', 'Other'],
          other: true,
          when: ['Yes'],
        },
      },
      {
        id: 'q17',
        n: 17,
        label: 'Have you experienced any disagreement or conflict over land or mining rights?',
        type: 'single',
        options: YES_NO,
        follow: { label: 'If yes, briefly explain', type: 'textarea', when: ['Yes'] },
      },
    ],
  },

  {
    id: 's3',
    number: 3,
    title: 'Mining operation',
    questions: [
      {
        id: 'q18',
        n: 18,
        label: 'What type of mining do you undertake?',
        type: 'single',
        options: [
          'Labour-intensive / manual',
          'Semi-mechanised',
          'Mechanised',
          'Combination of manual and mechanised',
        ],
      },
      {
        id: 'q19',
        n: 19,
        label: 'What type of deposit are you mining?',
        type: 'multi',
        options: [
          'River gravel',
          'Riverbank',
          'Floodplain',
          'Terrace',
          'Hill/land alluvial',
          'Hard rock',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q20',
        n: 20,
        label: 'How long have you been mining at this particular site?',
        type: 'group',
        fields: [
          { key: 'years', label: 'Years', type: 'number' },
          { key: 'months', label: 'Months', type: 'number' },
        ],
      },
      {
        id: 'q21',
        n: 21,
        label: 'How many people are involved in your mining operation?',
        type: 'group',
        fields: [
          { key: 'men', label: 'Men', type: 'number' },
          { key: 'women', label: 'Women', type: 'number' },
          { key: 'youth', label: 'Youth', type: 'number' },
          { key: 'children', label: 'Children', type: 'number' },
        ],
      },
      {
        id: 'q22',
        n: 22,
        label: 'Do you employ workers?',
        type: 'single',
        options: YES_NO,
        follow: { label: 'If yes, approximately how many?', type: 'number', when: ['Yes'] },
      },
      {
        id: 'q23',
        n: 23,
        label: 'How are workers paid?',
        type: 'single',
        options: [
          'Daily/weekly wages',
          'Fortnightly/monthly wages',
          'Share of gold',
          'Combination',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q24',
        n: 24,
        label: 'How many days per week do you normally mine?',
        type: 'number',
        unit: 'days',
      },
      {
        id: 'q25',
        n: 25,
        label: 'What equipment do you use?',
        type: 'multi',
        options: [
          'Gold pan',
          'Shovel/pick',
          'Sluice box',
          'Water pump',
          'Highbanker',
          'Trommel',
          'Metal detector',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q26',
        n: 26,
        label: 'Which equipment do you own and which do you hire?',
        type: 'group',
        fields: [
          { key: 'own', label: 'Own', type: 'text' },
          { key: 'hire', label: 'Hire', type: 'text' },
        ],
      },
    ],
  },

  {
    id: 's4',
    number: 4,
    title: 'Gold deposit and production',
    questions: [
      {
        id: 'q27',
        n: 27,
        label: 'What type of gold do you mainly recover?',
        type: 'single',
        options: [
          'Alluvial gold',
          'Fine gold',
          'Coarse gold',
          'Nuggets',
          'Gold-bearing hard rock/ore',
          'Combination',
        ],
      },
      {
        id: 'q28',
        n: 28,
        label: 'Approximately how much material do you process?',
        type: 'group',
        fields: [
          { key: 'shovels', label: 'Shovels/day', type: 'number' },
          { key: 'tonnes', label: 'Tonnes/day', type: 'number' },
        ],
      },
      {
        id: 'q29',
        n: 29,
        label: 'Approximately how much gold do you recover?',
        type: 'group',
        fields: [
          { key: 'gramsDay', label: 'Grams/day', type: 'number' },
          { key: 'gramsWeek', label: 'Grams/week', type: 'number' },
        ],
      },
      {
        id: 'q30',
        n: 30,
        label: 'Is gold production:',
        type: 'single',
        options: ['Consistent', 'Seasonal', 'Highly variable'],
      },
      {
        id: 'q31',
        n: 31,
        label: 'During which months is gold production usually highest?',
        type: 'text',
      },
      {
        id: 'q32',
        n: 32,
        label: 'What are the main factors affecting your gold production?',
        type: 'multi',
        options: [
          'Water availability',
          'Gold concentration',
          'Weather',
          'Flooding',
          'Equipment',
          'Labour',
          'Access/transport',
          'Other',
        ],
        other: true,
      },
    ],
  },

  {
    id: 's5',
    number: 5,
    title: 'Gold processing and mercury',
    questions: [
      {
        id: 'q33',
        n: 33,
        label: 'How do you process the material to recover gold?',
        type: 'multi',
        options: [
          'Panning/Sluicing/Gravity concentration',
          'Shaking table',
          'Trommel',
          'Crushing/grinding',
          'Mercury amalgamation',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q34',
        n: 34,
        label: 'Do you currently use mercury?',
        type: 'single',
        options: ['Yes', 'No', 'Previously used'],
      },
      { id: 'q35', n: 35, label: 'If yes, where is mercury used?', type: 'text' },
      {
        id: 'q36',
        n: 36,
        label: 'How frequently do you use mercury?',
        type: 'single',
        options: ['Every day', 'Several times per week / Occasionally', 'Other'],
        other: true,
      },
      { id: 'q37', n: 37, label: 'Where do you obtain mercury?', type: 'text' },
      { id: 'q38', n: 38, label: 'Do you burn gold amalgam?', type: 'single', options: YES_NO },
      {
        id: 'q39',
        n: 39,
        label: 'Where is amalgam normally burned?',
        type: 'single',
        options: ['At mining site', 'At home / community', "Gold buyer's premises", 'Other'],
        other: true,
      },
      {
        id: 'q40',
        n: 40,
        label: 'Do you use a retort when burning amalgam?',
        type: 'single',
        options: ['Yes', 'No', 'Don’t know what a retort is'],
      },
      {
        id: 'q41',
        n: 41,
        label: 'Have you received training on mercury-free gold processing?',
        type: 'single',
        options: YES_NO,
      },
      {
        id: 'q42',
        n: 42,
        label:
          'Would you be willing to adopt mercury-free gold processing if suitable technology and training were available?',
        type: 'single',
        options: ['Yes', 'No', 'Maybe'],
      },
    ],
  },

  {
    id: 's6',
    number: 6,
    title: 'Occupational health and safety',
    questions: [
      {
        id: 'q43',
        n: 43,
        label: 'Have you received mining health and safety training?',
        type: 'single',
        options: YES_NO,
      },
      {
        id: 'q44',
        n: 44,
        label: 'What are the main safety risks at this mining site?',
        type: 'multi',
        options: [
          'Pit collapse',
          'Landslide',
          'Drowning',
          'Falling rocks',
          'Mercury exposure',
          'Snake / insect bites',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q45',
        n: 45,
        label: 'Have you or another miner been injured at this site?',
        type: 'single',
        options: YES_NO,
      },
      {
        id: 'q46',
        n: 46,
        label: 'What safety equipment is available?',
        type: 'multi',
        options: [
          'Helmet',
          'Safety boots',
          'Gloves',
          'Eye protection',
          'Ear protection',
          'Life jacket',
          'First-aid kit',
          'None',
        ],
      },
      {
        id: 'q47',
        n: 47,
        label: 'Do workers regularly use PPE?',
        type: 'single',
        options: ['Always', 'Sometimes', 'Rarely', 'Never'],
      },
      {
        id: 'q48',
        n: 48,
        label: 'Is first aid available at the mining site?',
        type: 'single',
        options: YES_NO,
      },
    ],
  },

  {
    id: 's7',
    number: 7,
    title: 'Environment and conservation',
    questions: [
      {
        id: 'q49',
        n: 49,
        label: 'Does your mining operation require clearing of vegetation?',
        type: 'single',
        options: ['No / minimal', 'Some clearing', 'Significant clearing'],
      },
      {
        id: 'q50',
        n: 50,
        label: 'Does your mining activity disturb a river or stream?',
        type: 'single',
        options: YES_NO,
      },
      {
        id: 'q51',
        n: 51,
        label: 'Does your operation discharge muddy water into a river or stream?',
        type: 'single',
        options: ['Yes', 'No', 'Sometimes'],
      },
      {
        id: 'q52',
        n: 52,
        label: 'How do you manage mining waste / tailings?',
        type: 'multi',
        options: [
          'Backfill pits',
          'Store on site',
          'Discharge into waterway',
          'Leave on site',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q53',
        n: 53,
        label: 'What environmental changes have you observed as a result of mining?',
        type: 'multi',
        options: [
          'Deforestation',
          'Riverbank erosion',
          'Water pollution / turbidity',
          'Soil erosion',
          'Loss of fish',
          'Loss of wildlife habitat',
          'Abandoned pits',
          'None observed',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q54',
        n: 54,
        label:
          'Are there important forests, rivers, wildlife habitats or culturally significant areas near your mining site?',
        type: 'single',
        options: ['Yes', 'No', "Don't know"],
      },
      {
        id: 'q55',
        n: 55,
        label: 'Are you aware that the Managalas area has conservation objectives?',
        type: 'single',
        options: YES_NO,
      },
      {
        id: 'q56',
        n: 56,
        label:
          'Do you believe your mining activities can affect the conservation objectives of Managalas?',
        type: 'single',
        options: ['Yes', 'No', 'Unsure'],
      },
      {
        id: 'q57',
        n: 57,
        label: 'What could miners do differently to reduce environmental impacts?',
        type: 'textarea',
      },
    ],
  },

  {
    id: 's8',
    number: 8,
    title: 'Mine-site rehabilitation',
    questions: [
      {
        id: 'q58',
        n: 58,
        label: 'Do you rehabilitate the area after mining?',
        type: 'single',
        options: ['Always', 'Sometimes', 'Rarely', 'Never'],
      },
      {
        id: 'q59',
        n: 59,
        label: 'What rehabilitation activities do you undertake?',
        type: 'multi',
        options: [
          'Backfill pits',
          'Replace topsoil',
          'Replant vegetation',
          'Stabilise riverbanks',
          'Restore drainage',
          'None',
        ],
      },
      {
        id: 'q60',
        n: 60,
        label: 'What prevents you from rehabilitating mining sites?',
        type: 'multi',
        options: [
          'Lack of knowledge',
          'Cost',
          'Lack of equipment',
          'Lack of time',
          'No requirement',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q61',
        n: 61,
        label: 'Would you participate in a mine-site rehabilitation programme?',
        type: 'single',
        options: ['Yes', 'No', 'Maybe'],
      },
    ],
  },

  {
    id: 's9',
    number: 9,
    title: 'Gold sales and market access',
    questions: [
      { id: 'q62', n: 62, label: 'Where do you normally sell your gold?', type: 'text' },
      {
        id: 'q63',
        n: 63,
        label: 'Who buys your gold?',
        type: 'single',
        options: ['Local gold buyer', 'Gold trader', 'Company', 'Other'],
        other: true,
        follow: { label: 'Name', type: 'text' },
      },
      {
        id: 'q64',
        n: 64,
        label: 'How far do you travel to sell your gold?',
        type: 'group',
        fields: [
          { key: 'km', label: 'Kilometres', type: 'number' },
          { key: 'hours', label: 'Hours', type: 'number' },
        ],
      },
      {
        id: 'q65',
        n: 65,
        label: 'How often do you sell your gold?',
        type: 'single',
        options: ['Daily', 'Weekly', 'Monthly', 'When sufficient gold is recovered'],
      },
      {
        id: 'q66',
        n: 66,
        label: 'How is the gold price determined?',
        type: 'single',
        options: [
          'Buyer determines price',
          'Based on international gold price',
          'Negotiated with buyer',
          "Don't know",
          'Other',
        ],
        other: true,
      },
      {
        id: 'q67',
        n: 67,
        label: 'Is your gold weighed and tested before sale?',
        type: 'single',
        options: ['Yes', 'No', "Don't know"],
      },
      {
        id: 'q68',
        n: 68,
        label: 'Do you receive a receipt or record of your gold sale?',
        type: 'single',
        options: ['Always', 'Sometimes', 'Never'],
      },
      {
        id: 'q69',
        n: 69,
        label: 'What are the main difficulties in accessing gold markets?',
        type: 'multi',
        options: [
          'Distance',
          'Transport cost',
          'Lack of buyers',
          'Low prices',
          'Lack of information',
          'Security',
          'Other',
        ],
        other: true,
      },
    ],
  },

  {
    id: 's10',
    number: 10,
    title: 'Formalisation and mining associations',
    questions: [
      {
        id: 'q70',
        n: 70,
        label: 'Is your mining operation formally registered/licensed?',
        type: 'single',
        options: ['Yes', 'No', 'Application pending', "Don't know"],
        follow: {
          label: 'If no, would you like to join an association?',
          type: 'single',
          options: YES_NO,
          when: ['No'],
        },
      },
      {
        id: 'q71',
        n: 71,
        label: 'Do you belong to a mining association or cooperative?',
        type: 'single',
        options: YES_NO,
        follow: { label: 'If yes, name', type: 'text', when: ['Yes'] },
      },
      {
        id: 'q72',
        n: 72,
        label: 'What type of association is it?',
        type: 'single',
        options: [
          'Mining association',
          'Cooperative',
          'Landowner association (ILG)',
          'Community-based organisation',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q73',
        n: 73,
        label: 'What benefits do you receive from the association?',
        type: 'multi',
        options: [
          'Training',
          'Market access',
          'Equipment',
          'Finance',
          'Advocacy / representation',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q74',
        n: 74,
        label: 'If you are not formally registered, what is the main reason?',
        type: 'single',
        options: [
          "Don't know how to register",
          'Cost',
          'Distance',
          'Licensing process is difficult',
          'Land ownership issues',
          'Lack of information',
          'Do not see the benefit',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q75',
        n: 75,
        label:
          'Would you be interested in joining/forming a recognised mining association or cooperative?',
        type: 'single',
        options: ['Yes', 'No', 'Maybe'],
      },
    ],
  },

  {
    id: 's11',
    number: 11,
    title: 'Social issues',
    questions: [
      {
        id: 'q76',
        n: 76,
        label: 'Has mining created any conflicts in the community?',
        type: 'single',
        options: YES_NO,
      },
      {
        id: 'q77',
        n: 77,
        label: 'What are the main social issues associated with mining?',
        type: 'multi',
        options: [
          'Land disputes',
          'Disputes over gold / income',
          'Disputes between miners and landowners',
          'Family / community conflict',
          'Alcohol / drug-related problems',
          'Safety / security problems',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q78',
        n: 78,
        label: 'Have you been robbed or your gold stolen?',
        type: 'single',
        options: YES_NO,
        follow: { label: 'If yes, details', type: 'textarea', when: ['Yes'] },
      },
      {
        id: 'q79',
        n: 79,
        label:
          'Has mining affected traditional livelihoods such as gardening, hunting or fishing?',
        type: 'single',
        options: ['Positively', 'Negatively', 'Both', 'No significant effect'],
      },
      {
        id: 'q80',
        n: 80,
        label: 'Does mining provide important benefits to your household/community?',
        type: 'single',
        options: YES_NO,
        follow: { label: 'If yes, what are the main benefits?', type: 'textarea', when: ['Yes'] },
      },
    ],
  },

  {
    id: 's12',
    number: 12,
    title: 'Training and awareness',
    questions: [
      {
        id: 'q81',
        n: 81,
        label: 'Have you received any formal training related to mining?',
        type: 'single',
        options: YES_NO,
      },
      {
        id: 'q82',
        n: 82,
        label: 'If yes, what training have you received?',
        type: 'multi',
        options: [
          'Mining methods',
          'Gold processing',
          'Mercury management',
          'Health and safety',
          'Environmental management',
          'Mine rehabilitation',
          'Business / financial management',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q83',
        n: 83,
        label: 'What training do you most need?',
        type: 'multi',
        options: [
          'Improved mining methods / Gold recovery',
          'Mercury-free processing',
          'Occupational health and safety',
          'Environmental management / Rehabilitation',
          'Business management / Gold marketing',
          'Formalization / licensing',
          'Conservation',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q84',
        n: 84,
        label: 'Would you participate in practical training at your mining site?',
        type: 'single',
        options: ['Yes', 'No', 'Maybe'],
      },
    ],
  },

  {
    id: 's13',
    number: 13,
    title: "Miner's view on mining and conservation",
    questions: [
      {
        id: 'q85',
        n: 85,
        label:
          'Before this interview, were you aware of the conservation goals of the Managalas Conservation Area?',
        type: 'single',
        options: ['Yes', 'No', 'Somewhat'],
      },
      {
        id: 'q86',
        n: 86,
        label: 'In your opinion, can small-scale mining and conservation exist together?',
        type: 'single',
        options: ['Yes', 'No', 'Unsure'],
      },
      {
        id: 'q87',
        n: 87,
        label:
          'What changes would be needed to make mining more environmentally sustainable in Managalas?',
        type: 'textarea',
      },
      {
        id: 'q88',
        n: 88,
        label:
          'If mining is found to be damaging important conservation areas, which option would you prefer?',
        type: 'single',
        options: [
          'Stop mining in sensitive conservation areas',
          'Move mining to designated areas',
          'Continue mining with stronger environmental conditions',
          'Continue mining using improved/sustainable methods',
          'Develop alternative livelihoods',
          'Combination of the above',
          'Unsure',
        ],
      },
      {
        id: 'q89',
        n: 89,
        label:
          'Would you be willing to change your current mining practices to help achieve conservation goals?',
        type: 'single',
        options: ['Yes', 'No', 'Maybe'],
      },
      {
        id: 'q90',
        n: 90,
        label: 'Which changes would you be willing to make?',
        type: 'multi',
        options: [
          'Reduce forest clearing',
          'Avoid sensitive areas',
          'Avoid mining directly in rivers',
          'Use mercury-free processing',
          'Improve tailings management',
          'Rehabilitate mined areas',
          'Use safer mining methods',
          'Reduce size & intensity of operations',
          'Move to designated mining areas',
          'Other',
        ],
        other: true,
      },
      {
        id: 'q91',
        n: 91,
        label:
          'If sustainable mining methods, training, equipment and market support were available, would you prefer to:',
        type: 'single',
        options: [
          'Continue mining using sustainable practices',
          'Reduce mining and develop other livelihoods',
          'Stop mining',
          'Continue mining as currently practiced',
          'Unsure',
        ],
      },
    ],
  },

  {
    id: 's14',
    number: 14,
    title: 'Final comments',
    questions: [
      {
        id: 'q92',
        n: 92,
        label:
          'What is the most important support you would like from government, SAMS, CIFOR-ICRAF, MCF, conservation organisations or other partners?',
        type: 'textarea',
      },
      {
        id: 'q93',
        n: 93,
        label:
          'What message would you like to give to organisations working on conservation and mining in Managalas?',
        type: 'textarea',
      },
    ],
  },

  {
    id: 'observation',
    title: "Enumerator's observation",
    note: 'Completed by the enumerator, not the respondent.',
    questions: [
      {
        id: 'o1',
        label: 'Overall mining intensity',
        type: 'single',
        options: ['Low', 'Moderate', 'High', 'Very high'],
        follow: { label: "Enumerator's notes", type: 'textarea' },
      },
      {
        id: 'o2',
        label: 'Overall environmental concern',
        type: 'single',
        options: ['Low', 'Moderate', 'High', 'Very high'],
        follow: { label: "Enumerator's notes", type: 'textarea' },
      },
      {
        id: 'o3',
        label: 'Site GPS recorded',
        type: 'single',
        options: YES_NO,
        follow: { label: 'Lat / Long', type: 'text', when: ['Yes'] },
      },
      { id: 'o4', label: "Enumerator's additional comments", type: 'textarea' },
      { id: 'o5', label: 'Enumerator name', type: 'text' },
      { id: 'o6', label: 'Signature', type: 'text' },
      { id: 'o7', label: 'Date', type: 'date' },
    ],
  },
];

export const SECTIONS_BY_ID = new Map(SECTIONS.map((s) => [s.id, s]));

/** Every question across every section, in form order. */
export const ALL_QUESTIONS = SECTIONS.flatMap((s) => s.questions);

/** The 93 numbered questions, excluding consent and observation items. */
export const NUMBERED_COUNT = ALL_QUESTIONS.filter((q) => q.n).length;
