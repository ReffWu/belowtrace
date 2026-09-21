import type { Metadata } from "next";
import "./deck.css";
import calibration from "@/data/asrp-calibration.json";
import stats from "@/data/citywide-stats.json";
import { ASRP } from "@/lib/asrp";
import { PERMIT_WINDOW } from "@/lib/geo";
import { CityFigure } from "@/components/city-figure";
import { ComparisonChart, DistrictChart } from "@/components/about-visuals";

export const metadata: Metadata = {
  title: "BelowTrace Detroit · Buildathon deck",
  description: "Seven slides for the Venture 313 Buildathon showcase.",
};

const M = (n: number) => `$${(n / 1_000_000).toFixed(0)}M`;
const D = calibration.districtCounts as Record<string, number>;

export default function Deck() {
  return (
    <div className="deck">
      <Title />
      <Problem />
      <Solution />
      <ProductDemo />
      <ProductRoadmap />
      <Impact />
      <Market />
    </div>
  );
}

/* ─────────────────────────── 1 · Title ─────────────────────────── */

function Title() {
  return (
    <Slide dark n="1" section="">
      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icon-256.png" alt="" style={{ width: 62, height: 62, borderRadius: 14, display: "block" }} />
          <p className="eyebrow">Venture 313 Buildathon · Showcase, September 22, 2026</p>
        </div>

        <div>
          <h1 className="h1" style={{ maxWidth: 1240 }}>
            BelowTrace Detroit
          </h1>
          <p className="lede" style={{ marginTop: 26, fontSize: 32, maxWidth: 1180, color: "rgb(255 255 255 / 0.85)" }}>
            Detroit is spending {M(ASRP.total)} repairing sewer connections and does not publish where. I reverse engineered the
            City&rsquo;s selection model from its own open data, so any household can see whether that money is coming to them.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 64, alignItems: "end" }}>
          <div>
            <p className="eyebrow" style={{ fontSize: 15 }}>
              Impact pillar
            </p>
            <p style={{ marginTop: 10, fontSize: 32, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.14 }}>
              Reliable Transportation, Infrastructure &amp; Sustainability
            </p>
            <p className="small" style={{ marginTop: 10, color: "rgb(255 255 255 / 0.6)", maxWidth: 780 }}>
              The repair money is already appropriated. What is missing is any way for the household on top of it to see where it goes.
            </p>
          </div>
          <div>
            <p className="eyebrow" style={{ fontSize: 15 }}>
              Team
            </p>
            <p style={{ marginTop: 12, fontSize: 26, fontWeight: 800 }}>Reff Wu</p>
            <p className="small" style={{ color: "rgb(255 255 255 / 0.6)" }}>Solo build. Research, data, design, engineering.</p>
            <p className="small" style={{ marginTop: 14, color: "rgb(255 255 255 / 0.85)" }}>
              belowtrace.vercel.app
              <br />
              reffwu@gmail.com
            </p>
          </div>
        </div>
      </div>
    </Slide>
  );
}

/* ─────────────────────────── 2 · Problem ─────────────────────────── */

function Problem() {
  return (
    <Slide n="2" section="Problem Identified" rule="var(--stop)">
      <p className="eyebrow">2 · Problem</p>
      <h2 className="h2" style={{ marginTop: 12, maxWidth: 1420 }}>
        A homeowner with sewage in the basement cannot find out if the City is coming.
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 44, marginTop: 26 }}>
        <div>
          <div className="shot" style={{ height: 372 }}>
            <img src="/press/reddit-basement.jpg" alt="Sewage across a Detroit basement floor" />
          </div>
          <p className="credit">Photo: u/MarcRocket, r/Detroit, November 2025</p>
          <div className="card" style={{ marginTop: 16, borderColor: "var(--own)", borderLeftWidth: 8, padding: "18px 22px" }}>
            <p style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.34 }}>
              &ldquo;I go to homes with children&rsquo;s bedrooms in one corner of the basement and feces in the floor in the opposite
              corner. I&rsquo;ve called the city, I&rsquo;ve emailed and never got a reply.&rdquo;
            </p>
            <p className="tiny" style={{ marginTop: 8 }}>
              A contractor asking r/Detroit for any program he could refer families to. 184 upvotes, 55 replies, no working answer.
            </p>
          </div>
        </div>

        <div>
          <div style={{ display: "grid", gap: 20 }}>
            <Figure n="1 in 3" t="Detroit homes have a failing private sewer connection, by DWSD&rsquo;s own director." />
            <Figure n="336" t="water in basement reports to Detroit 311 every month, for 42 months straight." />
            <Figure n="68,000" t="households no City program will reach, against roughly 11,500 it can." tone="stop" />
          </div>

          <div className="card" style={{ marginTop: 24, padding: "20px 24px" }}>
            <p className="h3" style={{ fontSize: 23 }}>
              Why it is still unsolved
            </p>
            <p className="small" style={{ marginTop: 9, fontSize: 18 }}>
              The {M(ASRP.total)} alley program picks addresses itself and takes no applications. The {"$30,000"} repair grant requires
              proof of flood damage from June 2021, five years ago, and cannot pay for work already started. They sit in different
              departments, and the City&rsquo;s own guide states two different income limits on pages 3 and 10.
            </p>
          </div>
        </div>
      </div>
    </Slide>
  );
}

