import { useState, useMemo, useEffect } from 'react';
import './CartridgeReference.css';

interface CartridgeData {
  id: number;
  name: string;
  category: string;
  bulletType: string;
  weightGr: number;
  diameterIn: number;
  muzzleVelocityFps: number;
  bcG1: number;
  notes?: string;
}

const CARTRIDGES: CartridgeData[] = [
  // Handgun
  { id: 1,  name: '.380 ACP 95gr FMJ',             category: 'Handgun',         bulletType: 'FMJ',          weightGr: 95,  diameterIn: 0.355, muzzleVelocityFps: 955,  bcG1: 0.119, notes: 'Common compact carry round' },
  { id: 2,  name: '9mm Luger 115gr FMJ',            category: 'Handgun',         bulletType: 'FMJ',          weightGr: 115, diameterIn: 0.355, muzzleVelocityFps: 1180, bcG1: 0.130 },
  { id: 3,  name: '9mm Luger 124gr JHP',            category: 'Handgun',         bulletType: 'JHP',          weightGr: 124, diameterIn: 0.355, muzzleVelocityFps: 1150, bcG1: 0.143, notes: 'Popular self-defense load' },
  { id: 4,  name: '9mm Luger 147gr JHP',            category: 'Handgun',         bulletType: 'JHP',          weightGr: 147, diameterIn: 0.355, muzzleVelocityFps: 990,  bcG1: 0.167, notes: 'Subsonic-friendly heavy load' },
  { id: 5,  name: '.40 S&W 165gr FMJ',              category: 'Handgun',         bulletType: 'FMJ',          weightGr: 165, diameterIn: 0.400, muzzleVelocityFps: 1060, bcG1: 0.140 },
  { id: 6,  name: '.40 S&W 180gr JHP',              category: 'Handgun',         bulletType: 'JHP',          weightGr: 180, diameterIn: 0.400, muzzleVelocityFps: 1000, bcG1: 0.155 },
  { id: 7,  name: '.45 ACP 185gr JHP',              category: 'Handgun',         bulletType: 'JHP',          weightGr: 185, diameterIn: 0.452, muzzleVelocityFps: 1050, bcG1: 0.145 },
  { id: 8,  name: '.45 ACP 230gr FMJ',              category: 'Handgun',         bulletType: 'FMJ',          weightGr: 230, diameterIn: 0.452, muzzleVelocityFps: 830,  bcG1: 0.195, notes: 'Standard ball ammunition' },
  { id: 9,  name: '.357 Magnum 125gr JHP',          category: 'Handgun',         bulletType: 'JHP',          weightGr: 125, diameterIn: 0.357, muzzleVelocityFps: 1450, bcG1: 0.148, notes: 'High-velocity magnum load' },
  { id: 10, name: '.357 Magnum 158gr JSP',          category: 'Handgun',         bulletType: 'JSP',          weightGr: 158, diameterIn: 0.357, muzzleVelocityFps: 1235, bcG1: 0.164 },
  { id: 11, name: '.44 Magnum 240gr JSP',           category: 'Handgun',         bulletType: 'JSP',          weightGr: 240, diameterIn: 0.430, muzzleVelocityFps: 1350, bcG1: 0.205, notes: 'Classic hunting handgun round' },
  { id: 12, name: '10mm Auto 180gr FMJ',            category: 'Handgun',         bulletType: 'FMJ',          weightGr: 180, diameterIn: 0.400, muzzleVelocityFps: 1200, bcG1: 0.164 },
  // Intermediate Rifle
  { id: 13, name: '5.56 NATO 55gr FMJ (M193)',      category: 'Intermediate',    bulletType: 'FMJ',          weightGr: 55,  diameterIn: 0.224, muzzleVelocityFps: 3240, bcG1: 0.243, notes: 'US military standard, 20" barrel' },
  { id: 14, name: '5.56 NATO 62gr FMJ (M855)',      category: 'Intermediate',    bulletType: 'FMJ',          weightGr: 62,  diameterIn: 0.224, muzzleVelocityFps: 3110, bcG1: 0.304, notes: 'Steel-core green tip penetrator' },
  { id: 15, name: '.223 Rem 55gr V-MAX',            category: 'Intermediate',    bulletType: 'Polymer Tip',  weightGr: 55,  diameterIn: 0.224, muzzleVelocityFps: 3240, bcG1: 0.255, notes: 'Varmint hunting load' },
  { id: 16, name: '.223 Rem 77gr BTHP',             category: 'Intermediate',    bulletType: 'BTHP',         weightGr: 77,  diameterIn: 0.224, muzzleVelocityFps: 2750, bcG1: 0.372, notes: 'Match-grade, excellent BC for caliber' },
  { id: 17, name: '.300 BLK 125gr OTM',             category: 'Intermediate',    bulletType: 'OTM',          weightGr: 125, diameterIn: 0.308, muzzleVelocityFps: 2215, bcG1: 0.319, notes: 'Supersonic .300 Blackout' },
  { id: 18, name: '.300 BLK 220gr SMK Subsonic',    category: 'Intermediate',    bulletType: 'SMK',          weightGr: 220, diameterIn: 0.308, muzzleVelocityFps: 1010, bcG1: 0.608, notes: 'Subsonic suppressor load; high BC for slow projectile' },
  { id: 19, name: '7.62x39mm 123gr FMJ',            category: 'Intermediate',    bulletType: 'FMJ',          weightGr: 123, diameterIn: 0.312, muzzleVelocityFps: 2350, bcG1: 0.300, notes: 'AK-47 / SKS standard' },
  // Standard Rifle
  { id: 20, name: '.243 Win 100gr SP',              category: 'Standard Rifle',  bulletType: 'SP',           weightGr: 100, diameterIn: 0.243, muzzleVelocityFps: 2960, bcG1: 0.405, notes: 'Flat-shooting deer cartridge' },
  { id: 21, name: '6.5 Creedmoor 140gr ELD Match', category: 'Standard Rifle',  bulletType: 'ELD Match',    weightGr: 140, diameterIn: 0.264, muzzleVelocityFps: 2710, bcG1: 0.585, notes: 'Premier long-range match load' },
  { id: 22, name: '6.5 Creedmoor 120gr ELD Match', category: 'Standard Rifle',  bulletType: 'ELD Match',    weightGr: 120, diameterIn: 0.264, muzzleVelocityFps: 2910, bcG1: 0.486 },
  { id: 23, name: '6.5 Grendel 123gr ELD Match',   category: 'Standard Rifle',  bulletType: 'ELD Match',    weightGr: 123, diameterIn: 0.264, muzzleVelocityFps: 2580, bcG1: 0.506, notes: 'AR-15 platform long-range option' },
  { id: 24, name: '.270 Win 130gr SP',              category: 'Standard Rifle',  bulletType: 'SP',           weightGr: 130, diameterIn: 0.277, muzzleVelocityFps: 3060, bcG1: 0.408 },
  { id: 25, name: '.270 Win 150gr Partition',       category: 'Standard Rifle',  bulletType: 'Partition',    weightGr: 150, diameterIn: 0.277, muzzleVelocityFps: 2850, bcG1: 0.465, notes: 'Nosler bonded hunting bullet' },
  { id: 26, name: '7mm Rem Mag 162gr ELD-X',        category: 'Standard Rifle',  bulletType: 'ELD-X',        weightGr: 162, diameterIn: 0.284, muzzleVelocityFps: 2940, bcG1: 0.613, notes: 'High-BC hunting load' },
  { id: 27, name: '7mm Rem Mag 140gr AccuBond',     category: 'Standard Rifle',  bulletType: 'AccuBond',     weightGr: 140, diameterIn: 0.284, muzzleVelocityFps: 3150, bcG1: 0.485 },
  { id: 28, name: '.30-30 Win 150gr FN',            category: 'Standard Rifle',  bulletType: 'Flat Nose',    weightGr: 150, diameterIn: 0.308, muzzleVelocityFps: 2390, bcG1: 0.226, notes: 'Lever-action classic; flat nose for tubular magazine' },
  { id: 29, name: '.308 Win 168gr BTHP Match',      category: 'Standard Rifle',  bulletType: 'BTHP',         weightGr: 168, diameterIn: 0.308, muzzleVelocityFps: 2680, bcG1: 0.462, notes: 'Gold standard precision rifle load (Sierra MatchKing)' },
  { id: 30, name: '.308 Win 175gr SMK',             category: 'Standard Rifle',  bulletType: 'SMK',          weightGr: 175, diameterIn: 0.308, muzzleVelocityFps: 2610, bcG1: 0.505, notes: 'F-class / long-range competition load' },
  { id: 31, name: '.308 Win 150gr SP',              category: 'Standard Rifle',  bulletType: 'SP',           weightGr: 150, diameterIn: 0.308, muzzleVelocityFps: 2820, bcG1: 0.387 },
  { id: 32, name: '.30-06 Springfield 165gr SP',    category: 'Standard Rifle',  bulletType: 'SP',           weightGr: 165, diameterIn: 0.308, muzzleVelocityFps: 2800, bcG1: 0.428 },
  { id: 33, name: '.30-06 Springfield 180gr Partition', category: 'Standard Rifle', bulletType: 'Partition', weightGr: 180, diameterIn: 0.308, muzzleVelocityFps: 2700, bcG1: 0.474, notes: 'Classic all-around hunting load' },
  { id: 34, name: '7.62 NATO 147gr FMJ (M80)',      category: 'Standard Rifle',  bulletType: 'FMJ',          weightGr: 147, diameterIn: 0.308, muzzleVelocityFps: 2800, bcG1: 0.393, notes: 'NATO standard ball round' },
  // Magnum
  { id: 35, name: '.300 Win Mag 190gr BTHP Match',  category: 'Magnum',          bulletType: 'BTHP',         weightGr: 190, diameterIn: 0.308, muzzleVelocityFps: 2900, bcG1: 0.533, notes: 'Long-range precision' },
  { id: 36, name: '.300 Win Mag 180gr AccuBond',    category: 'Magnum',          bulletType: 'AccuBond',     weightGr: 180, diameterIn: 0.308, muzzleVelocityFps: 2960, bcG1: 0.507 },
  { id: 37, name: '.300 Win Mag 220gr SMK',         category: 'Magnum',          bulletType: 'SMK',          weightGr: 220, diameterIn: 0.308, muzzleVelocityFps: 2680, bcG1: 0.629, notes: 'Extreme long-range match load' },
  { id: 38, name: '.338 Lapua Mag 250gr Scenar',    category: 'Magnum',          bulletType: 'Scenar',       weightGr: 250, diameterIn: 0.338, muzzleVelocityFps: 2950, bcG1: 0.675, notes: 'ELR competition standard' },
  { id: 39, name: '.338 Lapua Mag 300gr BTHP',      category: 'Magnum',          bulletType: 'BTHP',         weightGr: 300, diameterIn: 0.338, muzzleVelocityFps: 2750, bcG1: 0.720, notes: 'Heaviest .338 load; exceptional retained velocity' },
  { id: 40, name: '.338 Win Mag 225gr AccuBond',    category: 'Magnum',          bulletType: 'AccuBond',     weightGr: 225, diameterIn: 0.338, muzzleVelocityFps: 2785, bcG1: 0.550 },
  { id: 41, name: '.375 H&H Mag 300gr DGX',         category: 'Magnum',          bulletType: 'DGX',          weightGr: 300, diameterIn: 0.375, muzzleVelocityFps: 2530, bcG1: 0.480, notes: 'Dangerous game hunting round (Dangerous Game Expanding)' },
  { id: 42, name: '.50 BMG 660gr FMJ (M33)',        category: 'Magnum',          bulletType: 'FMJ',          weightGr: 660, diameterIn: 0.510, muzzleVelocityFps: 2910, bcG1: 0.670, notes: 'US military anti-materiel round' },
  { id: 43, name: '.50 BMG 750gr A-MAX',            category: 'Magnum',          bulletType: 'A-MAX',        weightGr: 750, diameterIn: 0.510, muzzleVelocityFps: 2820, bcG1: 1.050, notes: 'Highest BC in dataset; extreme long-range' },
];

