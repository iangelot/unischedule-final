/**
 * Filières camerounaises — ENSPD, IUT Douala, IAI, FSEG, lycées techniques.
 * Clés en français (usage principal). aliases = anciennes valeurs anglaises en base.
 */

export const CAMEROON_SPECIALITIES = {
  // ── ENSPD / IUT / IAI — Ingénierie & informatique ──
  'Génie Logiciel (GL)': {
    code: 'GL', dept: 'ENSPD · IUT · IAI', level: 'university',
    aliases: ['Software Engineering'],
  },
  'Réseaux & Télécoms (RT)': {
    code: 'RT', dept: 'ENSPD · IUT', level: 'university',
    aliases: ['Networking & Telecom'],
  },
  'Sécurité des Systèmes (SSI)': {
    code: 'SSI', dept: 'ENSPD · IUT', level: 'university',
    aliases: ['Cybersecurity'],
  },
  'Management des SI (MSI)': {
    code: 'MSI', dept: 'ENSPD · IUT', level: 'university',
    aliases: [],
  },
  'Génie Civil (GC)': {
    code: 'GC', dept: 'ENSPD', level: 'university',
    aliases: ['Civil Engineering'],
  },
  'Génie Électrique (GE)': {
    code: 'GE', dept: 'ENSPD', level: 'university',
    aliases: ['Electrical Engineering'],
  },
  'Génie Mécanique (GM)': {
    code: 'GM', dept: 'ENSPD', level: 'university',
    aliases: ['Mechanical Engineering'],
  },
  'Design Graphique (GD)': {
    code: 'GD', dept: 'IUT · IAI', level: 'university',
    aliases: ['Graphic Design'],
  },
  // ── FSEG / ESSEC / IUT — Gestion ──
  'Comptabilité & Finance (CF)': {
    code: 'CF', dept: 'FSEG · ESSEC · IUT', level: 'university',
    aliases: ['Accounting & Finance'],
  },
  'Gestion & Management (MNG)': {
    code: 'MNG', dept: 'FSEG · ESSEC', level: 'university',
    aliases: ['Management'],
  },
  'Marketing & Communication (MKT)': {
    code: 'MKT', dept: 'FSEG · IUT', level: 'university',
    aliases: ['Marketing'],
  },
  'Banque & Assurance (BF)': {
    code: 'BF', dept: 'ESSEC', level: 'university',
    aliases: ['Banking & Insurance'],
  },
  'Communication Négociation Vente (CNV)': {
    code: 'CNV', dept: 'IUT Douala', level: 'university',
    aliases: [],
  },
  // ── Santé & sciences ──
  'Médecine (MED)': {
    code: 'MED', dept: 'Faculté de Médecine', level: 'university',
    aliases: ['Medicine'],
  },
  'Pharmacie (PHA)': {
    code: 'PHA', dept: 'Faculté de Médecine', level: 'university',
    aliases: ['Pharmacy'],
  },
  'Biologie (BIO)': {
    code: 'BIO', dept: 'Faculté des Sciences', level: 'university',
    aliases: ['Biology'],
  },
  'Chimie (CHM)': {
    code: 'CHM', dept: 'Faculté des Sciences', level: 'university',
    aliases: ['Chemistry'],
  },
  'Droit (DRT)': {
    code: 'DRT', dept: 'Faculté de Droit', level: 'university',
    aliases: ['Law'],
  },
  // ── Lycée / BTS ──
  'Série Scientifique (S)': {
    code: 'S', dept: 'Lycée', level: 'secondary',
    aliases: ['Sciences'],
  },
  'Série Littéraire (A)': {
    code: 'A', dept: 'Lycée', level: 'secondary',
    aliases: ['Arts & Literature'],
  },
  'Série Technique Industrielle (TI)': {
    code: 'TI', dept: 'Lycée Technique', level: 'secondary',
    aliases: ['Technical/Industrial'],
  },
  'Série Économie & Gestion (ES)': {
    code: 'ES', dept: 'Lycée', level: 'secondary',
    aliases: ['Economics'],
  },
};

/** Match filière peu importe français ou ancien libellé anglais */
export function specialityMatches(a, b) {
  if (!a || !b) return a === b;
  if (a === b) return true;
  for (const [key, meta] of Object.entries(CAMEROON_SPECIALITIES)) {
    const all = [key, ...(meta.aliases || [])];
    if (all.includes(a) && all.includes(b)) return true;
  }
  return false;
}

export function specialityLabel(value, lang = 'fr') {
  if (!value) return '—';
  for (const [key, meta] of Object.entries(CAMEROON_SPECIALITIES)) {
    if (key === value || meta.aliases?.includes(value)) {
      return lang === 'fr' ? key : (meta.aliases?.[0] || key);
    }
  }
  return value;
}