function Figure({ n, t, tone }: { n: string; t: string; tone?: "stop" }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
      <span className="stat figure-stat" style={{ fontSize: 54, color: tone === "stop" ? "var(--stop)" : "var(--ink)", width: 252, flexShrink: 0 }}>
        {n}
      </span>
      <span className="small" style={{ fontSize: 20 }} dangerouslySetInnerHTML={{ __html: t }} />
    </div>
  );
}

/* ─────────────────────────── 3 · Solution ─────────────────────────── */

function Solution() {
  return (
    <Slide n="3" section="Solution" rule="var(--brand)">
      <p className="eyebrow">3 · Solution</p>
      <h2 className="h2" style={{ marginTop: 12, maxWidth: 1330 }}>
        Rebuild the City&rsquo;s selection model from its own open data, and score every address against it.
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1.06fr 1fr", gap: 40, marginTop: 24, flex: 1, minHeight: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <Step
            n="1"
            t="Score the address"
            d="DWSD publishes four selection criteria and no list. I measure all four at one address: alley cave ins, block group income, council district, and distance to contracted work."
          />
          <Step
            n="2"
            t="Validate against reality"
            d={`Scored against the ${calibration.selected.n} alleys DWSD has actually contracted. Median basement flooding reports around them: ${calibration.water.median}, against ${calibration.comparison.waterMedian} around the City's earlier alley projects. Permutation test p < 0.0001.`}
          />
          <Step
            n="3"
            t="Then carry the call"
            d="There is no list to look up, so every answer ends in a phone call. Each number carries what to say, the three questions to ask, and what to write down before hanging up."
          />

          <div className="card" style={{ background: "var(--brand-tint)", borderColor: "transparent", marginTop: 4 }}>
            <p className="h3" style={{ fontSize: 24, color: "var(--brand-ink)" }}>
              Why anyone comes back
            </p>
            <p className="small" style={{ marginTop: 7, color: "var(--brand-ink)", fontSize: 18 }}>
              A backup returns with every storm, the program rolls out in phases nobody publishes, and grant rounds open and close. The
              same household checks again after the next storm, before signing a contract, and before a sale. Each check is a decision
              worth {"$15,000"} to {"$30,000"}.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
          <CityFigure height={352} />
          <div className="card" style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.28 }}>
              What the model found: the first round is not landing where basements flood.
            </p>
            <p className="tiny" style={{ marginTop: 7 }}>
              {stats.total.toLocaleString("en-US")} flooding reports since 2023 against the {calibration.selected.n} alleys contracted
              so far. 1.0% of the reports fall within 200 m of one, and four of seven council districts have none.
            </p>
          </div>
        </div>
      </div>
    </Slide>
  );
}

function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div style={{ display: "flex", gap: 20 }}>
      <span
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 999,
          background: "var(--ink)",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontWeight: 800,
          fontSize: 20,
        }}
      >
        {n}
      </span>
      <span>
        <span className="h3" style={{ display: "block", fontSize: 26 }}>
          {t}
        </span>
        <span className="small" style={{ display: "block", marginTop: 6 }}>
          {d}
        </span>
      </span>
    </div>
  );
}

/* ─────────────────────────── 4 · Product ─────────────────────────── */