const CATEGORIES = ['All', 'Handgun', 'Intermediate', 'Standard Rifle', 'Magnum'] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_COLORS: Record<string, string> = {
  Handgun: 'cat-handgun',
  Intermediate: 'cat-intermediate',
  'Standard Rifle': 'cat-rifle',
  Magnum: 'cat-magnum',
};

const BULLET_TYPE_GLOSSARY: Record<string, string> = {
  FMJ: 'Full Metal Jacket — hardened projectile with complete metal jacket; no expansion',
  JHP: 'Jacketed Hollow Point — expands on impact for increased energy transfer',
  JSP: 'Jacketed Soft Point — partial jacket exposes lead tip; controlled expansion',
  BTHP: 'Boat-Tail Hollow Point — aerodynamic tapered base + hollow point; high BC',
  SMK: 'Sierra MatchKing — BTHP design optimized for precision and consistency',
  'ELD Match': 'Extremely Low Drag Match — polymer tip resists deformation in flight; exceptional BC',
  'ELD-X': 'Extremely Low Drag Expanding — ELD Match design adapted for hunting expansion',
  OTM: 'Open Tip Match — similar to BTHP; manufactured open tip rather than drilled',
  SP: 'Soft Point — exposed lead nose; reliable controlled expansion for hunting',
  Partition: 'Nosler Partition — dual-core bonded bullet; front expands, rear retained for penetration',
  AccuBond: 'Nosler AccuBond — bonded polymer-tip bullet; high BC with controlled expansion',
  'Polymer Tip': 'Ballistic tip (e.g. Hornady V-MAX) — polymer tip initiates rapid expansion',
  'Flat Nose': 'Flat Nose (FN) — safe for tubular lever-action magazines; blunt profile',
  Scenar: 'Lapua Scenar — BTHP match bullet engineered for ELR competition; very high BC',
  DGX: 'Dangerous Game Expanding — bonded cup-and-core; designed for thick-skinned dangerous game',
  'A-MAX': 'Hornady A-MAX — polymer-tip match bullet; predecessor to ELD Match; very high BC',
};

