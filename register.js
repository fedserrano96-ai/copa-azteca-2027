// Saves Copa Azteca registrations to Airtable.
// Needs one environment variable in Vercel: AIRTABLE_TOKEN
// (an Airtable personal access token with data.records:write on the Copa Azteca 2027 base).

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appDlwD5Sd9PLzNxH";
const TABLE_ID = process.env.AIRTABLE_TABLE_ID || "tblP0JJFJM3B9o6f4";

const POSITIONS = ["attack", "midfield", "defense", "faceoff", "goalie"];
const LEVELS = ["competitive", "intermediate", "recreational"];
const EXPERIENCE = ["college", "club", "highschool", "new"];
const HOTEL = ["yes", "maybe", "no"];

const clean = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const pick = (v, list) => (list.includes(v) ? v : undefined);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let d = req.body;
  if (typeof d === "string") { try { d = JSON.parse(d); } catch { d = null; } }
  if (!d || typeof d !== "object") return res.status(400).json({ error: "Invalid request" });

  // Spam checks: hidden honeypot field filled in, or form submitted impossibly fast.
  if (clean(d.website) || (typeof d.elapsedMs === "number" && d.elapsedMs < 2500)) {
    return res.status(200).json({ ok: true });
  }

  const isAgent = d.registrationType === "free agent";
  const email = clean(d.email, 200);
  const contact = clean(d.contact, 120);
  const team = clean(d.team, 120);
  const roster = Number(d.roster);
  const errors = [];

  if (!contact) errors.push("contact");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email");
  if (!clean(d.city)) errors.push("city");
  if (!clean(d.country)) errors.push("country");
  if (d.terms !== true) errors.push("terms");
  if (isAgent) {
    if (!pick(d.position, POSITIONS)) errors.push("position");
  } else {
    if (!team) errors.push("team");
    if (!(roster >= 10 && roster <= 20)) errors.push("roster");
  }
  if (errors.length) return res.status(400).json({ error: "Missing or invalid fields", fields: errors });

  if (!process.env.AIRTABLE_TOKEN) {
    console.error("AIRTABLE_TOKEN is not set");
    return res.status(500).json({ error: "Registration is temporarily unavailable" });
  }

  const fields = {
    "Registrant": isAgent ? contact : team,
    "Type": isAgent ? "Free agent" : "Full team",
    "Payment status": "Pending",
    "Contact name": contact,
    "Email": email,
    "Phone": clean(d.phone, 40) || undefined,
    "City": clean(d.city, 120),
    "Country": clean(d.country, 120),
    "Hotel interest": pick(d.hotel, HOTEL),
    "Heard about us": clean(d.heard, 200) || undefined,
    "Notes": clean(d.notes, 3000) || undefined,
    "Language": d.language === "es" ? "es" : "en",
    "Terms accepted": true,
    "Submitted at": new Date().toISOString(),
  };
  if (isAgent) {
    fields["Position"] = pick(d.position, POSITIONS);
    fields["Experience"] = pick(d.experience, EXPERIENCE);
    fields["Play with"] = clean(d.playWith, 200) || undefined;
  } else {
    fields["Team name"] = team;
    fields["Roster size"] = roster;
    fields["Team level"] = pick(d.level, LEVELS);
  }
  Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);

  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });
    if (!r.ok) {
      console.error("Airtable error", r.status, await r.text());
      return res.status(502).json({ error: "Could not save registration" });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Airtable request failed", e);
    return res.status(502).json({ error: "Could not save registration" });
  }
}