function ProductDemo() {
  return (
    <Slide n="4" section="Product Demo" rule="var(--go)">
      <p className="eyebrow">4 · Product demo</p>
      <h2 className="h2" style={{ marginTop: 12, maxWidth: 1180 }}>
        Two Detroit addresses, three miles apart. Opposite answers, in one tap.
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "292px 292px 1fr", gap: 28, marginTop: 22, alignItems: "start" }}>
        <Phone src="/deck/framed-green.png" alt="BelowTrace showing a green covered verdict for 7806 Mettetal St" />
        <Phone src="/deck/framed-red.png" alt="BelowTrace showing a red not coming verdict for 5017 W Outer Dr" />

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
          <Live
            tone="go"
            mark="&#10003;"
            who="7806 Mettetal St · District 7"
            what="Do not pay for this yet."
            why="Contracted work 213 m away. If their camera finds your connection, it is repaired at no cost to you."
          />
          <Live
            tone="stop"
            mark="&#10005;"
            who="5017 W Outer Dr · District 2"
            what="Nothing is coming to this address."
            why="No alley in this district is in the first round. Plan as if you are on your own."
          />

          <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p className="h3" style={{ fontSize: 23 }}>
              What every address already returns
            </p>
            <ul style={{ marginTop: 11, display: "grid", gap: 8 }}>
              {[
                "Six pipe segments, from the floor drain to the regional system, with the owner of each",
                "The alley program reading, with all five signals and the one that is not public",
                "Every City program checked, with the sequencing trap called out before you sign",
                "Scripted phone calls: what to say, three questions, what to write down",
                "Permit history for the private line, and the 45 day claim letter for both agencies",
              ].map((s) => (
                <li key={s} className="small" style={{ display: "flex", gap: 11, fontSize: 18 }}>
                  <span style={{ color: "var(--go)", fontWeight: 900 }}>&#10003;</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Slide>
  );
}

function ProductRoadmap() {
  return (
    <Slide n="5" section="Product Demo and Roadmap" rule="var(--go)">
      <p className="eyebrow">4 · How it works, and what comes next</p>
      <h2 className="h2" style={{ marginTop: 14, maxWidth: 1240 }}>
        The reading is measured against the alleys the City actually chose.
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "0.86fr 1fr 1.02fr", gap: 30, marginTop: 40, alignItems: "start" }}>
        <div style={{ display: "flex", gap: 18, minHeight: 0 }}>
          <Surface src="/deck/framed-3d.png" cap="What is under the house. The private line is never drawn." />
          <Surface src="/deck/framed-records.png" cap="Every 311 report and sewer project on the block." />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
          <ComparisonChart />
          <p className="tiny">
            I checked every ArcGIS service the City publishes, all 782. The{" "}
            {ASRP.knownDefectPoints.toLocaleString("en-US")}+ failed connection points behind the selection are in none of them.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
          <div className="card" style={{ padding: "20px 24px" }}>
            <p className="h3" style={{ fontSize: 23 }}>
              Roadmap
            </p>
            <div style={{ display: "grid", gap: 11, marginTop: 12 }}>
              {[
                ["Next", "A verified list of contractors who accept state emergency relief. Michigan publishes none, so every household finds theirs by calling around."],
                ["Then", "Spanish and Arabic. The City already publishes these programs in both."],
                ["Later", "An alert when a contract reaches your alley, and a multi case view for intake staff."],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 14 }}>
                  <span style={{ minWidth: 62, fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--own)", paddingTop: 3 }}>
                    {k}
                  </span>
                  <span className="small" style={{ fontSize: 18 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: "var(--warn-tint)", borderColor: "transparent", padding: "18px 22px" }}>
            <p className="h3" style={{ fontSize: 21, color: "#6b3d00" }}>
              The rough edges, named rather than hidden
            </p>
            <p className="small" style={{ marginTop: 8, color: "#6b3d00", fontSize: 17 }}>
              First round of a four year program: {calibration.selected.n} alleys against roughly{" "}
              {ASRP.connections.toLocaleString("en-US")} connections. DWSD&rsquo;s camera evidence is not public, and the report says so
              on every address. 311 records are requests, not confirmed incidents.
            </p>
          </div>
        </div>
      </div>
    </Slide>
  );
}

function Surface({ src, cap }: { src: string; cap: string }) {
  return (
    <figure style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <img src={src} alt="" style={{ display: "block", width: 172, height: "auto", filter: "drop-shadow(0 14px 22px rgb(21 33 43 / 0.24))" }} />
      <figcaption className="tiny" style={{ marginTop: 7, lineHeight: 1.3 }}>
        {cap}
      </figcaption>
    </figure>
  );
}

