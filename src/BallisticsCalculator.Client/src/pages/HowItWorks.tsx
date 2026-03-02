import './HowItWorks.css';

export default function HowItWorks() {
  return (
    <div className="hiw-page">
      <div className="hiw-hero">
        <h2>How the Trajectory Calculator Works</h2>
        <p>
          A guided walkthrough of the physics, math, and engineering behind every trajectory plot —
          from the picnic table to the target.
        </p>
      </div>

      <nav className="hiw-toc" aria-label="Table of contents">
        <strong>On this page</strong>
        <ol>
          <li><a href="#setup">1. Shot Setup</a></li>
          <li><a href="#zeroing">2. Zeroing — Finding the Bore Angle</a></li>
          <li><a href="#rk4">3. RK4 Trajectory Integration</a></li>
          <li><a href="#drag">4. G1 Drag Model &amp; Ballistic Coefficient</a></li>
          <li><a href="#50yard">5. The 50-Yard Reference Line</a></li>
          <li><a href="#chart">6. Reading the Trajectory Chart</a></li>
          <li><a href="#glossary">7. Glossary</a></li>
        </ol>
      </nav>

      {/* ── Section 1: Shot Setup ── */}
      <section className="hiw-section" id="setup">
        <h3>1. Shot Setup</h3>
        <p>
          Every trajectory is computed from a fixed, real-world position: a shooter seated at a
          <strong> picnic table</strong>, with the muzzle resting 30 inches (76 cm) above the ground.
        </p>
        <div className="hiw-diagram">
          <pre>{`
 Scope / Line of Sight ─────────────────────────────────────────► (target)
   ↕ 1.5" sight height
 Bore / Bullet Path  ───────────────────────────── ↗ (bore elevated slightly)
                     ↑
               30" shot height
                     |
   ══════════════════╧═════════════════ (ground / picnic table)
`}</pre>
        </div>
        <ul>
          <li><strong>Shot height:</strong> 30 inches — the muzzle of the firearm above the ground.</li>
          <li><strong>Sight height:</strong> 1.5 inches — the line-of-sight sits 1.5" above the bore axis (typical scope/rail height).</li>
          <li>
            Because the scope sits <em>above</em> the bore, the bore must be angled slightly
            <em> upward</em> for the bullet to intersect the line of sight at the zero distance.
            This angle is called the <strong>bore elevation angle</strong>.
          </li>
        </ul>
        <div className="hiw-callout hiw-callout-info">
          <strong>Why 30 inches?</strong> It represents a common, consistent field position for hunters
          and recreational shooters — close to a typical seated shooting height from a rest. It also
          means the bullet begins below the line of sight, crosses it twice (once rising, once falling),
          which gives the characteristic "arch" seen on the chart.
        </div>
      </section>

      {/* ── Section 2: Zeroing ── */}
      <section className="hiw-section" id="zeroing">
        <h3>2. Zeroing — Finding the Bore Angle</h3>
        <p>
          "Zeroed at 100 yards" means the bullet path crosses the line of sight at exactly 100 yards.
          To achieve this, the calculator must find the precise upward bore angle that makes the bullet
          arrive at zero height (relative to LOS) at that distance.
        </p>
        <h4>Binary Search (50 iterations)</h4>
        <p>
          There is no closed-form solution for the bore angle because drag is non-linear. Instead,
          the engine uses a <strong>binary search</strong>:
        </p>
        <div className="hiw-steps">
          <div className="hiw-step">
            <span className="step-num">1</span>
            <span>Bracket the answer: try a very small angle (bullet falls short) and a large angle (bullet flies over). The true answer lies between them.</span>
          </div>
          <div className="hiw-step">
            <span className="step-num">2</span>
            <span>Pick the midpoint angle, simulate the full trajectory, and check where the bullet crosses the LOS.</span>
          </div>
          <div className="hiw-step">
            <span className="step-num">3</span>
            <span>If the bullet crosses too close, increase the angle; if too far, decrease it. Repeat.</span>
          </div>
          <div className="hiw-step">
            <span className="step-num">4</span>
            <span>After 50 iterations the answer converges to sub-milliradian precision.</span>
          </div>
        </div>
        <p>
          The result is the <strong>bore elevation angle in MOA</strong> (Minutes of Angle), shown in
          the trajectory info panel. 1 MOA ≈ 1.047 inches per 100 yards.
        </p>
      </section>

      {/* ── Section 3: RK4 ── */}
      <section className="hiw-section" id="rk4">
        <h3>3. RK4 Trajectory Integration</h3>
        <p>
          With the bore angle known, the engine simulates the bullet's flight using the
          <strong> 4th-order Runge-Kutta (RK4)</strong> numerical integration method — the same
          technique used in aerospace and ballistic simulation software.
        </p>
        <h4>State Vector</h4>
        <p>At every moment, the bullet's state is described by four values:</p>
        <div className="hiw-equation-block">
          <p><strong>x</strong> — horizontal position (downrange, feet)</p>
          <p><strong>y</strong> — vertical position (height, feet)</p>
          <p><strong>vx</strong> — horizontal velocity (fps)</p>
          <p><strong>vy</strong> — vertical velocity (fps)</p>
        </div>
        <h4>Forces Acting on the Bullet</h4>
        <ul>
          <li>
            <strong>Gravity:</strong> constant downward acceleration of 32.174 ft/s² (g). This gives
            the bullet its arc shape — without drag, the trajectory would be a perfect parabola.
          </li>
          <li>
            <strong>Aerodynamic drag:</strong> always opposing velocity, proportional to the square
            of speed, and scaled by the drag coefficient (Cd) at the current Mach number.
          </li>
        </ul>
        <div className="hiw-equation-block">
          <p className="eq-label">Drag deceleration magnitude:</p>
          <code>a_drag = (ρ × v² × Cd) / (2 × BC)</code>
          <ul className="eq-vars">
            <li><em>ρ</em> = air density (0.002378 slugs/ft³ at sea level, 59 °F)</li>
            <li><em>v</em> = total bullet speed (fps)</li>
            <li><em>Cd</em> = drag coefficient from the G1 table at the current Mach number</li>
            <li><em>BC</em> = ballistic coefficient (slugs/ft²), converted from lb/in² × 144/g</li>
          </ul>
        </div>
        <h4>Time Step</h4>
        <p>
          The simulation advances in steps of <strong>0.001 seconds</strong>. At each step, RK4
          evaluates the equations of motion four times (k1–k4) and combines them with weights
          1/6, 1/3, 1/3, 1/6 for a weighted average. This gives much higher accuracy than a simple
          forward-Euler step and avoids the error accumulation seen in less sophisticated methods.
        </p>
        <p>
          Output points are sampled at <strong>1-yard intervals</strong> by interpolating the
          continuous time-domain solution, giving a smooth trajectory curve up to the maximum range.
        </p>
      </section>

      {/* ── Section 4: Drag Model ── */}
      <section className="hiw-section" id="drag">
        <h3>4. G1 Drag Model &amp; Ballistic Coefficient</h3>
        <p>
          Drag varies with velocity in a complex, non-linear way — especially near the speed of sound
          (transonic region, Mach 0.8–1.2). The calculator uses the <strong>G1 standard drag model</strong>,
          which is the most widely published BC standard for sporting ammunition.
        </p>
        <h4>The Cd Lookup Table</h4>
        <p>
          A 76-entry table maps Mach number → drag coefficient (Cd). Between table entries,
          the engine uses linear interpolation. The table covers Mach 0 through Mach 5 and
          captures the characteristic drag rise near Mach 1.
        </p>
        <div className="hiw-diagram hiw-drag-curve">
          <pre>{`
Cd
 ▲
0.55 │                    ╭──────╮
0.50 │                   ╱        ╲
0.45 │                  ╱          ╲
0.40 │                ╱             ╲──────────────
0.35 │──────────────╱
0.30 │
     └───────────────────────────────────────────►  Mach
         0.5       1.0       1.5       2.0       3.0
              (subsonic) (transonic) (supersonic)
`}</pre>
        </div>
        <h4>Ballistic Coefficient (BC)</h4>
        <p>
          The BC encodes how efficiently a specific bullet overcomes drag relative to the G1 standard
          projectile. <strong>Higher BC = less drag = flatter trajectory and more retained velocity.</strong>
        </p>
        <div className="hiw-bc-examples">
          <div className="bc-example">
            <span className="bc-label">.380 ACP 95gr FMJ</span>
            <div className="bc-bar-demo" style={{ width: '11%' }} aria-hidden="true" />
            <span className="bc-num">BC 0.119</span>
          </div>
          <div className="bc-example">
            <span className="bc-label">.308 Win 168gr BTHP</span>
            <div className="bc-bar-demo" style={{ width: '42%' }} aria-hidden="true" />
            <span className="bc-num">BC 0.462</span>
          </div>
          <div className="bc-example">
            <span className="bc-label">6.5 CM 140gr ELD Match</span>
            <div className="bc-bar-demo" style={{ width: '53%' }} aria-hidden="true" />
            <span className="bc-num">BC 0.585</span>
          </div>
          <div className="bc-example">
            <span className="bc-label">.50 BMG 750gr A-MAX</span>
            <div className="bc-bar-demo" style={{ width: '95%' }} aria-hidden="true" />
            <span className="bc-num">BC 1.050</span>
          </div>
        </div>
        <p>
          BC is stored in the database as lb/in² (pounds per square inch) and converted internally
          to slugs/ft² for use in the drag equation:
        </p>
        <div className="hiw-equation-block">
          <code>BC (slugs/ft²) = BC (lb/in²) × 144 / 32.174</code>
        </div>
        <p>
          The factor 144 converts in² → ft², and 32.174 converts lb-force → slugs (mass).
        </p>
      </section>

      {/* ── Section 5: 50-yard reference ── */}
      <section className="hiw-section" id="50yard">
        <h3>5. The 50-Yard Reference Line</h3>
        <p>
          One of the most useful practical facts for a field shooter is the
          <strong> "sight-in at 50, be on at 100"</strong> rule — and this calculator shows exactly
          when it applies.
        </p>
        <h4>How it works</h4>
        <p>
          When a rifle is zeroed at 100 yards, the bullet path crosses the line of sight twice:
        </p>
        <ol>
          <li>
            <strong>Near zero (~50 yd):</strong> The bullet, rising from below, crosses LOS on its
            way up. For many cartridges, this first crossing falls very close to 50 yards.
          </li>
          <li>
            <strong>Far zero (100 yd):</strong> The bullet crosses LOS again on its way down.
          </li>
        </ol>
        <div className="hiw-diagram">
          <pre>{`
 Height (in)
  ▲
+2 │           ╭────────╮
   │          ╱    Peak  ╲
 0 │─────────╳────────────╳─────────────────────────  LOS
   │        ╱ ↑            ↑ ╲
-2 │       ╱  ~50 yd      100 yd╲
   │      ╱                      ╲
-6 │─────╱                        ╲──────────
   └────────────────────────────────────────► Range
     0   25   50   75  100  125  150  200 yd
`}</pre>
        </div>
        <p>
          The calculator finds the <strong>height at exactly 50 yards</strong> via linear interpolation
          of the trajectory points. It then scans beyond the 100-yard zero to find the
          <strong> second crossing range</strong> — the point where the bullet is again at the same
          height as it was at 50 yards (i.e. on its way back down through that height level).
        </p>
        <div className="hiw-callout hiw-callout-tip">
          <strong>Practical tip:</strong> If your bullet is +0.95" high at 50 yards, it will be
          approximately on at 100 yards. This means you can confirm your 100-yard zero with a quick
          50-yard shot — very handy when a 100-yard range isn't available.
        </div>
      </section>

      {/* ── Section 6: Reading the chart ── */}
      <section className="hiw-section" id="chart">
        <h3>6. Reading the Trajectory Chart</h3>
        <p>The chart plots <strong>bullet height (inches above/below LOS)</strong> vs. <strong>downrange distance</strong>.</p>

        <div className="hiw-chart-legend">
          <div className="legend-item">
            <span className="legend-line legend-blue" />
            <span><strong>Trajectory curve</strong> — the bullet's path relative to line of sight</span>
          </div>
          <div className="legend-item">
            <span className="legend-line legend-gray" />
            <span><strong>Line of Sight (LOS)</strong> — height = 0; zero reference</span>
          </div>
          <div className="legend-item">
            <span className="legend-line legend-orange legend-dashed" />
            <span><strong>Height at 50 yd</strong> — horizontal dashed line at the bullet's height at 50 yards</span>
          </div>
          <div className="legend-item">
            <span className="legend-line legend-green legend-dashed" />
            <span><strong>2nd crossing</strong> — vertical dashed line marking where the bullet returns to 50-yd height</span>
          </div>
        </div>

        <h4>Trajectory Info Panel</h4>
        <table className="hiw-info-table">
          <caption className="sr-only">Trajectory information panel field descriptions</caption>
          <tbody>
            <tr>
              <th scope="row">Cartridge</th>
              <td>The selected load name from the database.</td>
            </tr>
            <tr>
              <th scope="row">Muzzle Velocity</th>
              <td>Initial bullet speed at the muzzle (fps or m/s).</td>
            </tr>
            <tr>
              <th scope="row">Zero Range</th>
              <td>Distance where the bullet crosses LOS — default 100 yd / 91.4 m.</td>
            </tr>
            <tr>
              <th scope="row">Bore Elevation</th>
              <td>How much the bore is tilted above LOS, in MOA. 1 MOA ≈ 1.047" per 100 yd.</td>
            </tr>
            <tr>
              <th scope="row">Height at 50 yd</th>
              <td>Bullet height above LOS at 50 yards — the practical "check zero" number.</td>
            </tr>
            <tr>
              <th scope="row">2nd Crossing Range</th>
              <td>Range where the bullet returns to its 50-yd height on descent.</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── Section 7: Glossary ── */}
      <section className="hiw-section" id="glossary">
        <h3>7. Glossary</h3>
        <dl className="hiw-glossary">
          <div className="gloss-entry">
            <dt>BC — Ballistic Coefficient (G1)</dt>
            <dd>
              A dimensionless number comparing a bullet's drag to that of the G1 standard projectile
              (a 1-lb flat-base standard bullet, 1" diameter). Higher BC = less drag = flatter trajectory.
              Typical range: 0.10 (short handgun) to 1.05 (.50 BMG A-MAX).
            </dd>
          </div>
          <div className="gloss-entry">
            <dt>Bore Elevation Angle</dt>
            <dd>
              The upward tilt of the barrel bore relative to the line of sight, measured in MOA.
              Required because the scope sits above the bore — without this angle, the bullet would
              always strike below the aim point.
            </dd>
          </div>
          <div className="gloss-entry">
            <dt>Drop</dt>
            <dd>
              The total distance the bullet falls below the bore axis (not LOS) due to gravity, measured
              in inches or cm. Drop increases with range and is greater for slower, low-BC bullets.
            </dd>
          </div>
          <div className="gloss-entry">
            <dt>Energy (ft·lbf)</dt>
            <dd>
              Kinetic energy of the bullet: E = mv²/2, expressed in foot-pounds-force.
              In practical terms: <code>E = v² × weight(gr) / 450,240</code>. Commonly used to assess
              terminal effectiveness and hunting suitability.
            </dd>
          </div>
          <div className="gloss-entry">
            <dt>G1 Drag Model</dt>
            <dd>
              The original and most widely-used ballistic standard, based on a flat-base, round-nose
              projectile. G1 BCs are published by almost all ammunition manufacturers. The G7 model
              (boat-tail standard) is more accurate for long-range boat-tail bullets but requires
              G7 BCs, which are less commonly published.
            </dd>
          </div>
          <div className="gloss-entry">
            <dt>LOS — Line of Sight</dt>
            <dd>
              The straight line from the shooter's eye (or scope) to the target. All height values
              in the chart are measured relative to LOS. Positive = above LOS, negative = below LOS.
            </dd>
          </div>
          <div className="gloss-entry">
            <dt>Mach Number</dt>
            <dd>
              Bullet speed expressed as a multiple of the local speed of sound (1116 ft/s at 59 °F,
              sea level). Mach 1 = ~1116 fps. Drag behavior changes dramatically near Mach 1
              (the transonic region, Mach 0.8–1.2), where shock waves form and drag spikes sharply.
            </dd>
          </div>
          <div className="gloss-entry">
            <dt>MOA — Minute of Angle</dt>
            <dd>
              An angular unit equal to 1/60th of a degree. At 100 yards, 1 MOA ≈ 1.047 inches.
              Commonly used to specify scope adjustments and shot groups. The bore elevation angle
              is displayed in MOA because it corresponds directly to the scope clicks needed to
              achieve the zero.
            </dd>
          </div>
          <div className="gloss-entry">
            <dt>RK4 — Runge-Kutta 4th Order</dt>
            <dd>
              A numerical method for solving differential equations. At each time step it computes
              four estimates of the next state (k1, k2, k3, k4) and combines them with weights
              1/6, 2/6, 2/6, 1/6. This 4th-order accuracy means errors shrink with the 4th power
              of the step size — very efficient and accurate for trajectory simulation.
            </dd>
          </div>
          <div className="gloss-entry">
            <dt>Shot Height</dt>
            <dd>
              Height of the muzzle above the ground at the moment of firing. Default: 30 inches
              (picnic table rest). All height values in the trajectory are relative to the ground
              level + shot height origin.
            </dd>
          </div>
          <div className="gloss-entry">
            <dt>Sight Height</dt>
            <dd>
              The vertical distance between the center of the bore and the center of the optic or
              iron sights. Default: 1.5 inches (typical for a scope mounted on a Picatinny rail).
              A taller mount increases the bore-to-LOS offset and requires more bore elevation,
              which widens the trajectory arc below LOS at close and long range.
            </dd>
          </div>
          <div className="gloss-entry">
            <dt>Time of Flight (TOF)</dt>
            <dd>
              Elapsed time since the bullet left the muzzle, in seconds. Longer TOF at a given range
              means the bullet is slower (more drag or lower MV) and has fallen further due to gravity
              acting over a longer period.
            </dd>
          </div>
          <div className="gloss-entry">
            <dt>Transonic Region</dt>
            <dd>
              The velocity range from approximately Mach 0.8 to Mach 1.2. As a bullet slows through
              this zone, the drag coefficient spikes and the flight can become less stable (yaw, precession).
              Long-range precision shooters try to keep bullets supersonic (Mach &gt; 1.2) throughout
              the engagement range to avoid transonic instability.
            </dd>
          </div>
          <div className="gloss-entry">
            <dt>Zero Range</dt>
            <dd>
              The range at which the bullet path crosses the line of sight on its way down (the far
              zero). Default: 100 yards. At the zero range, point of aim = point of impact. Beyond
              the zero, the bullet drops below LOS; inside the zero (past the near crossing), the
              bullet is also below LOS.
            </dd>
          </div>
        </dl>
      </section>

      <div className="hiw-footer-note">
        <p>
          All calculations assume <strong>standard atmosphere</strong>: 59 °F (15 °C), 29.92 inHg,
          sea level. No wind, no spin drift, no Coriolis effect. For long-range work in non-standard
          conditions, a full six-degree-of-freedom (6DOF) solver with atmospheric correction is recommended.
        </p>
      </div>
    </div>
  );
}