export default function CartridgeReference() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [search, setSearch] = useState('');
  const [selectedBulletType, setSelectedBulletType] = useState<string | null>(null);

  const filtered = useMemo(() => CARTRIDGES.filter(c => {
    const matchCat = activeCategory === 'All' || c.category === activeCategory;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.bulletType.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [activeCategory, search]);

  const bulletTypes = useMemo(() => Array.from(new Set(CARTRIDGES.map(c => c.bulletType))).sort(), []);

  // Close popover on Escape key
  useEffect(() => {
    if (!selectedBulletType) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedBulletType(null);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [selectedBulletType]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of CARTRIDGES) {
      counts[c.category] = (counts[c.category] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="ref-page">
      <div className="ref-hero">
        <h2>Cartridge Reference</h2>
        <p>
          Ballistic data for all 43 cartridges in the database. Every load is modeled with the G1 drag
          function and Runge-Kutta 4th-order integration — select any cartridge in the calculator to
          see its full trajectory.
        </p>
      </div>

      <div className="ref-filters">
        <div className="ref-category-tabs" role="group" aria-label="Filter by category">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-tab ${activeCategory === cat ? 'cat-tab-active' : ''} ${cat !== 'All' ? CATEGORY_COLORS[cat] : ''}`}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
            >
              {cat}
              {cat !== 'All' && (
                <span className="cat-count">
                  {categoryCounts[cat]}
                </span>
              )}
              {cat === 'All' && <span className="cat-count">{CARTRIDGES.length}</span>}
            </button>
          ))}
        </div>
        <input
          className="ref-search"
          type="text"
          placeholder="Search by name or bullet type…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search cartridges by name or bullet type"
        />
      </div>

      <div className="ref-summary">
        Showing {filtered.length} of {CARTRIDGES.length} cartridges
      </div>

      <div className="ref-table-wrap">
        <table className="ref-table">
          <thead>
            <tr>
              <th scope="col">Cartridge</th>
              <th scope="col">Category</th>
              <th scope="col">Bullet Type</th>
              <th scope="col" title="Bullet weight in grains">Weight (gr)</th>
              <th scope="col" title="Bullet diameter in inches">Diameter (in)</th>
              <th scope="col" title="Muzzle velocity in feet per second">MV (fps)</th>
              <th scope="col" title="G1 Ballistic Coefficient — higher = less drag">BC G1</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td className="ref-name">{c.name}</td>
                <td>
                  <span className={`cat-badge ${CATEGORY_COLORS[c.category]}`}>
                    {c.category}
                  </span>
                </td>
                <td>
                  <button
                    className="bullet-type-btn"
                    onClick={() => setSelectedBulletType(c.bulletType === selectedBulletType ? null : c.bulletType)}
                    title="Click to see bullet type description"
                  >
                    {c.bulletType}
                  </button>
                </td>
                <td className="ref-num">{c.weightGr}</td>
                <td className="ref-num">{c.diameterIn.toFixed(3)}"</td>
                <td className="ref-num ref-vel">{c.muzzleVelocityFps.toLocaleString()}</td>
                <td className="ref-num ref-bc">
                  <span className={`bc-bar-wrap`} title={`BC G1: ${c.bcG1}`}>
                    <span
                      className="bc-bar"
                      style={{ width: `${Math.min(100, (c.bcG1 / 1.1) * 100)}%` }}
                    />
                    <span className="bc-val">{c.bcG1.toFixed(3)}</span>
                  </span>
                </td>
                <td className="ref-notes">{c.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedBulletType && BULLET_TYPE_GLOSSARY[selectedBulletType] && (
        <div className="bullet-popover" role="dialog" aria-label={`${selectedBulletType} bullet type description`}>
          <button className="popover-close" onClick={() => setSelectedBulletType(null)} aria-label="Close popover">×</button>
          <strong>{selectedBulletType}</strong>
          <p>{BULLET_TYPE_GLOSSARY[selectedBulletType]}</p>
        </div>
      )}

      <section className="ref-glossary">
        <h3>Bullet Type Glossary</h3>
        <dl className="glossary-grid">
          {bulletTypes.map(bt => (
            <div key={bt} className="glossary-item">
              <dt>{bt}</dt>
              <dd>{BULLET_TYPE_GLOSSARY[bt] ?? 'No description available.'}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="ref-data-notes">
        <h3>Data Notes</h3>
        <ul>
          <li>All muzzle velocities assume standard barrel lengths (rifle: 24", carbine: 16", handgun: 4–5").</li>
          <li>Ballistic coefficients are G1 form factor values at standard sea-level atmosphere (59 °F, 29.92 inHg).</li>
          <li>The G1 drag model references a standard flat-base projectile. Boat-tail bullets may have higher G7 BCs; the G1 value is used here for universality.</li>
          <li>Subsonic loads (velocity &lt; 1116 fps) remain subsonic throughout flight and never experience transonic instability.</li>
          <li>Energy is computed as: E (ft·lbf) = v² × w(gr) / 450,240</li>
        </ul>
      </section>
    </div>
  );
}