/** Screenshots already composited into an iPhone Air frame by the appshot toolchain. */
function Phone({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ display: "block", width: 292, height: "auto", filter: "drop-shadow(0 22px 34px rgb(21 33 43 / 0.28))" }}
    />
  );
}

function Live({ tone, mark, who, what, why }: { tone: "go" | "stop"; mark: string; who: string; what: string; why: string }) {
  return (
    <div style={{ borderRadius: 20, overflow: "hidden", background: tone === "go" ? "var(--go)" : "var(--stop)", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 15, padding: "15px 22px" }}>
        <span
          style={{
            width: 46,
            height: 46,
            flexShrink: 0,
            borderRadius: 14,
            background: "rgb(255 255 255 / 0.2)",
            display: "grid",
            placeItems: "center",
            fontSize: 24,
            fontWeight: 900,
          }}
        >
          {mark}
        </span>
        <span>
          <span style={{ display: "block", fontSize: 14, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.75 }}>
            {who}
          </span>
          <span style={{ display: "block", fontSize: 25, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 3, lineHeight: 1.15 }}>{what}</span>
        </span>
      </div>
      <p style={{ background: "rgb(0 0 0 / 0.18)", padding: "13px 22px 15px", fontSize: 17, lineHeight: 1.4, opacity: 0.92 }}>{why}</p>
    </div>
  );
}

/* ─────────────────────────── 5 · Impact ─────────────────────────── */

function Impact() {
  return (
    <Slide n="6" section="Impact to Detroit If Adopted" rule="var(--own)">
      <p className="eyebrow">5 · Impact to Detroit if adopted</p>
      <h2 className="h2" style={{ marginTop: 14, maxWidth: 1240 }}>
        Both groups lose money today. Neither one can tell which group it is in.
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 24 }}>
        <div className="card" style={{ borderColor: "var(--go)" }}>
          <p className="stat" style={{ fontSize: 58, color: "var(--go)" }}>11,500</p>
          <p className="h3" style={{ marginTop: 10, fontSize: 23 }}>
            households the City can reach over four years
          </p>
          <p className="small" style={{ marginTop: 10 }}>
            They stop paying for a repair already contracted. Detroit budgets about {"$"}
            {ASRP.perConnection.toLocaleString("en-US")} per connection, and a household that pays privately the month before the
            crew arrives never gets that back.
          </p>
        </div>

        <div className="card" style={{ borderColor: "var(--stop)" }}>
          <p className="stat" style={{ fontSize: 58, color: "var(--stop)" }}>68,000</p>
          <p className="h3" style={{ marginTop: 10, fontSize: 23 }}>
            households no program will reach
          </p>
          <p className="small" style={{ marginTop: 10 }}>
            They stop waiting for a notification that is never sent. Every year adds sewage exposure, mold, and lost property value
            to a repair that only gets more expensive.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
          <div className="card" style={{ padding: "20px 24px" }}>
            <p className="h3" style={{ fontSize: 23 }}>
              And a public check on {M(ASRP.total)}
            </p>
            <p className="small" style={{ marginTop: 8 }}>
              Three years and most of the budget are still to be allocated, so publishing this now is the only moment it can change
              anything.
            </p>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <DistrictChart compact />
          </div>
        </div>

        <div className="card" style={{ background: "var(--deep)", color: "#fff", borderColor: "transparent" }}>
          <p className="eyebrow" style={{ color: "var(--glow)", fontSize: 15 }}>
            Beyond Detroit
          </p>
          <p className="h3" style={{ marginTop: 10, fontSize: 25, color: "#fff" }}>
            The method travels. The program rules are configuration.
          </p>
          <p className="small" style={{ marginTop: 10, color: "rgb(255 255 255 / 0.75)", fontSize: 18 }}>
            Homeowners own their sewer laterals in most American cities, and the three datasets this runs on exist almost everywhere:
            311 requests, capital project phases, and census income.
          </p>
          <p className="small" style={{ marginTop: 10, color: "rgb(255 255 255 / 0.75)", fontSize: 18 }}>
            What another city changes is the list of programs and the criteria of whichever agency holds the money. What it does not
            change is the approach: take the criteria an agency publishes, measure them against the work it has contracted, and give a
            household the answer.
          </p>
        </div>
      </div>
    </Slide>
  );
}

