import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMapEvents } from "react-leaflet";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = url && key ? createClient(url, key) : null;

// NYC view only sets the initial map position; it does not imply reports exist.
const NYC_CENTER = [40.725, -73.99];

function LocationPicker({ onPick }) {
  useMapEvents({
    click(event) {
      // User chooses a map point. Do not request or store device GPS.
      onPick([event.latlng.lat, event.latlng.lng]);
    },
  });
  return null;
}

export default function App() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const configured = Boolean(supabase);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function loadReports() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("public_reports")
      .select("id, venue_label, incident_month, latitude, longitude, summary")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setStatus("Could not load public reports. Check your Supabase setup.");
    } else {
      setReports(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { loadReports(); }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");

    if (!supabase) {
      setStatus("Connect Supabase first using the setup steps in README.md.");
      return;
    }
    if (!selected) {
      setStatus("Click the map to select an approximate venue location first.");
      return;
    }
    if (!venue.trim() || !date) {
      setStatus("Enter a venue and approximate date.");
      return;
    }

    // Keep submissions private and pending. They do not create public pins.
    const incidentMonth = `${date.slice(0, 7)}-01`;
    const { error } = await supabase.from("report_submissions").insert({
      venue_name: venue.trim(),
      incident_month: incidentMonth,
      latitude: selected[0],
      longitude: selected[1],
      details: details.trim() || null,
      status: "pending",
    });

    if (error) {
      setStatus("Submission failed. Please try again later.");
      return;
    }

    setVenue("");
    setDate("");
    setDetails("");
    setSelected(null);
    setStatus("Submitted for review. It is not public unless a moderator approves a separate, anonymized listing.");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="eyebrow">COMMUNITY SAFETY PROJECT · NYC</div>
        <div className="brand-row">
          <div>
            <h1>Nightlife Safety Map</h1>
            <p className="lede">A community-led map of user-reported suspected drink-spiking incidents.</p>
          </div>
          <span className="city-tag">NEW YORK CITY</span>
        </div>
      </header>

      <main className="layout">
        <section className="map-panel" aria-label="Public reports map">
          <div className="map-key">
            <span className="dot" /> Approved community reports
          </div>
          <MapContainer center={NYC_CENTER} zoom={12} className="map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker onPick={setSelected} />
            {selected && (
              <CircleMarker center={selected} radius={8} pathOptions={{ color: "#d5e4a5", fillColor: "#d5e4a5", fillOpacity: 0.9 }}>
              </CircleMarker>
            )}
            {reports.map((report) => (
              <CircleMarker
                key={report.id}
                center={[report.latitude, report.longitude]}
                radius={7}
                pathOptions={{ color: "#e28b7f", fillColor: "#d66a5d", fillOpacity: 0.8, weight: 2 }}
              >
                <Tooltip direction="top">
                  <strong>{report.venue_label}</strong><br />
                  {report.incident_month}<br />
                  <small>Community report; not independently verified.</small>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
          <div className="map-footnote">Pins represent approved, anonymized community reports—not verified findings. Map positions should be approximate.</div>
        </section>

        <aside className="sidebar">
          <div className="section-kicker">CONTRIBUTE</div>
          <h2>Share an experience</h2>
          <p className="muted">Choose an approximate location on the map, then send a report for review. You do not need to include a personal story.</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="venue">Venue name</label>
            <input id="venue" value={venue} onChange={e => setVenue(e.target.value)} maxLength={120} required placeholder="Bar or club name" />

            <label htmlFor="date">Approximate date</label>
            <input id="date" type="month" max={today.slice(0, 7)} value={date} onChange={e => setDate(e.target.value)} required />

            <label htmlFor="details">Optional details</label>
            <textarea id="details" value={details} onChange={e => setDetails(e.target.value)} maxLength={1000} placeholder="Avoid names, contact details, or identifying information about anyone." />

            <div className={`selection ${selected ? "selected" : ""}`}>
              {selected
                ? `Location selected: ${selected[0].toFixed(3)}, ${selected[1].toFixed(3)}`
                : "Click the map to select a location"}
            </div>
            <button type="submit">Submit for review</button>
          </form>

          <p className="status" role="status">{status || (loading ? "Loading public reports…" : `${reports.length} approved public report${reports.length === 1 ? "" : "s"} loaded.`)}</p>

          <div className="notice">
            <strong>Before you submit</strong>
            <p>Reports describe user experiences and are not independently verified. Do not submit names of individuals, accusations against specific staff, or identifying details. Submissions are private to moderators and are not shown on the map automatically.</p>
          </div>

          <div className="report-count">
            <span>PUBLIC REPORTS</span>
            <strong>{reports.length}</strong>
          </div>
        </aside>
      </main>

      <footer>
        This is a prototype, not an emergency service. If someone may have been drugged, prioritize immediate medical care and trusted support. Public launch requires moderation, abuse controls, privacy review, and a process for correction or removal requests.
      </footer>
    </div>
  );
}