/* 50 subject icons (24×24 line art). A class gets the first icon whose keywords match a word in
   its name: a keyword ending in "$" must be the whole word, one with a space is matched as a
   phrase, anything else matches the start of a word ("CHEM" matches 12CHEM and Chemistry).
   More specific subjects come first so "Food Technology" isn't caught by a generic match. */
const SubjectIcons = (() => {
  const L = [
    ['specialist', 'Specialist maths', '#3f51b5', 'SPECIALIST SPEC$ MATHS C', '<path d="M12 12c-2-2.7-3.4-4-5-4a4 4 0 0 0 0 8c1.6 0 3-1.3 5-4zm0 0c2 2.7 3.4 4 5 4a4 4 0 0 0 0-8c-1.6 0-3 1.3-5 4z"/>'],
    ['methods', 'Maths methods', '#1967d2', 'METHODS CALCULUS FUNCTION MATHS B', '<path d="M4 4v16h16"/><path d="M7 16c3 0 4-9 7-9s3 5 6 5"/>'],
    ['stats', 'Statistics', '#129eaf', 'STAT GENERAL MATH ESSENTIAL MATH DATA', '<path d="M4 20h16"/><rect x="5" y="11" width="3" height="7" rx="1"/><rect x="10.5" y="6" width="3" height="12" rx="1"/><rect x="16" y="13" width="3" height="5" rx="1"/>'],
    ['geometry', 'Geometry', '#9334e6', 'GEOMETR TRIG MEASUREMENT', '<circle cx="12" cy="5" r="1.6"/><path d="M11 6.5 6 20M13 6.5 18 20M8 15h8"/>'],
    ['food', 'Food & hospitality', '#e8710a', 'FOOD HOSP COOK CULIN NUTRIT CATER HOME EC', '<path d="M7 3v18M4 3v5a3 3 0 0 0 6 0V3M17 21V3c-2 1-3 4-3 8h3"/>'],
    ['calculator', 'Accounting', '#188038', 'ACCOUNT ACC$ FINANC FIN$', '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>'],
    ['economics', 'Economics', '#188038', 'ECON ECO$', '<path d="M4 18l5-5 4 3 7-8"/><path d="M15 8h5v5"/>'],
    ['maths', 'Maths', '#1967d2', 'MATH MAT$ MTH MA$ NUMERACY ALGEBRA NUMBER', '<path d="M5 7h14M9 7v12M15 7v9a3 3 0 0 0 3 3"/>'],
    ['business', 'Business', '#8d5b3e', 'BUS ENTERPRISE MANAGEMENT MARKETING COMMERCE ENTREPRENEUR', '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'],
    ['legal', 'Legal studies', '#4757c9', 'LEGAL LAW LEG$ JUSTICE', '<path d="M12 4v16M8 20h8M5 7h14M7 7l-3 6a3 3 0 0 0 6 0zM17 7l-3 6a3 3 0 0 0 6 0z"/>'],
    ['civics', 'Civics & humanities', '#e8710a', 'CIVIC CITIZEN HASS SOSE HUMANITIES SOCIAL SOCIOLOG POLITIC', '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2A5 5 0 0 1 21 19"/>'],
    ['ancient', 'Ancient history', '#8d5b3e', 'ANCIENT CLASSIC', '<path d="M3 9l9-5 9 5zM5 20h14M3 22h18M6 9v11M10 9v11M14 9v11M18 9v11"/>'],
    ['history', 'History', '#b0532c', 'HIST HIS$', '<path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9"/>'],
    ['geography', 'Geography', '#129eaf', 'GEOG GEO$ GLOBAL', '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'],
    ['earth', 'Earth & environment', '#1e8e3e', 'EARTH ENVIRON ESS$ GEOLOG SUSTAIN CLIMATE', '<path d="M3 19l6-10 4 6 2-3 6 7z"/><circle cx="17" cy="6" r="2"/>'],
    ['marine', 'Marine science', '#0b8a9e', 'MARINE AQUA OCEAN', '<path d="M3 12c3-4 8-5 12-3l4-3v12l-4-3c-4 2-9 1-12-3z"/><circle cx="8" cy="11" r=".8"/>'],
    ['agriculture', 'Agriculture', '#1e8e3e', 'AGRI AG$ HORTIC FARM PRIMARY IND', '<path d="M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 14c0-3 2-5 6-5 0 3-2 5-6 5z"/>'],
    ['astronomy', 'Astronomy', '#3f51b5', 'ASTRO SPACE COSMO', '<circle cx="12" cy="12" r="5"/><path d="M4.5 15.5C2 18 2.5 19.5 4 19.8c2.5.5 8-2 12-6s6-8.5 3.8-9.6c-1-.5-2.5 0-4.3 1.3"/>'],
    ['physics', 'Physics', '#1967d2', 'PHYS$ PHYSICS PHY$ MECHANICS ELECTRON', '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>'],
    ['chemistry', 'Chemistry', '#e8710a', 'CHEM CHE$', '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>'],
    ['biology', 'Biology', '#1e8e3e', 'BIO LIFE SCI GENETIC ANATOM', '<path d="M7 3c0 5 10 7 10 12 0 3-2 5-2 6M17 3c0 5-10 7-10 12 0 3 2 5 2 6"/><path d="M8.5 6.5h7M8 17h8M10 10.5h4"/>'],
    ['psychology', 'Psychology', '#d01884', 'PSYCH', '<path d="M9 21v-3H7a2 2 0 0 1-2-2v-3l-2-1 2-3a7 7 0 0 1 14 1c0 3-1 5-3 6v5"/><path d="M11 9a2 2 0 1 1 3 1.7V12"/>'],
    ['science', 'Science', '#129eaf', 'SCI STEM LAB$ STEAM', '<path d="M6 21h12M9 18h6M10 4l4 2-3 6-4-2zM12.5 5.2l1-2M13 13a4 4 0 0 1 2 7M9 10.5V14"/>'],
    ['english', 'English', '#d93025', 'ENG$ ENGL EAL ESL EALD LITERACY', '<path d="M3 5c3-1 6-1 9 1v14c-3-2-6-2-9-1zM21 5c-3-1-6-1-9 1v14c3-2 6-2 9-1z"/>'],
    ['literature', 'Literature & writing', '#9334e6', 'LIT WRITING CREATIVE WRIT POETRY', '<path d="M20 4c-6 0-11 4-13 11l-2 5M20 4c0 6-4 10-10 11M9 11l4 1"/>'],
    ['reading', 'Reading & library', '#8d5b3e', 'LIBRAR READ BOOK', '<rect x="4" y="4" width="4" height="16" rx="1"/><rect x="9" y="6" width="4" height="14" rx="1"/><path d="M14.5 7.5l3.8-1 3 12.6-3.8 1z"/>'],
    ['languages', 'Languages', '#0b8a9e', 'LANG FRENCH FRE$ FRN JAPAN JPN JAP$ CHINESE CHN$ MANDARIN GERMAN GER$ ITALIAN ITA$ SPANISH SPA$ INDONES IND$ LATIN LAT$ KOREAN GREEK ARABIC AUSLAN VIETNAM HINDI LOTE MLL', '<path d="M4 5h11v8H9l-4 3v-3H4z"/><path d="M15 9h5v8h-1v3l-4-3h-4v-2"/>'],
    ['drama', 'Drama', '#9334e6', 'DRAMA DRA$ THEATRE THEATER PERFORMING', '<path d="M3 5c3 1 6 1 9 0v6a4.5 4.5 0 0 1-9 0z"/><path d="M12 9c3 1 6 1 9 0v6a4.5 4.5 0 0 1-9 0"/><path d="M6 9h.01M9 9h.01M6.5 12.5a2 2 0 0 0 2 0M15 13h.01M18 13h.01M15.5 17a2 2 0 0 1 2 0"/>'],
    ['dance', 'Dance', '#d01884', 'DANCE DAN$', '<circle cx="13" cy="4.5" r="1.8"/><path d="M13 7l-1 6 3 3 1 5M12 13l-4 2-2 5M8 9l4-1 4 2 3-2"/>'],
    ['music', 'Music', '#e8710a', 'MUSIC MUS$ BAND CHOIR INSTRUMENT', '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>'],
    ['film', 'Film & media', '#5f6368', 'FILM MEDIA FTV CINEMA TELEVISION VIDEO', '<rect x="3" y="9" width="18" height="11" rx="1.5"/><path d="M3 9l1-4 17-1v5M8 4.6 6.5 9M13 4.3 11.5 9M18 4 16.5 9"/>'],
    ['photography', 'Photography', '#4757c9', 'PHOTO CAMERA', '<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>'],
    ['art', 'Visual art', '#d01884', 'ART VIS VA$ PAINT DRAWING STUDIO CERAMIC SCULPT', '<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>'],
    ['design', 'Design', '#e8710a', 'DESIGN DES$ GRAPHIC ARCHITECT DRAFT', '<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/><path d="M3 22h18"/>'],
    ['digital', 'Digital technologies', '#1967d2', 'DIGITAL DIG$ DT$ IT$ ICT COMPUT CODING CODE PROGRAM SOFTWARE INFORMATION CYBER', '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8h18M9 12l-2 2 2 2M15 12l2 2-2 2"/>'],
    ['robotics', 'Robotics', '#3f51b5', 'ROBOT MECHATRON AI$', '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16h5M3 12v3M21 12v3"/><circle cx="12" cy="3.5" r="1"/>'],
    ['engineering', 'Engineering', '#5f6368', 'ENGINEER', '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'],
    ['industrial', 'Industrial technology', '#8d5b3e', 'INDUSTRIAL WOOD METAL MANUFACT CONSTRUCT TRADE BUILDING ITD MATERIALS', '<path d="M15 3l6 6-3 3-6-6z"/><path d="M13 7 3 17l4 4 10-10"/>'],
    ['textiles', 'Textiles & fashion', '#d01884', 'TEXTILE FASHION SEW TEX$', '<path d="M8 4 3 7l2 4 2-1v10h10V10l2 1 2-4-5-3a4 4 0 0 1-8 0z"/>'],
    ['sport', 'PE & sport', '#e8710a', 'PE$ SPORT PHYSICAL ED FITNESS ATHLET BASKETBALL FOOTBALL SOCCER NETBALL CRICKET RECREATION', '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6c3 3 3 9.8 0 12.8M18.4 5.6c-3 3-3 9.8 0 12.8"/>'],
    ['health', 'Health', '#d93025', 'HEALTH HPE WELLBEING PHYSICAL NURS MEDIC FIRST AID', '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/><path d="M6 12h3l2-3 2 5 1.5-2H18"/>'],
    ['outdoor', 'Outdoor education', '#1e8e3e', 'OUTDOOR CAMP ADVENTURE', '<path d="M3 20 12 4l9 16zM12 20l-3-6h6z"/>'],
    ['aviation', 'Aviation', '#1967d2', 'AVIAT FLIGHT AERO PILOT', '<path d="M21 15.5 13 12V5.5a1.5 1.5 0 0 0-3 0V12l-8 3.5V17l8-2v4l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-4l8 2z"/>'],
    ['tourism', 'Tourism', '#129eaf', 'TOURIS TRAVEL EVENTS', '<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2.3"/>'],
    ['childcare', 'Early childhood', '#c88a04', 'CHILD EARLY KINDER PREP$ FOUNDATION', '<rect x="3" y="12" width="8" height="8" rx="1"/><rect x="13" y="12" width="8" height="8" rx="1"/><rect x="8" y="4" width="8" height="8" rx="1"/>'],
    ['religion', 'Religion', '#c88a04', 'RELIG SOR$ RE$ THEOLOG CHRISTIAN SCRIPTURE FAITH SPIRITUAL', '<path d="M9 10h6v11H9zM12 10V7"/><path d="M12 3c1.5 1.5 1.5 3 0 4-1.5-1-1.5-2.5 0-4z"/>'],
    ['philosophy', 'Philosophy & ethics', '#9334e6', 'PHILOS ETHIC THINK CRITICAL TOK$ INQUIR', '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>'],
    ['debating', 'Debating', '#d93025', 'DEBAT PUBLIC SPEAK SPEECH ORATORY RHETORIC', '<path d="M3 10v4h3l9 5V5L6 10z"/><path d="M6 14l1 5h3l-1-4M18 9a4 4 0 0 1 0 6"/>'],
    ['homeroom', 'Homeroom & pastoral', '#5f6368', 'HOME PASTORAL FORM$ CARE$ TUTOR MENTOR ROLL HOUSE ADVIS ASSEMBLY', '<path d="M3 11 12 4l9 7M5 9.5V20h5v-6h4v6h5V9.5"/>'],
    ['general', 'General', '#1967d2', '', '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>'],
  ];
  // Keywords are space-separated; multi-word phrases are written with a "+" placeholder below.
  const PHRASES = ['MATHS C', 'MATHS B', 'GENERAL MATH', 'ESSENTIAL MATH', 'HOME EC', 'LIFE SCI', 'CREATIVE WRIT', 'PRIMARY IND', 'PHYSICAL ED', 'FIRST AID', 'PUBLIC SPEAK'];
  // Class colours are six bright classroom colours. Each original hue maps to the nearest one; "ink" is the text/glyph colour on that fill and "fg" the colour to use on white.
  const SEAT = { blue: '#016df8', green: '#04af4f', red: '#fa3e42', orange: '#fa6002', yellow: '#fab001', teal: '#01aab5', navy: '#0a1c3f' };
  const TO_SEAT = {
    '#1967d2': SEAT.blue, '#3f51b5': SEAT.blue, '#4757c9': SEAT.blue,
    '#9334e6': SEAT.yellow, // the former purples (geometry, literature, drama, philosophy)
    '#129eaf': SEAT.teal, '#0b8a9e': SEAT.teal,
    '#188038': SEAT.green, '#1e8e3e': SEAT.green,
    '#d93025': SEAT.red, '#d01884': SEAT.red, '#b0532c': SEAT.red,
    '#e8710a': SEAT.orange, '#8d5b3e': SEAT.orange,
    '#c88a04': SEAT.yellow,
    '#5f6368': SEAT.navy,
  };
  const list = L.map(([id, label, color0, kw, svg]) => {
    const color = TO_SEAT[color0] || SEAT.blue;
    const ink = color === SEAT.yellow ? SEAT.navy : '#ffffff';
    const fg = color === SEAT.yellow ? '#c98a00' : color;
    let k = ' ' + kw + ' ';
    for (const p of PHRASES) k = k.split(' ' + p + ' ').join(' ' + p.replace(' ', '+') + ' ');
    return { id, label, color, ink, fg, svg, kw: k.trim().split(/\s+/).filter(Boolean).map(t => t.replace('+', ' ')) };
  });
  const byId = new Map(list.map(i => [i.id, i]));
  function guess(name) {
    const words = String(name || '').toUpperCase().replace(/&/g, ' AND ').replace(/[^A-Z]+/g, ' ').trim().split(' ').filter(Boolean);
    const joined = ' ' + words.join(' ') + ' ';
    for (const ic of list) {
      for (const t of ic.kw) {
        if (t.includes(' ') ? joined.includes(' ' + t) : t.endsWith('$') ? words.includes(t.slice(0, -1)) : words.some(w => w.startsWith(t))) return ic.id;
      }
    }
    return 'general';
  }
  const get = id => byId.get(id) || byId.get('general');
  const svg = (id, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${get(id).svg}</svg>`;
  return { list, guess, get, svg };
})();
if (typeof module !== 'undefined') module.exports = SubjectIcons;
