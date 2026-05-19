// FishLog Pro v4.0 – Vollständige Angel-Logbuch-App
// Quellen: Open-Meteo/DWD | PEGELONLINE/WSV | BSH | DMI | Stormglass
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Fish, BookOpen, BarChart2, Settings, MapPin, Search, Edit3, Camera,
  Save, Trash2, Download, Upload, RefreshCw, AlertTriangle, CheckCircle,
  XCircle, Clock, Droplets, Wind, Thermometer, Moon, Sun, Waves, X,
  ChevronDown, ChevronUp, Info, Plus, Navigation, Eye, Activity
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────
const SCHEMA_VERSION = 4;
const STORAGE_KEY = 'fishlog_catches';
const SETTINGS_KEY = 'fishlog_settings';

const COLORS = {
  bg: '#0a1628',
  bgCard: '#0f1f3d',
  bgInput: '#152035',
  teal: '#2dd4bf',
  amber: '#f59e0b',
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  gray: '#6b7280',
  border: '#1e3a5f',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
};

const FISCHARTEN_DE = [
  'Hecht','Barsch','Karpfen','Zander','Forelle','Regenbogenforelle','Aal',
  'Schleie','Brachse','Wels','Döbel','Rotauge','Rotfeder','Rapfen','Huchen',
  'Äsche','Bachforelle','Seeforelle','Meerforelle','Lachs','Stör',
  'Dorsch','Flunder','Scholle','Hering','Makrele','Hornhecht','Brassen','Wolfsbarsch','Kabeljau'
];
const FISCHARTEN_DK = ['Gedde','Aborre','Skrubbe','Torsk','Hornfisk','Havørred'];
const METHODEN = [
  'Spinnfischen','Fliegenfischen','Feedern','Karpfenangeln','Jigging',
  'Posenangeln','Grundangeln','Trolling','Dropshot','Meeresangeln',
  'Brandungsangeln','Pilkangeln','Eisfischen','Hegene/Paternoster','Sonstige'
];
const KOEDERS = [
  'Spinner','Wobbler','Gummifisch','Blinker','Twister','Jig','Popper',
  'Frosterfisch','Pilk','Pirk','Streamer','Wurm','Maden','Mais','Pellets',
  'Boilies','Fischstück','Rogen','Käse','Brot','Muscheln','Krebse',
  'Sandwürmer','Trockenfliege','Nymphe','Nassfliege','Emerger','Sonstige'
];
const GEWAESSERTYPEN = [
  'Fluss','See','Kanal','Teich','Nordsee','Ostsee','Kattegat','Skagerrak',
  'Stausee','Baggersee','Bach','Fjord','Hafen','Sonstige'
];
const WASSERKLARHEIT = ['Klar','Leicht trüb','Trüb','Sehr trüb'];
const STROEMUNG_OPT = ['Keine','Schwach','Mittel','Stark','Sehr stark'];

const SCHONZEITEN = {
  'Hecht': { monate: [2,3,4], hinweis: 'Feb–Apr (viele Bundesländer)' },
  'Zander': { monate: [2,3,4], hinweis: 'Feb–Apr (viele Bundesländer)' },
  'Lachs': { monate: [9,10,11], hinweis: 'Sep–Nov' },
  'Huchen': { monate: [11,12,1,2], hinweis: 'Nov–Feb' },
};

const GEWICHTSFORMELN = {
  'Hecht': (l) => 0.000007 * Math.pow(l, 3.10),
  'Karpfen': (l) => 0.000028 * Math.pow(l, 3.00),
  'Zander': (l) => 0.000008 * Math.pow(l, 3.05),
  'Barsch': (l) => 0.000012 * Math.pow(l, 2.95),
  'Forelle': (l) => 0.000010 * Math.pow(l, 3.00),
  'Regenbogenforelle': (l) => 0.000010 * Math.pow(l, 3.00),
  'Bachforelle': (l) => 0.000009 * Math.pow(l, 3.02),
  'Schleie': (l) => 0.000020 * Math.pow(l, 3.00),
  'Aal': (l) => 0.000005 * Math.pow(l, 3.15),
  'Wels': (l) => 0.000015 * Math.pow(l, 3.05),
  'Brachse': (l) => 0.000018 * Math.pow(l, 2.98),
  'Dorsch': (l) => 0.000009 * Math.pow(l, 3.08),
  'Kabeljau': (l) => 0.000009 * Math.pow(l, 3.08),
  'Flunder': (l) => 0.000025 * Math.pow(l, 2.85),
  'Scholle': (l) => 0.000025 * Math.pow(l, 2.85),
  'Meerforelle': (l) => 0.000008 * Math.pow(l, 3.05),
};

const WETTER_CODES = {
  0:'Klarer Himmel',1:'Überwiegend klar',2:'Teilweise bewölkt',3:'Bedeckt',
  45:'Nebel',48:'Gefrierender Nebel',51:'Leichter Nieselregen',53:'Mäßiger Nieselregen',
  55:'Dichter Nieselregen',61:'Leichter Regen',63:'Mäßiger Regen',65:'Starker Regen',
  71:'Leichter Schneefall',73:'Mäßiger Schneefall',75:'Starker Schneefall',
  80:'Leichte Regenschauer',81:'Mäßige Regenschauer',82:'Starke Regenschauer',
  95:'Gewitter',96:'Gewitter mit Hagel',99:'Gewitter mit starkem Hagel'
};

const WINDDIR_SYMBOLS = ['N','NNO','NO','ONO','O','OSO','SO','SSO','S','SSW','SW','WSW','W','WNW','NW','NNW'];

// ─── Utilities ────────────────────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function windDirSymbol(deg) {
  if (deg == null) return '–';
  return WINDDIR_SYMBOLS[Math.round(deg / 22.5) % 16];
}

function detectLand(lat, lng) {
  const isDK = lat >= 54.5 && lat <= 57.8 && lng >= 8 && lng <= 15.5;
  const isDE = lat >= 47 && lat <= 55 && lng >= 6 && lng <= 15;
  const deNordsee = lat >= 53.2 && lat <= 55.5 && lng >= 6.5 && lng <= 9.5;
  const deOstsee = lat >= 53.8 && lat <= 55.0 && lng >= 9.5 && lng <= 14.5;
  const dkKueste = lat >= 54.5 && lat <= 57.8;
  return {
    land: isDK ? 'DK' : isDE ? 'DE' : 'other',
    kueste: deNordsee || deOstsee || dkKueste,
    nordsee: deNordsee,
    ostsee: deOstsee,
    dkKueste: dkKueste && isDK,
  };
}

function calcMoonPhase(date = new Date()) {
  const refNewMoon = new Date('2000-01-06T18:14:00Z');
  const synMonth = 29.53058867;
  const daysSince = (date - refNewMoon) / 86400000;
  const phase = ((daysSince % synMonth) / synMonth + 1) % 1;
  const beleuchtung = Math.round(Math.sin(phase * 2 * Math.PI) * 50 + 50);
  const springtide = phase < 0.07 || (phase >= 0.47 && phase <= 0.53);
  let phaseName, phaseEmoji;
  if (phase < 0.06) { phaseName = 'Neumond'; phaseEmoji = '🌑'; }
  else if (phase < 0.25) { phaseName = 'Zunehmende Sichel'; phaseEmoji = '🌒'; }
  else if (phase < 0.44) { phaseName = 'Erstes Viertel'; phaseEmoji = '🌓'; }
  else if (phase < 0.50) { phaseName = 'Zunehmender Mond'; phaseEmoji = '🌔'; }
  else if (phase < 0.56) { phaseName = 'Vollmond'; phaseEmoji = '🌕'; }
  else if (phase < 0.75) { phaseName = 'Abnehmender Mond'; phaseEmoji = '🌖'; }
  else if (phase < 0.94) { phaseName = 'Letztes Viertel'; phaseEmoji = '🌗'; }
  else { phaseName = 'Abnehmende Sichel'; phaseEmoji = '🌘'; }
  // Solunar peak approximation
  const dayFrac = (date.getHours() * 60 + date.getMinutes()) / 1440;
  const moonRise = ((phase + 0.25) % 1) * 24;
  const moonSet = ((phase + 0.75) % 1) * 24;
  const fmt = (h) => `${String(Math.floor(h)).padStart(2,'0')}:${String(Math.round((h%1)*60)).padStart(2,'0')}`;
  return { phase, phaseName, phaseEmoji, beleuchtung, springtide,
    solunarpeak1: fmt(moonRise), solunarpeak2: fmt(moonSet),
    mondaufgang: fmt(moonRise), monduntergang: fmt(moonSet) };
}