/* ─────────────────────────── 6 · Market ─────────────────────────── */

function Market() {
  return (
    <Slide n="7" section="Market / Opportunity" rule="var(--brand)">
      <p className="eyebrow">6 · Market and opportunity</p>
      <h2 className="h2" style={{ marginTop: 14, maxWidth: 1240 }}>
        The first user is not the homeowner. It is whoever is standing in the basement with them.
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28, marginTop: 24 }}>
        <Col
          k="First users"
          body="The people who reach these households weekly and already ask this question for them: plumbers and waterproofing crews on service calls, community organizations doing repair intake, and council district staff. One contractor touches twenty households to find one who can pay. I reach them where they already ask."
        />
        <Col
          k="Size"
          body={`About one in three Detroit homes has a failing sewer connection, by DWSD's director. Detroit 311 logs 336 water in basement reports a month, and has for 42 months. ${PERMIT_WINDOW.total.toLocaleString("en-US")} private sewer permits were pulled between ${PERMIT_WINDOW.from} and ${PERMIT_WINDOW.to}, of which 1,288 were backwater valves bought by households protecting themselves.`}
        />
        <Col
          k="Sustainability"
          body="Every input is public open data and the app is static, with no AI at runtime and no accounts, so it costs close to nothing to run. The City's own repair policy already pays community organizations to do outreach and intake, which is the buyer shaped hole a screening tool fits. Nobody has agreed to buy it yet, and I say so."
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 32, marginTop: 22, flex: 1, minHeight: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ borderColor: "var(--own)", borderLeftWidth: 8 }}>
            <p className="h3" style={{ fontSize: 24 }}>
              The revenue I refuse
            </p>
            <p className="small" style={{ marginTop: 8 }}>
              The obvious model is selling leads to contractors. I will not. The most valuable sentence this product says is
              &ldquo;do not pay for this yet&rdquo;, and it is worth nothing the moment anyone is paid when you do.
            </p>
          </div>

          <div className="card">
            <p className="h3" style={{ fontSize: 24 }}>
              Early signal, stated honestly
            </p>
            <p className="small" style={{ marginTop: 8 }}>
              What is real: the measurement reproduces from one script, and it found something no published City document shows.
              What is not: no resident has been observed using it to decide, and no agency has agreed to receive it. Those are the
              next things to find out, not things to claim.
            </p>
          </div>
        </div>

        <div className="card" style={{ background: "var(--ink)", color: "#fff", borderColor: "transparent", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <p className="eyebrow" style={{ color: "var(--glow)", fontSize: 15 }}>
              The ask
            </p>
            <p className="h3" style={{ marginTop: 14, fontSize: 27, color: "#fff", lineHeight: 1.25 }}>
              One community partner running repair intake, and thirty minutes with DWSD.
            </p>
            <p className="small" style={{ marginTop: 12, color: "rgb(255 255 255 / 0.72)" }}>
              The partner tells me whether this saves an intake worker time. DWSD tells me whether the reading is right, and whether
              they would publish the alley list themselves. Either answer improves the tool.
            </p>
          </div>
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 26, fontWeight: 800 }}>belowtrace.vercel.app</p>
            <p className="small" style={{ color: "rgb(255 255 255 / 0.72)" }}>Reff Wu · reffwu@gmail.com · open source, MIT</p>
          </div>
        </div>
      </div>
    </Slide>
  );
}

function Col({ k, body }: { k: string; body: string }) {
  return (
    <div>
      <p className="eyebrow" style={{ fontSize: 15 }}>
        {k}
      </p>
      <p className="small" style={{ marginTop: 10, fontSize: 20 }}>
        {body}
      </p>
    </div>
  );
}

/* ─────────────────────────── shell ─────────────────────────── */

function Slide({
  children,
  n,
  section,
  dark,
  rule,
}: {
  children: React.ReactNode;
  n: string;
  section: string;
  dark?: boolean;
  rule?: string;
}) {
  return (
    <section className={`slide${dark ? " slide--dark" : ""}`}>
      {rule && <span className="slide__rule" style={{ background: rule }} aria-hidden="true" />}
      <div className="slide__body">{children}</div>
      <div className="slide__foot">
        <span>BelowTrace Detroit</span>
        <span>{section}</span>
        <span>
          {n} / 7
        </span>
      </div>
    </section>
  );
}
