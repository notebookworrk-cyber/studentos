const SYNONYMS: Record<string, string[]> = {
  cell: ["cellular"],
  mitochondria: ["mitochondrion", "powerhouse"],
  ATP: ["adenosine triphosphate", "energy"],
  nucleus: ["nuclear"],
  enzyme: ["protein catalyst", "biocatalyst"],
  photosynthesis: ["light reactions", "carbon fixation"],
  respiration: ["cellular respiration", "oxidation"],
  protein: ["polypeptide", "amino acid chain"],
  DNA: ["deoxyribonucleic acid", "genetic material"],
  RNA: ["ribonucleic acid"],
  gene: ["genetic locus", "allele"],
  chromosome: ["chromatid"],
  membrane: ["bilayer", "lipid bilayer"],
  osmosis: ["diffusion", "passive transport"],
  mitosis: ["cell division", "equational division"],
  meiosis: ["reduction division"],
  evolution: ["natural selection", "adaptation"],
  ecology: ["environmental biology"],
  atom: ["particle", "molecular unit"],
  molecule: ["chemical compound"],
  electron: ["negative charge", "e-"],
  proton: ["positive charge", "hydrogen ion"],
  neutron: ["neutral particle"],
  energy: ["force × distance", "work capacity"],
  velocity: ["speed", "rate of motion"],
  acceleration: ["rate of velocity change"],
  gravity: ["gravitational force", "weight"],
  mass: ["amount of matter", "inertia"],
  force: ["push or pull", "net force"],
  wavelength: ["period × speed"],
  frequency: ["cycles per second", "Hz"],
  algorithm: ["procedure", "method", "step-by-step"],
  function: ["method", "procedure", "subroutine"],
  variable: ["identifier", "symbol", "name"],
  loop: ["iteration", "cycle", "repetition"],
  array: ["list", "sequence", "collection"],
  stack: ["LIFO structure"],
  queue: ["FIFO structure"],
  tree: ["hierarchy", "graph structure"],
  hash: ["map", "dictionary", "associative array"],
};

const lookup = new Map<string, string[]>();

for (const [key, vals] of Object.entries(SYNONYMS)) {
  const group = [key.toLowerCase(), ...vals.map((v) => v.toLowerCase())];
  for (const term of group) {
    if (!lookup.has(term)) lookup.set(term, []);
    for (const other of group) {
      if (other !== term && !lookup.get(term)!.includes(other)) {
        lookup.get(term)!.push(other);
      }
    }
  }
}

export function areSynonyms(a: string, b: string): boolean {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower === bLower) return true;
  return lookup.get(aLower)?.includes(bLower) ?? false;
}

export function getSynonyms(term: string): string[] {
  return lookup.get(term.toLowerCase()) ?? [];
}

export function normalizeTerm(term: string): string {
  const lower = term.toLowerCase().trim();
  for (const [key, vals] of Object.entries(SYNONYMS)) {
    const group = [key.toLowerCase(), ...vals.map((v) => v.toLowerCase())];
    if (group.includes(lower)) return key.toLowerCase();
  }
  return lower;
}