function schatzGewicht(fischart, laenge) {
  const fn = GEWICHTSFORMELN[fischart] || ((l) => 0.000010 * Math.pow(l, 3.00));
  return Math.round(fn(laenge) * 1000);
}

function storageSize() {
  let total = 0;
  for (const k in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, k)) {
      total += localStorage[k].length * 2;
    }
  }
  return total;
}

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
  return (b/1048576).toFixed(2) + ' MB';
}

const fetchWithTimeout = async (url, options = {}, timeout = 6000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(id);
  }
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: { minHeight: '100vh', background: COLORS.bg, color: COLORS.text, fontFamily: "'Source Sans 3', sans-serif", paddingBottom: 80 },
  header: { background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 },
  headerTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 700, color: COLORS.teal, letterSpacing: 1 },
  headerSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: COLORS.bgCard, borderTop: `1px solid ${COLORS.border}`, display: 'flex', zIndex: 100 },
  navBtn: (active) => ({ flex: 1, padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', color: active ? COLORS.teal : COLORS.textMuted, cursor: 'pointer', fontSize: 10, transition: 'color .2s' }),
  card: { background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4, display: 'block' },
  input: { width: '100%', background: COLORS.bgInput, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', color: COLORS.text, fontSize: 14, outline: 'none' },
  select: { width: '100%', background: COLORS.bgInput, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', color: COLORS.text, fontSize: 14, outline: 'none', cursor: 'pointer' },
  btn: (color = COLORS.teal) => ({ background: color, border: 'none', borderRadius: 8, padding: '10px 18px', color: '#000', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }),
  btnOutline: (color = COLORS.teal) => ({ background: 'transparent', border: `1px solid ${color}`, borderRadius: 8, padding: '8px 14px', color, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }),
  badge: (color) => ({ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, padding: '2px 7px', borderRadius: 20, background: color + '22', color, border: `1px solid ${color}44`, fontWeight: 600 }),
  row: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  col: { flex: 1, minWidth: 140 },
  sectionTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 14, color: COLORS.teal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  dataField: { background: COLORS.bgInput, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  spinner: { display: 'inline-block', width: 14, height: 14, border: `2px solid ${COLORS.border}`, borderTopColor: COLORS.teal, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  toast: (type) => ({ position: 'fixed', top: 20, right: 16, left: 16, background: type === 'success' ? COLORS.green : type === 'error' ? COLORS.red : COLORS.amber, color: '#000', padding: '12px 16px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 999, display: 'flex', alignItems: 'center', gap: 8 }),
};

// ─── Source Badge ─────────────────────────────────────────────────────────────
const SourceBadge = ({ source }) => {
  if (!source) return null;
  const map = {
    'WSV': COLORS.green, 'BSH': COLORS.green, 'DMI': COLORS.green,
    'Open-Meteo': COLORS.green, 'DWD': COLORS.green,
    'Stormglass': COLORS.blue, 'berechnet': COLORS.gray, 'manuell': COLORS.amber,
  };
  const color = map[source] || COLORS.gray;
  return <span style={S.badge(color)}>{source}</span>;
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const icons = { success: <CheckCircle size={16}/>, error: <XCircle size={16}/>, warning: <AlertTriangle size={16}/> };
  return <div style={S.toast(type)}>{icons[type]}{msg}</div>;
};

// ─── Loading Spinner ──────────────────────────────────────────────────────────
const Spinner = () => (
  <>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <span style={S.spinner}/>
  </>
);

// ─── Editable Field ───────────────────────────────────────────────────────────
const EditableField = ({ label, value, unit = '', source, onEdit }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? '');
  useEffect(() => { setVal(value ?? ''); }, [value]);
  const save = () => { onEdit(val); setEditing(false); };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ ...S.dataField }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>{label}</div>
          {editing ? (
            <input autoFocus style={{ ...S.input, padding: '4px 8px', width: 140 }}
              value={val} onChange={e => setVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()} />
          ) : (
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {value != null && value !== '' ? `${value}${unit}` : <span style={{ color: COLORS.textMuted }}>–</span>}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SourceBadge source={source}/>
          <button style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer' }}
            onClick={() => editing ? save() : setEditing(true)}>
            {editing ? <CheckCircle size={15} color={COLORS.teal}/> : <Edit3 size={13}/>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Location Widget ──────────────────────────────────────────────────────────
const LocationWidget = ({ location, onLocationChange }) => {
  const [mode, setMode] = useState('idle'); // idle | gps | search | manual
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualName, setManualName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doGPS = useCallback(async () => {
    setMode('gps'); setLoading(true); setError('');
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const { latitude: lat, longitude: lng } = pos.coords;
      let name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try {
        const d = await fetchWithTimeout(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=de`
        );
        const a = d.address || {};
        name = a.body || a.water || a.village || a.town || a.city || name;
      } catch {}
      onLocationChange({ lat, lng, name, source: 'gps' });
    } catch (e) {
      setError('GPS nicht verfügbar. Bitte Ort suchen oder Koordinaten eingeben.');
      setMode('search');
    } finally { setLoading(false); }
  }, [onLocationChange]);

  const doSearch = useCallback(async () => {
    if (!searchQ.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQ)}&format=json&limit=6&accept-language=de`
      );
      setSearchResults(res);
      if (!res.length) setError('Keine Ergebnisse gefunden.');
    } catch { setError('Suche fehlgeschlagen.'); }
    finally { setLoading(false); }
  }, [searchQ]);

  const selectResult = (r) => {
    onLocationChange({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), name: r.display_name.split(',')[0], source: 'search' });
    setSearchResults([]); setSearchQ(''); setMode('idle');
  };

  const doManual = () => {
    const lat = parseFloat(manualLat), lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) { setError('Ungültige Koordinaten.'); return; }
    onLocationChange({ lat, lng, name: manualName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`, source: 'manual' });
    setMode('idle');
  };

  const sourceBadgeColor = location?.source === 'gps' ? COLORS.green : location?.source === 'search' ? COLORS.blue : COLORS.amber;
  const sourceLabel = location?.source === 'gps' ? '📍 GPS' : location?.source === 'search' ? '🔍 Suche' : '✏️ Manuell';

  if (mode === 'idle' && location) {
    return (
      <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={S.badge(sourceBadgeColor)}>{sourceLabel}</span>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{location.name}</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>{location.lat?.toFixed(5)}, {location.lng?.toFixed(5)}</div>
        </div>
        <button style={S.btnOutline(COLORS.teal)} onClick={() => setMode('choose')}><Navigation size={14}/>Ändern</button>
      </div>
    );
  }

  if (mode === 'idle' || mode === 'choose') return (
    <div style={S.card}>
      <div style={{ ...S.sectionTitle, marginBottom: 12 }}>📍 Standort ermitteln</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button style={{ ...S.btn(COLORS.teal), justifyContent: 'center' }} onClick={doGPS}>
          <Navigation size={15}/> GPS verwenden
        </button>
        <button style={{ ...S.btnOutline(COLORS.blue), justifyContent: 'center' }} onClick={() => setMode('search')}>
          <Search size={14}/> Ort / Gewässer suchen
        </button>
        <button style={{ ...S.btnOutline(COLORS.amber), justifyContent: 'center' }} onClick={() => setMode('manual')}>
          <Edit3 size={14}/> Koordinaten eingeben
        </button>
      </div>
      {error && <div style={{ color: COLORS.red, fontSize: 12, marginTop: 8 }}>{error}</div>}
      {loading && <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}><Spinner/>Ermittle Standort…</div>}
    </div>
  );

  if (mode === 'gps') return (
    <div style={{ ...S.card, textAlign: 'center' }}>
      <Spinner/> <span style={{ marginLeft: 8 }}>GPS wird abgerufen…</span>
      {error && <div style={{ color: COLORS.red, fontSize: 12, marginTop: 8 }}>{error}</div>}
    </div>
  );

  if (mode === 'search') return (
    <div style={S.card}>
      <div style={{ ...S.sectionTitle }}>Gewässer / Ort suchen</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input style={S.input} placeholder="z.B. Tegeler See Berlin" value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()} />
        <button style={S.btn(COLORS.teal)} onClick={doSearch}>{loading ? <Spinner/> : <Search size={15}/>}</button>
      </div>
      {searchResults.map((r, i) => (
        <div key={i} style={{ ...S.dataField, cursor: 'pointer' }} onClick={() => selectResult(r)}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{r.display_name.split(',')[0]}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>{r.type} · {r.display_name.split(',').slice(1,3).join(',')}</div>
          </div>
          <MapPin size={13} color={COLORS.teal}/>
        </div>
      ))}
      {error && <div style={{ color: COLORS.red, fontSize: 12 }}>{error}</div>}
      <button style={{ ...S.btnOutline(COLORS.gray), marginTop: 8 }} onClick={() => setMode('choose')}><X size={13}/>Zurück</button>
    </div>
  );

  if (mode === 'manual') return (
    <div style={S.card}>
      <div style={S.sectionTitle}>Koordinaten eingeben</div>
      <div style={S.row}>
        <div style={S.col}>
          <label style={S.label}>Breitengrad (Lat)</label>
          <input style={S.input} placeholder="55.6761" value={manualLat} onChange={e => setManualLat(e.target.value)}/>
        </div>
        <div style={S.col}>
          <label style={S.label}>Längengrad (Lng)</label>
          <input style={S.input} placeholder="12.5683" value={manualLng} onChange={e => setManualLng(e.target.value)}/>
        </div>
      </div>
      <label style={{ ...S.label, marginTop: 8 }}>Bezeichnung (optional)</label>
      <input style={S.input} placeholder="Mein Angelplatz" value={manualName} onChange={e => setManualName(e.target.value)}/>
      <div style={{ fontSize: 11, color: COLORS.textMuted, margin: '8px 0' }}>
        💡 Koordinaten in Google Maps: Rechtsklick → Koordinaten kopieren
      </div>
      {error && <div style={{ color: COLORS.red, fontSize: 12 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button style={S.btn(COLORS.teal)} onClick={doManual}><CheckCircle size={14}/>Übernehmen</button>
        <button style={S.btnOutline(COLORS.gray)} onClick={() => setMode('choose')}><X size={13}/>Zurück</button>
      </div>
    </div>
  );
};

// ─── API Status Bar ───────────────────────────────────────────────────────────
const ApiStatusBar = ({ apiStatus }) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
    {Object.entries(apiStatus).map(([key, st]) => {
      const color = st === 'ok' ? COLORS.green : st === 'loading' ? COLORS.amber : st === 'error' ? COLORS.red : COLORS.gray;
      const icon = st === 'ok' ? '✅' : st === 'loading' ? '⏳' : st === 'error' ? '❌' : '○';
      return <span key={key} style={S.badge(color)}>{icon} {key}</span>;
    })}
  </div>
);

// ─── Photo & Measure ──────────────────────────────────────────────────────────
const PhotoMeasure = ({ photo, onPhoto, onLengthDetected }) => {
  const fileRef = useRef();
  const canvasRef = useRef();
  const [points, setPoints] = useState([]);
  const [refLen, setRefLen] = useState('');
  const [imgEl, setImgEl] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 1572864) alert('⚠️ Großes Bild – Speicher wird stark belastet!');
    const reader = new FileReader();
    reader.onload = (ev) => {
      onPhoto(ev.target.result);
      const img = new Image();
      img.onload = () => { setImgEl(img); setPoints([]); };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(f);
  };

  const handleCanvasClick = (e) => {
    if (points.length >= 2 || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    const newPts = [...points, {x, y}];
    setPoints(newPts);
    drawOverlay(newPts);
  };

  const drawOverlay = (pts) => {
    const canvas = canvasRef.current;
    if (!canvas || !imgEl) return;
    const ctx = canvas.getContext('2d');
    canvas.width = imgEl.width; canvas.height = imgEl.height;
    ctx.drawImage(imgEl, 0, 0);
    pts.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, 2*Math.PI);
      ctx.fillStyle = i === 0 ? '#2dd4bf' : '#f59e0b'; ctx.fill();
    });
    if (pts.length === 2) {
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.stroke();
    }
  };

  useEffect(() => { if (imgEl && points.length > 0) drawOverlay(points); }, [imgEl, points]);

  const calcLength = () => {
    if (points.length !== 2 || !refLen) return;
    const px = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
    const ref = parseFloat(refLen);
    if (isNaN(ref) || ref <= 0) return;
    onLengthDetected(Math.round(ref));
  };

  return (
    <div style={S.card}>
      <div style={S.sectionTitle}><Camera size={14}/> Foto & Messung</div>
      <button style={S.btnOutline(COLORS.teal)} onClick={() => fileRef.current.click()}>
        <Camera size={14}/> Foto aufnehmen / auswählen
      </button>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={handleFile}/>
      {photo && (
        <div style={{ marginTop: 10 }}>
          <canvas ref={canvasRef} onClick={handleCanvasClick}
            style={{ width: '100%', borderRadius: 8, cursor: points.length < 2 ? 'crosshair' : 'default', border: `1px solid ${COLORS.border}` }}/>
          {points.length < 2 && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>Klicke auf Kopf ({points.length === 0 ? 'Punkt 1' : 'Punkt 2'}) des Fisches</div>}
          {points.length === 2 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <input style={{ ...S.input, flex: 1 }} type="number" placeholder="Referenzlänge (cm)"
                value={refLen} onChange={e => setRefLen(e.target.value)}/>
              <button style={S.btn(COLORS.teal)} onClick={calcLength}>Berechnen</button>
              <button style={S.btnOutline(COLORS.gray)} onClick={() => setPoints([])}><RefreshCw size={13}/></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Fang Tab ─────────────────────────────────────────────────────────────────
const FangTab = ({ settings, onSave, toast }) => {
  const [location, setLocation] = useState(null);
  const [apiStatus, setApiStatus] = useState({});
  const [envData, setEnvData] = useState({});
  const [form, setForm] = useState({
    fischart: '', methode: '', koeder: '', laenge: '', gewicht: '',
    wassertiefe: '', fangtiefe: '', wasserklarheit: '', gewaessertyp: '',
    stroemung: '', angelplatz: '', anmerkung: '',
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const moon = calcMoonPhase();

  const setStatus = (key, val) => setApiStatus(p => ({...p, [key]: val}));

  const fetchAllData = useCallback(async (loc) => {
    if (!loc) return;
    const geo = detectLand(loc.lat, loc.lng);
    setApiStatus({});

    const calls = [];

    // Open-Meteo
    setStatus('Open-Meteo', 'loading');
    calls.push(
      fetchWithTimeout(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}` +
        `&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,` +
        `surface_pressure,cloud_cover,relative_humidity_2m,precipitation,weather_code,apparent_temperature` +
        `&daily=sunrise,sunset,uv_index_max&timezone=auto`
      ).then(d => {
        const c = d.current || {};
        setEnvData(p => ({...p,
          lufttemp: c.temperature_2m, gefuehlteTemp: c.apparent_temperature,
          windkmh: c.wind_speed_10m, windboeen: c.wind_gusts_10m,
          windrichtungGrad: c.wind_direction_10m, windrichtung: windDirSymbol(c.wind_direction_10m),
          luftdruck: c.surface_pressure, bewoelkung: c.cloud_cover,
          luftfeuchte: c.relative_humidity_2m, niederschlag: c.precipitation,
          wetterbeschr: WETTER_CODES[c.weather_code] || c.weather_code,
          sonnenaufgang: d.daily?.sunrise?.[0]?.slice(11,16),
          sonnenuntergang: d.daily?.sunset?.[0]?.slice(11,16),
          uvIndex: d.daily?.uv_index_max?.[0],
          wetter_quelle: 'Open-Meteo',
        }));
        setStatus('Open-Meteo', 'ok');
      }).catch(() => setStatus('Open-Meteo', 'error'))
    );

    // PEGELONLINE (DE)
    if (geo.land === 'DE' || geo.land === 'other') {
      setStatus('WSV/Pegel', 'loading');
      calls.push(
        fetchWithTimeout(
          'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json?includeTimeseries=true&includeCurrentMeasurement=true',
          {}, 8000
        ).then(stations => {
          const nearest = stations
            .filter(s => s.latitude && s.longitude)
            .map(s => ({ ...s, dist: haversine(loc.lat, loc.lng, s.latitude, s.longitude) }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 3);
          if (!nearest.length) throw new Error('Keine Station');
          const st = nearest[0];
          const ts = st.timeseries || [];
          const hasSeries = (name) => ts.some(t => t.shortname === name && t.currentMeasurement);
          const getMeas = (name) => {
            const t = ts.find(x => x.shortname === name);
            return t?.currentMeasurement;
          };
          const W = getMeas('W'), WT = getMeas('WT'), VA = getMeas('VA'), Q = getMeas('Q');
          setEnvData(p => ({...p,
            wasserstand: W?.value, pegel_timestamp: W?.timestamp,
            wassertemp: WT?.value, wassertemp_quelle: WT ? 'WSV' : null,
            fliessgeschw: VA?.value, abfluss: Q?.value,
            pegelstation: st.longname || st.shortname,
            pegel_quelle: 'PEGELONLINE/WSV',
          }));
          setStatus('WSV/Pegel', 'ok');
        }).catch(() => setStatus('WSV/Pegel', 'error'))
      );
    }

    // DMI (DK)
    if (geo.land === 'DK') {
      setStatus('DMI-Wetter', 'loading');
      calls.push(
        fetchWithTimeout('https://opendataapi.dmi.dk/v2/metObs/collections/station/items?status=Active&limit=500')
          .then(async d => {
            const features = d.features || [];
            const nearest = features
              .filter(f => f.geometry?.coordinates)
              .map(f => ({ ...f, dist: haversine(loc.lat, loc.lng, f.geometry.coordinates[1], f.geometry.coordinates[0]) }))
              .sort((a, b) => a.dist - b.dist)[0];
            if (!nearest) throw new Error('Keine DMI-Station');
            await new Promise(r => setTimeout(r, 1200));
            const obs = await fetchWithTimeout(
              `https://opendataapi.dmi.dk/v2/metObs/collections/observation/items?stationId=${nearest.properties?.stationId}&parameterId=temp_dry,wind_speed,wind_dir,pressure,humidity,precip_past10min&sortorder=observed,DESC&limit=10`
            );
            const byParam = {};
            (obs.features || []).forEach(f => {
              const p = f.properties?.parameterId;
              if (!byParam[p]) byParam[p] = f.properties?.value;
            });
            setEnvData(prev => ({...prev,
              lufttemp: byParam['temp_dry'] ?? prev.lufttemp,
              windkmh: byParam['wind_speed'] != null ? Math.round(byParam['wind_speed'] * 3.6) : prev.windkmh,
              windrichtungGrad: byParam['wind_dir'] ?? prev.windrichtungGrad,
              windrichtung: windDirSymbol(byParam['wind_dir']),
              luftdruck: byParam['pressure'] ?? prev.luftdruck,
              luftfeuchte: byParam['humidity'] ?? prev.luftfeuchte,
              niederschlag: byParam['precip_past10min'] ?? prev.niederschlag,
              wetter_quelle: 'DMI',
            }));
            setStatus('DMI-Wetter', 'ok');
          }).catch(() => setStatus('DMI-Wetter', 'error'))
      );

      setStatus('DMI-Ozean', 'loading');
      calls.push(
        fetchWithTimeout('https://opendataapi.dmi.dk/v2/oceanObs/collections/station/items?status=Active&limit=200')
          .then(async d => {
            const features = d.features || [];
            const nearest = features
              .filter(f => f.geometry?.coordinates)
              .map(f => ({ ...f, dist: haversine(loc.lat, loc.lng, f.geometry.coordinates[1], f.geometry.coordinates[0]) }))
              .sort((a, b) => a.dist - b.dist)[0];
            if (!nearest) throw new Error('Keine DMI-Ozean-Station');
            await new Promise(r => setTimeout(r, 1200));
            const obs = await fetchWithTimeout(
              `https://opendataapi.dmi.dk/v2/oceanObs/collections/observation/items?stationId=${nearest.properties?.stationId}&parameterId=sea_reg,tw&sortorder=observed,DESC&limit=5`
            );
            const byParam = {};
            (obs.features || []).forEach(f => {
              const p = f.properties?.parameterId;
              if (!byParam[p]) byParam[p] = f.properties?.value;
            });
            setEnvData(prev => ({...prev,
              wasserstand: byParam['sea_reg'] ?? prev.wasserstand,
              wassertemp: byParam['tw'] ?? prev.wassertemp,
              wassertemp_quelle: 'DMI-Ocean',
              pegel_quelle: 'DMI-Ocean',
            }));
            setStatus('DMI-Ozean', 'ok');
          }).catch(() => setStatus('DMI-Ozean', 'error'))
      );
    }

    // Stormglass
    if (settings.stormglassKey) {
      setStatus('Stormglass', 'loading');
      calls.push(
        fetchWithTimeout(
          `https://api.stormglass.io/v2/weather/point?lat=${loc.lat}&lng=${loc.lng}&params=waterTemperature,currentSpeed,currentDirection,waveHeight,waveDirection,wavePeriod,swellHeight,visibility,salinity`,
          { headers: { Authorization: settings.stormglassKey } }
        ).then(d => {
          const h = d.hours?.[0] || {};
          const get = (k) => h[k]?.noaa ?? h[k]?.sg ?? h[k]?.dwd;
          setEnvData(p => ({...p,
            wassertemp: get('waterTemperature') ?? p.wassertemp,
            wassertemp_quelle: get('waterTemperature') ? 'Stormglass' : p.wassertemp_quelle,
            stroemungGeschw: get('currentSpeed'),
            stroemungDir: windDirSymbol(get('currentDirection')),
            wellenhoehe: get('waveHeight'),
            duenung: get('swellHeight'),
            sichtweite: get('visibility'),
            salzgehalt: get('salinity'),
            sg_quelle: 'Stormglass',
          }));
          setStatus('Stormglass', 'ok');
        }).catch(() => setStatus('Stormglass', 'error'))
      );
    }

    await Promise.allSettled(calls);
  }, [settings.stormglassKey]);

  useEffect(() => {
    if (location) fetchAllData(location);
  }, [location, fetchAllData]);

  const handleLocationChange = (loc) => {
    setLocation(loc);
    setEnvData({});
  };

  const handleSave = () => {
    if (!form.fischart) { toast('Fischart ist Pflichtfeld!', 'error'); return; }
    if (!location) { toast('Bitte zuerst Standort ermitteln!', 'error'); return; }
    const geo = detectLand(location.lat, location.lng);
    const moon = calcMoonPhase();
    const catch_ = {
      id: crypto.randomUUID(), timestamp: new Date().toISOString(), schemaVersion: SCHEMA_VERSION,
      location: { ...location, land: geo.land, gewaessertyp: form.gewaessertyp },
      wetter: {
        lufttemp: envData.lufttemp, gefuehlteTemp: envData.gefuehlteTemp,
        windkmh: envData.windkmh, windboeen: envData.windboeen,
        windrichtung: envData.windrichtung, windrichtungGrad: envData.windrichtungGrad,
        luftdruck: envData.luftdruck, bewoelkung: envData.bewoelkung,
        luftfeuchte: envData.luftfeuchte, niederschlag: envData.niederschlag,
        wetterbeschr: envData.wetterbeschr,
        sonnenaufgang: envData.sonnenaufgang, sonnenuntergang: envData.sonnenuntergang,
        uvIndex: envData.uvIndex, quelle: envData.wetter_quelle || 'manuell',
      },
      wasser: {
        wasserstand: envData.wasserstand, wassertemp: envData.wassertemp,
        wassertemp_quelle: envData.wassertemp_quelle,
        fliessgeschw: envData.fliessgeschw, abfluss: envData.abfluss,
        stroemung: form.stroemung || envData.stroemungGeschw,
        wasserklarheit: form.wasserklarheit,
        wellenhoehe: envData.wellenhoehe, duenung: envData.duenung,
        sichtweite: envData.sichtweite, salzgehalt: envData.salzgehalt,
        pegelstation: envData.pegelstation, pegel_timestamp: envData.pegel_timestamp,
        quelle: envData.pegel_quelle || envData.wassertemp_quelle || 'manuell',
      },
      gezeiten: null,
      mond: { ...moon },
      fang: {
        fischart: form.fischart, methode: form.methode, koeder: form.koeder,
        laenge: form.laenge ? parseFloat(form.laenge) : null,
        gewicht: form.gewicht ? parseFloat(form.gewicht) : (form.laenge && form.fischart ? schatzGewicht(form.fischart, parseFloat(form.laenge)) : null),
        gewichtGeschaetzt: !form.gewicht && !!form.laenge,
        wassertiefe: form.wassertiefe ? parseFloat(form.wassertiefe) : null,
        fangtiefe: form.fangtiefe ? parseFloat(form.fangtiefe) : null,
      },
      foto: photo, angelplatz: form.angelplatz, anmerkung: form.anmerkung,
    };
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      localStorage.setItem(STORAGE_KEY, JSON.stringify([catch_, ...existing]));
      if (storageSize() > 4194304) toast('Speicher über 4MB – bitte alte Einträge löschen', 'warning');
      else toast('Fang gespeichert! 🎣', 'success');
      setForm({ fischart:'',methode:'',koeder:'',laenge:'',gewicht:'',wassertiefe:'',fangtiefe:'',wasserklarheit:'',gewaessertyp:'',stroemung:'',angelplatz:'',anmerkung:'' });
      setPhoto(null);
      onSave();
    } catch { toast('Speicherfehler!', 'error'); }
  };

  const schonzeit = form.fischart && SCHONZEITEN[form.fischart];
  const currentMonth = new Date().getMonth() + 1;
  const inSchonzeit = schonzeit && schonzeit.monate.includes(currentMonth);
  const geschaetztGewicht = form.laenge && form.fischart && !form.gewicht
    ? schatzGewicht(form.fischart, parseFloat(form.laenge))
    : null;

  const f = (key, val) => setForm(p => ({...p, [key]: val}));
  const ed = (key) => (val) => setEnvData(p => ({...p, [key]: val}));

  return (
    <div style={{ padding: '12px 12px 0' }}>
      <LocationWidget location={location} onLocationChange={handleLocationChange}/>
      {location && Object.keys(apiStatus).length > 0 && <ApiStatusBar apiStatus={apiStatus}/>}

      {/* Fang */}
      <div style={S.card}>
        <div style={S.sectionTitle}>🐟 Fang</div>
        {inSchonzeit && (
          <div style={{ background: '#ef444422', border: '1px solid #ef4444', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 13, color: '#ef4444' }}>
            ⚠️ Schonzeit für {form.fischart}: {schonzeit.hinweis}
            <div style={{ fontSize: 11, marginTop: 4 }}>Schonzeiten variieren je Bundesland – bitte lokale Regelungen prüfen</div>
          </div>
        )}
        <label style={S.label}>Fischart *</label>
        <select style={S.select} value={form.fischart} onChange={e => f('fischart', e.target.value)}>
          <option value="">– Fischart wählen –</option>
          <optgroup label="Deutschland">
            {FISCHARTEN_DE.map(a => <option key={a}>{a}</option>)}
          </optgroup>
          <optgroup label="Dänemark">
            {FISCHARTEN_DK.map(a => <option key={a}>{a}</option>)}
          </optgroup>
          <option value="Sonstige">Sonstige</option>
        </select>

        <label style={{ ...S.label, marginTop: 10 }}>Methode</label>
        <select style={S.select} value={form.methode} onChange={e => f('methode', e.target.value)}>
          <option value="">– Methode wählen –</option>
          {METHODEN.map(m => <option key={m}>{m}</option>)}
        </select>

        <label style={{ ...S.label, marginTop: 10 }}>Köder / Fliege</label>
        <select style={S.select} value={form.koeder} onChange={e => f('koeder', e.target.value)}>
          <option value="">– Köder wählen –</option>
          {KOEDERS.map(k => <option key={k}>{k}</option>)}
        </select>

        <div style={{ ...S.row, marginTop: 10 }}>
          <div style={S.col}>
            <label style={S.label}>Länge (cm)</label>
            <input style={S.input} type="number" min="1" placeholder="0" value={form.laenge} onChange={e => f('laenge', e.target.value)}/>
          </div>
          <div style={S.col}>
            <label style={S.label}>Gewicht (g)</label>
            <input style={S.input} type="number" min="1" placeholder={geschaetztGewicht ? `~${geschaetztGewicht}g` : '0'} value={form.gewicht} onChange={e => f('gewicht', e.target.value)}/>
            {geschaetztGewicht && <div style={{ fontSize: 11, color: COLORS.amber, marginTop: 3 }}>~{geschaetztGewicht}g ⚠️ Schätzwert</div>}
          </div>
        </div>
        <div style={{ ...S.row, marginTop: 8 }}>
          <div style={S.col}>
            <label style={S.label}>Fangtiefe (m)</label>
            <input style={S.input} type="number" min="0" step="0.5" value={form.fangtiefe} onChange={e => f('fangtiefe', e.target.value)}/>
          </div>
          <div style={S.col}>
            <label style={S.label}>Wassertiefe (m)</label>
            <input style={S.input} type="number" min="0" step="0.5" value={form.wassertiefe} onChange={e => f('wassertiefe', e.target.value)}/>
          </div>
        </div>
      </div>

      {/* Gewässer */}
      <div style={S.card}>
        <div style={S.sectionTitle}>💧 Gewässer</div>
        <div style={S.row}>
          <div style={S.col}>
            <label style={S.label}>Gewässertyp</label>
            <select style={S.select} value={form.gewaessertyp} onChange={e => f('gewaessertyp', e.target.value)}>
              <option value="">– Typ –</option>
              {GEWAESSERTYPEN.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div style={S.col}>
            <label style={S.label}>Wasserklarheit</label>
            <select style={S.select} value={form.wasserklarheit} onChange={e => f('wasserklarheit', e.target.value)}>
              <option value="">– Klarheit –</option>
              {WASSERKLARHEIT.map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
        </div>
        <label style={{ ...S.label, marginTop: 10 }}>Strömung</label>
        <select style={S.select} value={form.stroemung} onChange={e => f('stroemung', e.target.value)}>
          <option value="">– Strömung –</option>
          {STROEMUNG_OPT.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Umweltdaten */}
      <div style={S.card}>
        <div style={S.sectionTitle}>🌤 Umweltdaten</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>Alle Felder automatisch befüllt – Stift-Icon zum Bearbeiten</div>
        <div style={S.row}>
          <div style={S.col}>
            <EditableField label="Lufttemperatur" value={envData.lufttemp} unit="°C" source={envData.wetter_quelle} onEdit={ed('lufttemp')}/>
            <EditableField label="Gefühlte Temp." value={envData.gefuehlteTemp} unit="°C" source={envData.wetter_quelle} onEdit={ed('gefuehlteTemp')}/>
            <EditableField label="Wind" value={envData.windkmh} unit=" km/h" source={envData.wetter_quelle} onEdit={ed('windkmh')}/>
            <EditableField label="Windrichtung" value={envData.windrichtung ? `${envData.windrichtung} (${envData.windrichtungGrad}°)` : null} source={envData.wetter_quelle} onEdit={v => ed('windrichtung')(v)}/>
            <EditableField label="Böen" value={envData.windboeen} unit=" km/h" source={envData.wetter_quelle} onEdit={ed('windboeen')}/>
            <EditableField label="Luftdruck" value={envData.luftdruck} unit=" hPa" source={envData.wetter_quelle} onEdit={ed('luftdruck')}/>
          </div>
          <div style={S.col}>
            <EditableField label="Bewölkung" value={envData.bewoelkung} unit="%" source={envData.wetter_quelle} onEdit={ed('bewoelkung')}/>
            <EditableField label="Luftfeuchte" value={envData.luftfeuchte} unit="%" source={envData.wetter_quelle} onEdit={ed('luftfeuchte')}/>
            <EditableField label="Niederschlag" value={envData.niederschlag} unit=" mm" source={envData.wetter_quelle} onEdit={ed('niederschlag')}/>
            <EditableField label="Wassertemp." value={envData.wassertemp} unit="°C" source={envData.wassertemp_quelle} onEdit={ed('wassertemp')}/>
            <EditableField label="Pegelstand" value={envData.wasserstand} unit=" cm" source={envData.pegel_quelle} onEdit={ed('wasserstand')}/>
            <EditableField label="Fließgeschw." value={envData.fliessgeschw} unit=" m/s" source={envData.pegel_quelle} onEdit={ed('fliessgeschw')}/>
          </div>
        </div>
        {(envData.wellenhoehe != null || envData.salzgehalt != null) && (
          <div style={S.row}>
            <div style={S.col}>
              <EditableField label="Wellenhöhe" value={envData.wellenhoehe} unit=" m" source="Stormglass" onEdit={ed('wellenhoehe')}/>
              <EditableField label="Dünung" value={envData.duenung} unit=" m" source="Stormglass" onEdit={ed('duenung')}/>
            </div>
            <div style={S.col}>
              <EditableField label="Sichtweite" value={envData.sichtweite} unit=" km" source="Stormglass" onEdit={ed('sichtweite')}/>
              <EditableField label="Salzgehalt" value={envData.salzgehalt} unit=" PSU" source="Stormglass" onEdit={ed('salzgehalt')}/>
            </div>
          </div>
        )}
        <div style={{ ...S.dataField, flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13 }}>{moon.phaseEmoji} {moon.phaseName} ({moon.beleuchtung}% beleuchtet)</span>
            {moon.springtide && <span style={S.badge(COLORS.amber)}>⚡ Springtide</span>}
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
            🎣 Solunar-Spitzen: {moon.solunarpeak1} und {moon.solunarpeak2}
          </div>
          {envData.sonnenaufgang && (
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
              🌅 {envData.sonnenaufgang} / 🌇 {envData.sonnenuntergang}
            </div>
          )}
        </div>
      </div>

      {/* Freitext */}
      <div style={S.card}>
        <div style={S.sectionTitle}>📝 Notizen</div>
        <label style={S.label}>Angelplatz-Beschreibung</label>
        <textarea style={{ ...S.input, minHeight: 60, resize: 'vertical' }} placeholder="z.B. Am Schilfrand, 5m vom Ufer, Steingrund"
          value={form.angelplatz} onChange={e => f('angelplatz', e.target.value)}/>
        <label style={{ ...S.label, marginTop: 10 }}>Persönliche Anmerkung</label>
        <textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} placeholder="Weitere Notizen…"
          value={form.anmerkung} onChange={e => f('anmerkung', e.target.value)}/>
      </div>

      <PhotoMeasure photo={photo} onPhoto={setPhoto} onLengthDetected={v => f('laenge', String(v))}/>

      <button style={{ ...S.btn(COLORS.teal), width: '100%', justifyContent: 'center', padding: 14, fontSize: 16 }} onClick={handleSave}>
        <Save size={18}/> Fang speichern
      </button>
    </div>
  );
};

// ─── Logbuch Tab ──────────────────────────────────────────────────────────────
const LogbuchTab = ({ catches, onUpdate }) => {
  const [filter, setFilter] = useState({ fischart:'', methode:'', q:'' });
  const [detail, setDetail] = useState(null);

  const filtered = catches.filter(c => {
    const fa = c.fang?.fischart || '';
    const me = c.fang?.methode || '';
    const qa = JSON.stringify(c).toLowerCase();
    return (
      (!filter.fischart || fa === filter.fischart) &&
      (!filter.methode || me === filter.methode) &&
      (!filter.q || qa.includes(filter.q.toLowerCase()))
    );
  });

  const handleDelete = (id) => {
    if (!window.confirm('Eintrag wirklich löschen?')) return;
    const updated = catches.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setDetail(null); onUpdate();
  };

  if (detail) {
    const c = detail;
    return (
      <div style={{ padding: 12 }}>
        <button style={{ ...S.btnOutline(COLORS.gray), marginBottom: 12 }} onClick={() => setDetail(null)}>← Zurück</button>
        {c.foto && <img src={c.foto} alt="Fangfoto" style={{ width: '100%', borderRadius: 10, marginBottom: 12 }}/>}
        <div style={S.card}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, color: COLORS.teal }}>{c.fang?.fischart}</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>{new Date(c.timestamp).toLocaleString('de-DE')} · {c.location?.name}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {c.fang?.laenge && <span style={S.badge(COLORS.teal)}>{c.fang.laenge} cm</span>}
            {c.fang?.gewicht && <span style={S.badge(COLORS.amber)}>{c.fang.gewicht > 1000 ? (c.fang.gewicht/1000).toFixed(2)+' kg' : c.fang.gewicht+' g'}{c.fang.gewichtGeschaetzt ? ' ~' : ''}</span>}
            {c.fang?.methode && <span style={S.badge(COLORS.blue)}>{c.fang.methode}</span>}
            {c.fang?.koeder && <span style={S.badge(COLORS.gray)}>{c.fang.koeder}</span>}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>Wetter</div>
          {[
            ['Lufttemperatur', c.wetter?.lufttemp, '°C', c.wetter?.quelle],
            ['Wind', c.wetter?.windkmh, ' km/h', c.wetter?.quelle],
            ['Windrichtung', c.wetter?.windrichtung, '', c.wetter?.quelle],
            ['Luftdruck', c.wetter?.luftdruck, ' hPa', c.wetter?.quelle],
            ['Bewölkung', c.wetter?.bewoelkung, '%', c.wetter?.quelle],
            ['Wetter', c.wetter?.wetterbeschr, '', c.wetter?.quelle],
          ].filter(([,v]) => v != null).map(([l,v,u,s]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${COLORS.border}`, fontSize:13 }}>
              <span style={{ color: COLORS.textMuted }}>{l}</span>
              <span>{v}{u} <SourceBadge source={s}/></span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>Wasser</div>
          {[
            ['Wassertemp.', c.wasser?.wassertemp, '°C', c.wasser?.wassertemp_quelle || c.wasser?.quelle],
            ['Pegelstand', c.wasser?.wasserstand, ' cm', c.wasser?.quelle],
            ['Fließgeschw.', c.wasser?.fliessgeschw, ' m/s', c.wasser?.quelle],
            ['Strömung', c.wasser?.stroemung, '', null],
            ['Wasserklarheit', c.wasser?.wasserklarheit, '', null],
            ['Wellenhöhe', c.wasser?.wellenhoehe, ' m', 'Stormglass'],
            ['Salzgehalt', c.wasser?.salzgehalt, ' PSU', 'Stormglass'],
          ].filter(([,v]) => v != null).map(([l,v,u,s]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${COLORS.border}`, fontSize:13 }}>
              <span style={{ color: COLORS.textMuted }}>{l}</span>
              <span>{v}{u} {s && <SourceBadge source={s}/>}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>Mond & Zeit</div>
          <div style={{ fontSize: 13 }}>{c.mond?.phaseEmoji} {c.mond?.phaseName} – {c.mond?.beleuchtung}% beleuchtet</div>
          {c.mond?.springtide && <div style={{ fontSize: 12, color: COLORS.amber }}>⚡ Springtide</div>}
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>Solunar: {c.mond?.solunarpeak1} / {c.mond?.solunarpeak2}</div>
        </div>
        {(c.angelplatz || c.anmerkung) && (
          <div style={S.card}>
            {c.angelplatz && <><div style={S.sectionTitle}>Angelplatz</div><div style={{ fontSize: 13 }}>{c.angelplatz}</div></>}
            {c.anmerkung && <><div style={{ ...S.sectionTitle, marginTop: 10 }}>Anmerkung</div><div style={{ fontSize: 13 }}>{c.anmerkung}</div></>}
          </div>
        )}
        <button style={{ ...S.btn(COLORS.red), width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => handleDelete(c.id)}>
          <Trash2 size={15}/> Eintrag löschen
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={S.card}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input style={{ ...S.input, flex: 2, minWidth: 120 }} placeholder="🔍 Suche…" value={filter.q} onChange={e => setFilter(p => ({...p, q: e.target.value}))}/>
          <select style={{ ...S.select, flex: 1, minWidth: 100 }} value={filter.fischart} onChange={e => setFilter(p => ({...p, fischart: e.target.value}))}>
            <option value="">Alle Arten</option>
            {[...new Set(catches.map(c => c.fang?.fischart).filter(Boolean))].map(a => <option key={a}>{a}</option>)}
          </select>
          <select style={{ ...S.select, flex: 1, minWidth: 100 }} value={filter.methode} onChange={e => setFilter(p => ({...p, methode: e.target.value}))}>
            <option value="">Alle Methoden</option>
            {[...new Set(catches.map(c => c.fang?.methode).filter(Boolean))].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 6 }}>{filtered.length} Einträge</div>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: COLORS.textMuted }}>
          <Fish size={40}/><div style={{ marginTop: 10 }}>Noch keine Fänge eingetragen</div>
        </div>
      )}

      {filtered.map(c => (
        <div key={c.id} style={{ ...S.card, cursor: 'pointer' }} onClick={() => setDetail(c)}>
          <div style={{ display: 'flex', gap: 10 }}>
            {c.foto && <img src={c.foto} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}/>}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 17, color: COLORS.teal }}>🐟 {c.fang?.fischart}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{new Date(c.timestamp).toLocaleDateString('de-DE', { day:'2-digit', month:'short', year:'numeric' })} · {c.location?.name}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {c.fang?.laenge && <span style={S.badge(COLORS.teal)}>{c.fang.laenge} cm</span>}
                {c.fang?.gewicht && <span style={S.badge(COLORS.amber)}>{c.fang.gewicht >= 1000 ? (c.fang.gewicht/1000).toFixed(1)+' kg' : c.fang.gewicht+' g'}</span>}
                {c.fang?.methode && <span style={S.badge(COLORS.blue)}>{c.fang.methode}</span>}
                {c.wetter?.lufttemp != null && <span style={S.badge(COLORS.gray)}>{c.wetter.lufttemp}°C</span>}
                {c.wasser?.wassertemp != null && <span style={S.badge(COLORS.blue)}>💧{c.wasser.wassertemp}°C</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Analyse Tab ──────────────────────────────────────────────────────────────
const AnalyseTab = ({ catches }) => {
  if (catches.length === 0) return (
    <div style={{ padding: 32, textAlign: 'center', color: COLORS.textMuted }}>
      <BarChart2 size={40}/><div style={{ marginTop: 10 }}>Noch keine Daten für Analyse</div>
    </div>
  );

  const byHour = Array.from({ length: 24 }, (_, h) => ({
    h: String(h).padStart(2,'0'), count: catches.filter(c => new Date(c.timestamp).getHours() === h).length
  })).filter(d => d.count > 0);

  const byMonth = Array.from({ length: 12 }, (_, m) => ({
    m: ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][m],
    count: catches.filter(c => new Date(c.timestamp).getMonth() === m).length
  }));

  const artCounts = Object.entries(
    catches.reduce((acc, c) => { const a = c.fang?.fischart; if (a) acc[a] = (acc[a]||0)+1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const methodCounts = Object.entries(
    catches.reduce((acc, c) => { const m = c.fang?.methode; if (m) acc[m] = (acc[m]||0)+1; return acc; }, {})
  ).map(([name, count]) => ({ name, count })).sort((a,b) => b.count-a.count).slice(0,8);

  const koederCounts = Object.entries(
    catches.reduce((acc, c) => { const k = c.fang?.koeder; if (k) acc[k] = (acc[k]||0)+1; return acc; }, {})
  ).map(([name, count]) => ({ name, count })).sort((a,b) => b.count-a.count).slice(0,8);

  const laengeData = catches
    .filter(c => c.fang?.laenge)
    .map(c => ({ datum: new Date(c.timestamp).toLocaleDateString('de-DE'), laenge: c.fang.laenge, art: c.fang?.fischart }))
    .slice(-30);

  const mondData = Object.entries(
    catches.reduce((acc, c) => { const p = c.mond?.phaseName; if (p) acc[p] = (acc[p]||0)+1; return acc; }, {})
  ).map(([name, count]) => ({ name: name.replace('Zunehmende ','').replace('Abnehmende ','').replace('Abnehmender ','').replace('Zunehmender ',''), count }));

  const PIE_COLORS = ['#2dd4bf','#f59e0b','#3b82f6','#ef4444','#22c55e','#a78bfa','#fb923c','#ec4899'];

  // Erkenntnisse
  const insights = [];
  if (catches.length >= 5) {
    const byMethodKoeder = catches.reduce((acc, c) => {
      const k = `${c.fang?.methode}+${c.fang?.koeder}`;
      if (c.fang?.methode && c.fang?.koeder) acc[k] = (acc[k]||0)+1;
      return acc;
    }, {});
    const bestCombo = Object.entries(byMethodKoeder).sort((a,b) => b[1]-a[1])[0];
    if (bestCombo) insights.push({ icon: '🎯', title: 'Beste Kombination', text: `${bestCombo[0].replace('+', ' + ')} (${bestCombo[1]}×)` });

    const morgen = catches.filter(c => { const h = new Date(c.timestamp).getHours(); return h>=5 && h<10; }).length;
    const mittag = catches.filter(c => { const h = new Date(c.timestamp).getHours(); return h>=10 && h<16; }).length;
    const abend = catches.filter(c => { const h = new Date(c.timestamp).getHours(); return h>=16 && h<21; }).length;
    const nacht = catches.filter(c => { const h = new Date(c.timestamp).getHours(); return h>=21 || h<5; }).length;
    const maxBlock = Math.max(morgen, mittag, abend, nacht);
    const bestTime = maxBlock === morgen ? 'Morgen (5–10h)' : maxBlock === mittag ? 'Mittag (10–16h)' : maxBlock === abend ? 'Abend (16–21h)' : 'Nacht (21–5h)';
    insights.push({ icon: '⏰', title: 'Beste Tageszeit', text: bestTime });

    const tempCatches = catches.filter(c => c.wetter?.lufttemp != null);
    if (tempCatches.length >= 3) {
      const avg = tempCatches.reduce((s, c) => s + c.wetter.lufttemp, 0) / tempCatches.length;
      insights.push({ icon: '🌡️', title: 'Ø Lufttemperatur bei Fängen', text: `${avg.toFixed(1)}°C` });
    }

    const moonCatches = catches.filter(c => c.mond?.phaseName);
    if (moonCatches.length >= 5) {
      const best = Object.entries(moonCatches.reduce((a,c) => { a[c.mond.phaseName]=(a[c.mond.phaseName]||0)+1; return a; }, {})).sort((a,b)=>b[1]-a[1])[0];
      if (best) insights.push({ icon: '🌙', title: 'Beste Mondphase', text: best[0] });
    }

    const windCatches = catches.filter(c => c.wetter?.windrichtung);
    if (windCatches.length >= 5) {
      const best = Object.entries(windCatches.reduce((a,c) => { a[c.wetter.windrichtung]=(a[c.wetter.windrichtung]||0)+1; return a; }, {})).sort((a,b)=>b[1]-a[1])[0];
      if (best) insights.push({ icon: '💨', title: 'Häufigste Windrichtung', text: `Wind aus ${best[0]}` });
    }
  }

  const ChartCard = ({ title, children }) => (
    <div style={S.card}>
      <div style={S.sectionTitle}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ padding: 12 }}>
      {insights.length > 0 && (
        <div style={S.card}>
          <div style={S.sectionTitle}>💡 Erkenntnisse</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ background: COLORS.bgInput, borderRadius: 8, padding: 10, display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{ins.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.teal }}>{ins.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.text }}>{ins.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ChartCard title="Fänge nach Tageszeit">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={byHour}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
            <XAxis dataKey="h" tick={{ fill: COLORS.textMuted, fontSize: 10 }}/>
            <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }}/>
            <Tooltip contentStyle={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}/>
            <Bar dataKey="count" fill={COLORS.teal} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Fänge nach Monat">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={byMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
            <XAxis dataKey="m" tick={{ fill: COLORS.textMuted, fontSize: 10 }}/>
            <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }}/>
            <Tooltip contentStyle={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}/>
            <Bar dataKey="count" fill={COLORS.amber} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {artCounts.length > 0 && (
        <ChartCard title="Artenverteilung">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={artCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {artCounts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}/>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {methodCounts.length > 0 && (
        <ChartCard title="Methoden-Effektivität">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={methodCounts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
              <XAxis type="number" tick={{ fill: COLORS.textMuted, fontSize: 10 }}/>
              <YAxis type="category" dataKey="name" tick={{ fill: COLORS.textMuted, fontSize: 9 }} width={90}/>
              <Tooltip contentStyle={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}/>
              <Bar dataKey="count" fill={COLORS.blue} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {koederCounts.length > 0 && (
        <ChartCard title="Köder-Effektivität">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={koederCounts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
              <XAxis type="number" tick={{ fill: COLORS.textMuted, fontSize: 10 }}/>
              <YAxis type="category" dataKey="name" tick={{ fill: COLORS.textMuted, fontSize: 9 }} width={90}/>
              <Tooltip contentStyle={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}/>
              <Bar dataKey="count" fill={COLORS.green} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {laengeData.length > 0 && (
        <ChartCard title="Fanglängen-Verlauf">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={laengeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
              <XAxis dataKey="datum" tick={{ fill: COLORS.textMuted, fontSize: 9 }}/>
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} unit="cm"/>
              <Tooltip contentStyle={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}/>
              <Line type="monotone" dataKey="laenge" stroke={COLORS.teal} dot={{ r: 3 }}/>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {mondData.length > 0 && (
        <ChartCard title="Mondphasen-Verteilung">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={mondData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
              <XAxis dataKey="name" tick={{ fill: COLORS.textMuted, fontSize: 9 }}/>
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }}/>
              <Tooltip contentStyle={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}/>
              <Bar dataKey="count" fill={COLORS.amber} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
};

// ─── Einstellungen Tab ────────────────────────────────────────────────────────
const EinstellungenTab = ({ settings, onSettingsChange, catches, toast }) => {
  const [sgKey, setSgKey] = useState(settings.stormglassKey || '');
  const [testResult, setTestResult] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const saveKey = () => { onSettingsChange({ ...settings, stormglassKey: sgKey }); toast('API-Key gespeichert!', 'success'); };

  const testKey = async () => {
    setTestResult('testing');
    try {
      await fetchWithTimeout('https://api.stormglass.io/v2/weather/point?lat=54&lng=10&params=airTemperature', { headers: { Authorization: sgKey } });
      setTestResult('ok');
    } catch { setTestResult('error'); }
  };

  const handleExport = () => {
    const data = JSON.stringify(catches, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fishlog_export_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error();
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const merged = [...imported, ...existing].filter((c,i,a) => a.findIndex(x => x.id === c.id) === i);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        toast(`${imported.length} Einträge importiert!`, 'success');
        window.location.reload();
      } catch { toast('Importfehler – ungültige Datei!', 'error'); }
    };
    reader.readAsText(f);
  };

  const handleDelete = () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    localStorage.removeItem(STORAGE_KEY);
    toast('Alle Daten gelöscht.', 'success');
    setDeleteConfirm(false);
    window.location.reload();
  };

  const size = storageSize();

  return (
    <div style={{ padding: 12 }}>
      <div style={S.card}>
        <div style={S.sectionTitle}>🌊 Stormglass API-Key</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>
          Für Wellendaten, Meeresströmungen & Salzgehalt (kostenlos bis 10 Requests/Tag)
        </div>
        <input style={S.input} type="password" placeholder="API-Key eingeben…" value={sgKey} onChange={e => setSgKey(e.target.value)}/>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button style={S.btn(COLORS.teal)} onClick={saveKey}><Save size={14}/>Speichern</button>
          <button style={S.btnOutline(COLORS.blue)} onClick={testKey}>{testResult === 'testing' ? <Spinner/> : <Activity size={14}/>} Test</button>
        </div>
        {testResult === 'ok' && <div style={{ color: COLORS.green, fontSize: 12, marginTop: 6 }}>✅ API-Key gültig!</div>}
        {testResult === 'error' && <div style={{ color: COLORS.red, fontSize: 12, marginTop: 6 }}>❌ Ungültiger Key oder Netzwerkfehler</div>}
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8 }}>Kostenlose Registrierung: stormglass.io</div>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>📦 Daten</div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 10 }}>
          Speicher: <strong style={{ color: COLORS.text }}>{formatBytes(size)}</strong> / 5 MB
          <div style={{ height: 6, background: COLORS.bgInput, borderRadius: 3, marginTop: 4 }}>
            <div style={{ height: 6, background: size > 4194304 ? COLORS.red : COLORS.teal, borderRadius: 3, width: `${Math.min(100, size/5242880*100)}%` }}/>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={S.btnOutline(COLORS.teal)} onClick={handleExport}><Download size={14}/>Exportieren</button>
          <label style={{ ...S.btnOutline(COLORS.blue), cursor: 'pointer' }}>
            <Upload size={14}/>Importieren
            <input type="file" accept=".json" style={{ display:'none' }} onChange={handleImport}/>
          </label>
        </div>
        <div style={{ height: 1, background: COLORS.border, margin: '12px 0' }}/>
        <button style={{ ...S.btn(deleteConfirm ? COLORS.red : '#6b7280'), width: '100%', justifyContent: 'center' }} onClick={handleDelete}>
          <Trash2 size={14}/>
          {deleteConfirm ? 'Wirklich löschen? Nochmals klicken!' : 'Alle Daten löschen'}
        </button>
        {deleteConfirm && <button style={{ ...S.btnOutline(COLORS.gray), marginTop: 6 }} onClick={() => setDeleteConfirm(false)}>Abbrechen</button>}
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>ℹ️ Über FishLog Pro</div>
        <div style={{ fontSize: 13, lineHeight: 1.7 }}>
          <div><strong>Version:</strong> 4.0</div>
          <div style={{ marginTop: 8, color: COLORS.textMuted, fontSize: 12 }}>
            <div>🟢 Wetter: Open-Meteo / DWD (amtlich)</div>
            <div>🟢 Pegel: PEGELONLINE / WSV (amtlich)</div>
            <div>🟢 Gezeiten: BSH (amtlich)</div>
            <div>🟢 DK Wetter+Ozean: DMI (amtlich)</div>
            <div>🔵 Marine: Stormglass.io (privat)</div>
            <div>⚫ Mond: Astronomisch berechnet</div>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: COLORS.textMuted }}>
            Datenlizenz Pegel: Deutschland Zero 2.0 (dl-zero-de/2.0)
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Welcome Screen ───────────────────────────────────────────────────────────
const WelcomeScreen = ({ onDismiss }) => (
  <div style={{ position: 'fixed', inset: 0, background: '#000000cc', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 24, maxWidth: 400, width: '100%' }}>
      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 28, color: COLORS.teal, textAlign: 'center', marginBottom: 6 }}>🎣 FishLog Pro</div>
      <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginBottom: 20 }}>Version 4.0 – Amtliche Datenquellen</div>
      {[
        ['📍', 'Standort ermitteln', 'GPS, Ortssuche oder manuelle Koordinaten'],
        ['🌤', 'Daten automatisch laden', 'Wetter, Pegel & Mondphase werden automatisch abgerufen'],
        ['📊', 'Fänge analysieren', 'Erkenntnisse aus Diagrammen & Statistiken gewinnen'],
      ].map(([icon, title, desc], i) => (
        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 24, flexShrink: 0 }}>{icon}</div>
          <div><div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div><div style={{ fontSize: 12, color: COLORS.textMuted }}>{desc}</div></div>
        </div>
      ))}
      <div style={{ background: '#f59e0b22', border: '1px solid #f59e0b44', borderRadius: 8, padding: 10, fontSize: 12, color: COLORS.amber, marginBottom: 16 }}>
        💡 Tipp: Für Meeresströmungen & Wellendaten einen kostenlosen Stormglass-Key in den Einstellungen eingeben.
      </div>
      <button style={{ ...S.btn(COLORS.teal), width: '100%', justifyContent: 'center', fontSize: 15 }} onClick={onDismiss}>
        Los geht's! 🎣
      </button>
    </div>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function FishLogPro() {
  const [tab, setTab] = useState(0);
  const [catches, setCatches] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; }
  });
  const [toast_, setToast] = useState(null);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('fishlog_welcomed'));

  const toast = (msg, type = 'success') => setToast({ msg, type });

  const handleSave = () => {
    try { setCatches(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch {}
  };

  const handleSettingsChange = (s) => {
    setSettings(s);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
  };

  const dismissWelcome = () => {
    localStorage.setItem('fishlog_welcomed', '1');
    setShowWelcome(false);
  };

  const TABS = [
    { icon: <Fish size={20}/>, label: 'Fang' },
    { icon: <BookOpen size={20}/>, label: 'Logbuch' },
    { icon: <BarChart2 size={20}/>, label: 'Analyse' },
    { icon: <Settings size={20}/>, label: 'Einstellungen' },
  ];

  return (
    <div style={S.app}>
      {showWelcome && <WelcomeScreen onDismiss={dismissWelcome}/>}
      {toast_ && <Toast msg={toast_.msg} type={toast_.type} onClose={() => setToast(null)}/>}

      <div style={S.header}>
        <Fish size={22} color={COLORS.teal}/>
        <div>
          <div style={S.headerTitle}>FishLog Pro</div>
          <div style={S.headerSub}>Amtliche Quellen: DWD · WSV · BSH · DMI</div>
        </div>
      </div>

      <div style={{ overflowY: 'auto' }}>
        {tab === 0 && <FangTab settings={settings} onSave={handleSave} toast={toast}/>}
        {tab === 1 && <LogbuchTab catches={catches} onUpdate={handleSave}/>}
        {tab === 2 && <AnalyseTab catches={catches}/>}
        {tab === 3 && <EinstellungenTab settings={settings} onSettingsChange={handleSettingsChange} catches={catches} toast={toast}/>}
      </div>

      <nav style={S.nav}>
        {TABS.map((t, i) => (
          <button key={i} style={S.navBtn(tab === i)} onClick={() => setTab(i)}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ textAlign: 'center', fontSize: 10, color: COLORS.textMuted, padding: '8px 0 90px', borderTop: `1px solid ${COLORS.border}` }}>
        DE: Wetter: Open-Meteo/DWD | Pegel: PEGELONLINE/WSV © | Gezeiten: BSH<br/>
        DK: Wetter+Ozean: DMI – Danmarks Meteorologiske Institut
        {settings.stormglassKey ? ' | + Stormglass.io (Marinedaten)' : ''}
      </div>
    </div>
  );
}
