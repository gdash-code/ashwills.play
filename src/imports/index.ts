/**
 * Ash Wills — Musician • Artist • Tech Wizard Desktop OS
 * LimeWire Studio • EPK • Kindness Box • Visual Art • WebAudio & Gemini AI
 */
import '@tailwindcss/browser';
import { GoogleGenAI } from '@google/genai';

// --- State & References ---
const desktop = document.getElementById('desktop') as HTMLDivElement;
const windows = document.querySelectorAll('.window') as NodeListOf<HTMLDivElement>;
const icons = document.querySelectorAll('.icon') as NodeListOf<HTMLDivElement>;
const startMenu = document.getElementById('start-menu') as HTMLDivElement;
const startButton = document.getElementById('start-button') as HTMLButtonElement;
const taskbarAppsContainer = document.getElementById('taskbar-apps') as HTMLDivElement;
const taskbarClock = document.getElementById('taskbar-clock') as HTMLDivElement;

let activeWindow: HTMLDivElement | null = null;
let highestZIndex: number = 20;
const openApps = new Map<string, { windowEl: HTMLDivElement; taskbarButton: HTMLDivElement }>();

// Gemini AI Client Instance
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (apiKey) {
      try {
        aiClient = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn("Failed to initialize GoogleGenAI client:", err);
      }
    }
  }
  return aiClient;
}

// --- Taskbar Clock ---
function updateClock() {
  if (!taskbarClock) return;
  const now = new Date();
  taskbarClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// --- Core Window Manager Functions ---
function bringToFront(windowElement: HTMLDivElement): void {
  if (activeWindow === windowElement) return;

  if (activeWindow) {
    activeWindow.classList.remove('active');
    const appName = activeWindow.id;
    if (openApps.has(appName)) {
      openApps.get(appName)?.taskbarButton.classList.remove('active');
    }
  }

  highestZIndex++;
  windowElement.style.zIndex = highestZIndex.toString();
  windowElement.classList.add('active');
  activeWindow = windowElement;

  const appNameRef = windowElement.id;
  if (openApps.has(appNameRef)) {
    openApps.get(appNameRef)?.taskbarButton.classList.add('active');
  }
}

async function openApp(appName: string): Promise<void> {
  const windowElement = document.getElementById(appName) as HTMLDivElement | null;
  if (!windowElement) {
    console.error(`Window element not found for app: ${appName}`);
    return;
  }

  if (openApps.has(appName)) {
    bringToFront(windowElement);
    windowElement.style.display = 'flex';
    windowElement.classList.add('active');
    return;
  }

  windowElement.style.display = 'flex';
  windowElement.classList.add('active');
  bringToFront(windowElement);

  const taskbarButton = document.createElement('div');
  taskbarButton.classList.add('taskbar-app');
  taskbarButton.dataset.appName = appName;

  let title = appName;
  const iconElement = document.getElementById(`icon-${appName}`);
  if (iconElement) {
    const span = iconElement.querySelector('span');
    if (span) title = span.textContent || appName;
  } else {
    switch (appName) {
      case 'vipSignup': title = 'Join VIP List'; break;
      case 'musicPlayer': title = 'LimeWire Studio'; break;
      case 'epkWindow': title = 'EPK Press Kit'; break;
      case 'kindnessBox': title = 'Kindness Box'; break;
      case 'desktopSettings': title = 'Background Colors'; break;
      case 'artGallery': title = 'Visual Art'; break;
      case 'techWizardry': title = 'Tech Wizardry'; break;
      case 'aboutBio': title = 'Ash Bio & Press'; break;
      case 'minesweeper': title = 'Retro Break'; break;
    }
  }

  taskbarButton.appendChild(document.createTextNode(title));

  taskbarButton.addEventListener('click', () => {
    if (windowElement === activeWindow && windowElement.style.display !== 'none') {
      minimizeApp(appName);
    } else {
      windowElement.style.display = 'flex';
      bringToFront(windowElement);
    }
  });

  taskbarAppsContainer.appendChild(taskbarButton);
  openApps.set(appName, { windowEl: windowElement, taskbarButton });
  taskbarButton.classList.add('active');

  // Trigger app-specific initializations
  if (appName === 'artGallery') {
    initArtGalleryCanvas();
  } else if (appName === 'techWizardry') {
    initTerminal();
  } else if (appName === 'minesweeper') {
    initMinesweeper();
  } else if (appName === 'kindnessBox') {
    renderKindnessNotesWall();
  }
}

function closeApp(appName: string): void {
  const appData = openApps.get(appName);
  if (!appData) return;

  const { windowEl, taskbarButton } = appData;
  windowEl.style.display = 'none';
  windowEl.classList.remove('active');
  taskbarButton.remove();
  openApps.delete(appName);

  if (appName === 'musicPlayer') {
    stopCurrentCustomAudio();
  }

  if (activeWindow === windowEl) {
    activeWindow = null;
    let nextAppToActivate: HTMLDivElement | null = null;
    let maxZ = -1;
    openApps.forEach((data) => {
      const z = parseInt(data.windowEl.style.zIndex || '0', 10);
      if (z > maxZ) {
        maxZ = z;
        nextAppToActivate = data.windowEl;
      }
    });
    if (nextAppToActivate) {
      bringToFront(nextAppToActivate);
    }
  }
}

function minimizeApp(appName: string): void {
  const appData = openApps.get(appName);
  if (!appData) return;

  const { windowEl, taskbarButton } = appData;
  windowEl.style.display = 'none';
  windowEl.classList.remove('active');
  taskbarButton.classList.remove('active');

  if (activeWindow === windowEl) {
    activeWindow = null;
    let nextAppToActivate: string | null = null;
    let maxZ = 0;
    openApps.forEach((data, name) => {
      if (data.windowEl.style.display !== 'none') {
        const z = parseInt(data.windowEl.style.zIndex || '0', 10);
        if (z > maxZ) {
          maxZ = z;
          nextAppToActivate = name;
        }
      }
    });
    if (nextAppToActivate) {
      bringToFront(openApps.get(nextAppToActivate)!.windowEl);
    }
  }
}

// Window Event Listeners & Dragging
windows.forEach((windowElement) => {
  const titleBar = windowElement.querySelector('.window-titlebar') as HTMLDivElement | null;
  const closeButton = windowElement.querySelector('.window-close') as HTMLDivElement | null;
  const minimizeButton = windowElement.querySelector('.window-minimize') as HTMLDivElement | null;

  windowElement.addEventListener('mousedown', () => bringToFront(windowElement), true);

  if (closeButton) {
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      closeApp(windowElement.id);
    });
  }

  if (minimizeButton) {
    minimizeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      minimizeApp(windowElement.id);
    });
  }

  if (titleBar) {
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const startDragging = (e: MouseEvent) => {
      if (!(e.target === titleBar || titleBar.contains(e.target as Node)) || (e.target as Element).closest('.window-control-button')) {
        isDragging = false;
        return;
      }
      isDragging = true;
      bringToFront(windowElement);
      const rect = windowElement.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      titleBar.style.cursor = 'grabbing';
      document.addEventListener('mousemove', dragWindow);
      document.addEventListener('mouseup', stopDragging, { once: true });
    };

    const dragWindow = (e: MouseEvent) => {
      if (!isDragging) return;
      let x = e.clientX - dragOffsetX;
      let y = e.clientY - dragOffsetY;
      const maxY = window.innerHeight - windowElement.offsetHeight - 36;
      x = Math.max(0, Math.min(x, window.innerWidth - windowElement.offsetWidth));
      y = Math.max(38, Math.min(y, maxY));
      windowElement.style.left = `${x}px`;
      windowElement.style.top = `${y}px`;
    };

    const stopDragging = () => {
      if (!isDragging) return;
      isDragging = false;
      titleBar.style.cursor = 'grab';
      document.removeEventListener('mousemove', dragWindow);
    };

    titleBar.addEventListener('mousedown', startDragging);
  }
});

// Icon and Quick Launch Clicks
icons.forEach((icon) => {
  icon.addEventListener('click', () => {
    const appName = icon.getAttribute('data-app');
    if (appName) {
      openApp(appName);
      startMenu.classList.remove('active');
    }
  });
});

document.querySelectorAll('.quick-launch-btn, .open-app-trigger').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const target = e.currentTarget as HTMLElement;
    const appName = target.getAttribute('data-app');
    if (appName) {
      openApp(appName);
      startMenu.classList.remove('active');
    }
  });
});

document.querySelectorAll('.start-menu-item').forEach((item) => {
  item.addEventListener('click', () => {
    const appName = (item as HTMLElement).getAttribute('data-app');
    if (appName) openApp(appName);
    startMenu.classList.remove('active');
  });
});

startButton.addEventListener('click', (e) => {
  e.stopPropagation();
  startMenu.classList.toggle('active');
  if (startMenu.classList.contains('active')) {
    highestZIndex++;
    startMenu.style.zIndex = highestZIndex.toString();
  }
});

document.addEventListener('click', (e) => {
  if (startMenu.classList.contains('active') && !startMenu.contains(e.target as Node) && !startButton.contains(e.target as Node)) {
    startMenu.classList.remove('active');
  }
});

// ==========================================
// 1. VIP SIGN-UP & LEAD CAPTURE ENGINE
// ==========================================
interface LeadRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  interests: string[];
  smsOptIn: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'ash_wills_vip_leads';

function getSavedLeads(): LeadRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLead(record: LeadRecord) {
  const leads = getSavedLeads();
  leads.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  updateAdminLeadsUI();
}

function updateAdminLeadsUI() {
  const leads = getSavedLeads();
  const countEl = document.getElementById('lead-count-num');
  const listEl = document.getElementById('leads-preview-list');
  if (countEl) countEl.textContent = leads.length.toString();

  if (listEl) {
    if (leads.length === 0) {
      listEl.innerHTML = '<div style="color: #888; font-style: italic;">No subscriber leads collected yet.</div>';
    } else {
      listEl.innerHTML = leads.map(l => `
        <div style="border-bottom: 1px solid #eee; padding: 4px 0;">
          <strong>${escapeHtml(l.name)}</strong> (${escapeHtml(l.email)} | ${escapeHtml(l.phone)}) - <span style="color: #666;">${new Date(l.timestamp).toLocaleDateString()}</span>
        </div>
      `).join('');
    }
  }
}

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m] || m));
}

const vipForm = document.getElementById('vip-form') as HTMLFormElement | null;
const vipSuccessMessage = document.getElementById('vip-success-message') as HTMLDivElement | null;
const vipResetBtn = document.getElementById('vip-reset-btn') as HTMLButtonElement | null;
const toggleAdminBtn = document.getElementById('toggle-admin-btn') as HTMLButtonElement | null;
const adminExportArea = document.getElementById('admin-export-area') as HTMLDivElement | null;
const exportCsvBtn = document.getElementById('export-csv-btn') as HTMLButtonElement | null;
const clearLeadsBtn = document.getElementById('clear-leads-btn') as HTMLButtonElement | null;

if (vipForm) {
  vipForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('vip-name') as HTMLInputElement;
    const emailInput = document.getElementById('vip-email') as HTMLInputElement;
    const countryCodeSelect = document.getElementById('vip-country-code') as HTMLSelectElement;
    const phoneInput = document.getElementById('vip-phone') as HTMLInputElement;
    const smsOptInCheck = document.getElementById('vip-sms-optin') as HTMLInputElement;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = `${countryCodeSelect.value} ${phoneInput.value.trim()}`;
    const smsOptIn = smsOptInCheck.checked;

    const interestBoxes = document.querySelectorAll('input[name="interest"]:checked') as NodeListOf<HTMLInputElement>;
    const interests = Array.from(interestBoxes).map(b => b.value);

    if (!email || !phoneInput.value.trim()) {
      alert("Please provide both an Email Address and Phone Number.");
      return;
    }

    const newLead: LeadRecord = {
      id: 'lead_' + Date.now(),
      name: name || 'VIP Fan',
      email,
      phone,
      interests,
      smsOptIn,
      timestamp: new Date().toISOString()
    };

    saveLead(newLead);

    vipForm.style.display = 'none';
    if (vipSuccessMessage) vipSuccessMessage.style.display = 'block';

    playChime();
  });
}

function playChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (err) {}
}

if (vipResetBtn && vipForm && vipSuccessMessage) {
  vipResetBtn.addEventListener('click', () => {
    vipForm.reset();
    vipForm.style.display = 'flex';
    vipSuccessMessage.style.display = 'none';
  });
}

if (toggleAdminBtn && adminExportArea) {
  toggleAdminBtn.addEventListener('click', () => {
    const isHidden = adminExportArea.style.display === 'none';
    adminExportArea.style.display = isHidden ? 'block' : 'none';
    updateAdminLeadsUI();
  });
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener('click', () => {
    const leads = getSavedLeads();
    if (leads.length === 0) {
      alert("No leads collected yet!");
      return;
    }
    const headers = ["ID", "Name", "Email", "Phone", "Interests", "SMS Opt-In", "Timestamp"];
    const csvRows = [headers.join(",")];

    leads.forEach(l => {
      const row = [
        l.id,
        `"${l.name.replace(/"/g, '""')}"`,
        `"${l.email.replace(/"/g, '""')}"`,
        `"${l.phone.replace(/"/g, '""')}"`,
        `"${l.interests.join("; ")}"`,
        l.smsOptIn ? "Yes" : "No",
        `"${l.timestamp}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `Ash_Wills_VIP_Subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

if (clearLeadsBtn) {
  clearLeadsBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear locally stored leads?")) {
      localStorage.removeItem(STORAGE_KEY);
      updateAdminLeadsUI();
    }
  });
}

updateAdminLeadsUI();

// ==========================================
// 2. ENTRY GATE ENGINE (DRAW / NOTE & RETURNING SUBSCRIBER PASSCODE)
// ==========================================
function initEntryGate() {
  const gateOverlay = document.getElementById('entry-gate-overlay') as HTMLDivElement | null;
  const firstTimeView = document.getElementById('gate-first-time-view') as HTMLDivElement | null;
  const returningView = document.getElementById('gate-vip-returning-view') as HTMLDivElement | null;
  const vipNameHeading = document.getElementById('vip-welcome-name');
  const passcodeGrid = document.getElementById('passcode-options-grid');
  const gateUnlockBtn = document.getElementById('gate-unlock-btn');

  if (!gateOverlay) return;

  const leads = getSavedLeads();
  const isSubscriber = leads.length > 0;

  if (isSubscriber && returningView && firstTimeView) {
    // Show Returning VIP Subscriber Challenge
    firstTimeView.style.display = 'none';
    returningView.style.display = 'block';

    const latestSubscriber = leads[0];
    if (vipNameHeading) {
      vipNameHeading.textContent = `Welcome back, ${latestSubscriber.name}!`;
    }

    // Generate 3 random passcodes (all grant access for now)
    const passcodeWordsList = [
      ["[CYBER-SYNTH-95]", "[NEON-AURA-42]", "[WIZARD-FREQ-77]"],
      ["[LIMEWIRE-TURBO-04]", "[ACOUSTIC-SOUL-11]", "[PROPHET-RESONANCE-88]"],
      ["[VIP-ACCESS-GRANTED]", "[MATRIX-CIPHER-26]", "[ELECTRIC-SOLITUDE-99]"]
    ];

    const randomSet = passcodeWordsList[Math.floor(Math.random() * passcodeWordsList.length)];

    if (passcodeGrid) {
      passcodeGrid.innerHTML = randomSet.map((code, i) => `
        <button class="passcode-btn" data-code="${code}">
          <span>🔑 Passcode ${i + 1}: <strong>${code}</strong></span>
          <span>ENTER ➔</span>
        </button>
      `).join('');

      passcodeGrid.querySelectorAll('.passcode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          unlockGate();
        });
      });
    }

  } else {
    // First-Time Visitor Mode (Draw something or leave a note)
    initGateSketchpad();
  }

  // Gate Tabs (Draw vs Note)
  const drawTabBtn = document.getElementById('gate-tab-draw-btn');
  const noteTabBtn = document.getElementById('gate-tab-note-btn');
  const drawPanel = document.getElementById('gate-draw-panel');
  const notePanel = document.getElementById('gate-note-panel');

  if (drawTabBtn && noteTabBtn && drawPanel && notePanel) {
    drawTabBtn.addEventListener('click', () => {
      drawTabBtn.classList.add('active');
      noteTabBtn.classList.remove('active');
      drawPanel.classList.add('active');
      notePanel.classList.remove('active');
    });

    noteTabBtn.addEventListener('click', () => {
      noteTabBtn.classList.add('active');
      drawTabBtn.classList.remove('active');
      notePanel.classList.add('active');
      drawPanel.classList.remove('active');
    });
  }

  if (gateUnlockBtn) {
    gateUnlockBtn.addEventListener('click', () => {
      // If user typed a note in the gate, save it to kindness notes
      const noteInput = document.getElementById('gate-note-input') as HTMLTextAreaElement | null;
      if (noteInput && noteInput.value.trim()) {
        saveKindnessNote(noteInput.value.trim(), true);
      }
      unlockGate();
    });
  }

  function unlockGate() {
    playChime();
    gateOverlay.style.opacity = '0';
    gateOverlay.style.transition = 'opacity 0.4s ease';
    setTimeout(() => {
      gateOverlay.style.display = 'none';
      openApp('musicPlayer');
    }, 400);
  }
}

function initGateSketchpad() {
  const canvas = document.getElementById('gate-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let isDrawing = false;
  let currentColor = '#00e5ff';

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  function getPos(e: MouseEvent | TouchEvent) {
    const rect = canvas!.getBoundingClientRect();
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function start(e: MouseEvent | TouchEvent) {
    isDrawing = true;
    const pos = getPos(e);
    ctx!.beginPath();
    ctx!.moveTo(pos.x, pos.y);
    ctx!.strokeStyle = currentColor;
    ctx!.lineWidth = 3;
    ctx!.lineCap = 'round';
  }

  function draw(e: MouseEvent | TouchEvent) {
    if (!isDrawing) return;
    const pos = getPos(e);
    ctx!.lineTo(pos.x, pos.y);
    ctx!.stroke();
  }

  function stop() { isDrawing = false; }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stop);
  canvas.addEventListener('mouseleave', stop);

  canvas.addEventListener('touchstart', start, { passive: true });
  canvas.addEventListener('touchmove', draw, { passive: true });
  canvas.addEventListener('touchend', stop);

  document.querySelectorAll('#gate-draw-panel .swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('#gate-draw-panel .swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      currentColor = swatch.getAttribute('data-color') || '#00e5ff';
    });
  });

  const clearBtn = document.getElementById('gate-clear-canvas-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
  }
}

// Launch entry gate check
initEntryGate();

// ==========================================
// 3. LIMEWIRE MUSIC PLAYER & AUDIO ENGINE
// ==========================================
interface P2PTrack {
  id: string;
  name: string;
  artist: string;
  bitrate: string;
  size: string;
  src?: string;
  isCustomUpload?: boolean;
}

const p2pTracks: P2PTrack[] = [
  { id: '1', name: 'Midnight Neon Cipher.mp3', artist: 'Ash Wills', bitrate: '320 kbps', size: '8.7 MB' },
  { id: '2', name: 'Resonance of the Void.mp3', artist: 'Ash Wills', bitrate: '320 kbps', size: '9.4 MB' },
  { id: '3', name: 'Analog Soul in Digital Code.mp3', artist: 'Ash Wills', bitrate: '320 kbps', size: '7.6 MB' },
];

let activeAudio: HTMLAudioElement | null = null;
let activeSynthOsc: OscillatorNode | null = null;
let activeSynthAudioCtx: AudioContext | null = null;

function renderLimeWireTracksTable() {
  const tbody = document.getElementById('limewire-tracks-tbody');
  const countEl = document.getElementById('lime-library-count');
  if (countEl) countEl.textContent = `${p2pTracks.length} Tracks`;

  if (!tbody) return;
  tbody.innerHTML = p2pTracks.map(t => `
    <tr data-trackid="${t.id}">
      <td><span style="color:#39ff14;">🟢 Ready</span></td>
      <td><strong>${escapeHtml(t.name)}</strong></td>
      <td>${escapeHtml(t.artist)}</td>
      <td>${t.bitrate}</td>
      <td>${t.size}</td>
      <td><button class="win95-btn small-btn lime-play-row-btn" data-trackid="${t.id}">▶ Play</button></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.lime-play-row-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const trId = btn.getAttribute('data-trackid');
      const track = p2pTracks.find(t => t.id === trId);
      if (track) playLimeWireTrack(track);
    });
  });
}

function playLimeWireTrack(track: P2PTrack) {
  stopCurrentCustomAudio();
  const label = document.getElementById('lime-now-playing-label');
  if (label) label.textContent = `▶ Playing: ${track.name} (${track.artist})`;

  if (track.src) {
    activeAudio = new Audio(track.src);
    activeAudio.play().catch(e => console.warn("Audio play error:", e));
  } else {
    // WebAudio fallback synth tune for built-in tracks
    try {
      activeSynthAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      activeSynthOsc = activeSynthAudioCtx.createOscillator();
      const gain = activeSynthAudioCtx.createGain();
      activeSynthOsc.type = 'sawtooth';
      activeSynthOsc.frequency.setValueAtTime(220, activeSynthAudioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, activeSynthAudioCtx.currentTime);
      activeSynthOsc.connect(gain);
      gain.connect(activeSynthAudioCtx.destination);
      activeSynthOsc.start();
    } catch (e) {}
  }
}

function stopCurrentCustomAudio() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  if (activeSynthOsc) {
    try { activeSynthOsc.stop(); } catch (e) {}
    activeSynthOsc = null;
  }
  const label = document.getElementById('lime-now-playing-label');
  if (label) label.textContent = 'Select a track to play';
}

const limePlayBtn = document.getElementById('lime-play-btn');
const limeStopBtn = document.getElementById('lime-stop-btn');

if (limePlayBtn) {
  limePlayBtn.addEventListener('click', () => {
    if (p2pTracks.length > 0) playLimeWireTrack(p2pTracks[0]);
  });
}

if (limeStopBtn) {
  limeStopBtn.addEventListener('click', stopCurrentCustomAudio);
}

// LimeWire Tab Switcher
document.querySelectorAll('.limewire-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.limewire-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.limewire-tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-limetab');
    if (tabId) {
      const pane = document.getElementById(tabId);
      if (pane) pane.classList.add('active');
    }
  });
});

// Vevo Video Selector Buttons
document.querySelectorAll('.vevo-item-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.vevo-item-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const ytId = btn.getAttribute('data-ytid');
    const iframe = document.getElementById('music-video-iframe') as HTMLIFrameElement | null;
    if (iframe && ytId) {
      iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1`;
    }
  });
});

// Custom Music Upload Handling
const browseAudioBtn = document.getElementById('browse-audio-btn');
const musicFileInput = document.getElementById('music-file-input') as HTMLInputElement | null;
const musicDropzone = document.getElementById('music-upload-dropzone');
const uploadStatusText = document.getElementById('upload-status-text');

if (browseAudioBtn && musicFileInput) {
  browseAudioBtn.addEventListener('click', () => musicFileInput.click());
  musicFileInput.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) handleAudioFileUpload(files[0]);
  });
}

if (musicDropzone) {
  musicDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    musicDropzone.style.borderColor = '#39ff14';
  });
  musicDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleAudioFileUpload(e.dataTransfer.files[0]);
    }
  });
}

function handleAudioFileUpload(file: File) {
  const fileUrl = URL.createObjectURL(file);
  const newTrack: P2PTrack = {
    id: 'upload_' + Date.now(),
    name: file.name,
    artist: 'Uploaded Track',
    bitrate: '320 kbps (Local)',
    size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
    src: fileUrl,
    isCustomUpload: true
  };

  p2pTracks.unshift(newTrack);
  renderLimeWireTracksTable();

  if (uploadStatusText) {
    uploadStatusText.textContent = `✅ Successfully added "${file.name}" to LimeWire library!`;
  }
  playLimeWireTrack(newTrack);
}

renderLimeWireTracksTable();

// ==========================================
// 4. ANONYMOUS KINDNESS BOX ENGINE
// ==========================================
interface KindnessNote {
  id: string;
  text: string;
  timestamp: string;
  isAnon: boolean;
}

const KINDNESS_STORAGE_KEY = 'ash_wills_kindness_notes';

function getSavedKindnessNotes(): KindnessNote[] {
  try {
    const raw = localStorage.getItem(KINDNESS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Pre-fill default warm notes if empty
  return [
    {
      id: 'note_1',
      text: "Love the retro LimeWire interface and acoustic synth fusion! Keep building awesome stuff, Ash!",
      timestamp: new Date().toISOString(),
      isAnon: true
    },
    {
      id: 'note_2',
      text: "The music videos and visual art are super inspiring. Keep pushing boundaries!",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isAnon: true
    }
  ];
}

function saveKindnessNote(text: string, isAnon: boolean = true) {
  const notes = getSavedKindnessNotes();
  notes.unshift({
    id: 'note_' + Date.now(),
    text,
    timestamp: new Date().toISOString(),
    isAnon
  });
  localStorage.setItem(KINDNESS_STORAGE_KEY, JSON.stringify(notes));
  renderKindnessNotesWall();
}

function renderKindnessNotesWall() {
  const wallEl = document.getElementById('kindness-messages-wall');
  if (!wallEl) return;
  const notes = getSavedKindnessNotes();

  wallEl.innerHTML = notes.map(n => `
    <div class="kindness-card">
      <div>"${escapeHtml(n.text)}"</div>
      <div class="kindness-card-meta">
        — ${n.isAnon ? 'Anonymous Supporter' : 'Visitor'} • ${new Date(n.timestamp).toLocaleDateString()}
      </div>
    </div>
  `).join('');
}

const kindnessForm = document.getElementById('kindness-form') as HTMLFormElement | null;
if (kindnessForm) {
  kindnessForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const textarea = document.getElementById('kindness-text') as HTMLTextAreaElement | null;
    const anonCheck = document.getElementById('kindness-anon-check') as HTMLInputElement | null;
    if (textarea && textarea.value.trim()) {
      saveKindnessNote(textarea.value.trim(), anonCheck ? anonCheck.checked : true);
      textarea.value = '';
      playChime();
    }
  });
}

// Initial kindness notes render
renderKindnessNotesWall();

// ==========================================
// 5. DESKTOP BACKGROUND & COLOR TOGGLES
// ==========================================
function setDesktopBackgroundColor(color: string) {
  document.body.style.backgroundColor = color;
  if (desktop) {
    desktop.style.background = color;
  }
}

document.querySelectorAll('.bg-swatch-btn, .color-preset-card').forEach(btn => {
  btn.addEventListener('click', () => {
    const color = btn.getAttribute('data-color') || btn.getAttribute('data-bg');
    if (color) setDesktopBackgroundColor(color);
  });
});

const applyCustomBgBtn = document.getElementById('apply-custom-bg-btn');
const customBgPicker = document.getElementById('custom-bg-picker') as HTMLInputElement | null;

if (applyCustomBgBtn && customBgPicker) {
  applyCustomBgBtn.addEventListener('click', () => {
    setDesktopBackgroundColor(customBgPicker.value);
  });
}

// ==========================================
// 6. EPK (ELECTRONIC PRESS KIT) DOWNLOADS & UPLOADS
// ==========================================
const downloadBioBtn = document.getElementById('epk-download-bio-btn');
const downloadPhotosBtn = document.getElementById('epk-download-photos-btn');
const downloadRiderBtn = document.getElementById('epk-download-rider-btn');

function triggerDownload(filename: string, textContent: string) {
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

if (downloadBioBtn) {
  downloadBioBtn.addEventListener('click', () => {
    triggerDownload('Ash_Wills_Artist_Bio_2026.txt', `ASH WILLS — OFFICIAL ARTIST BIOGRAPHY (2026)\n\nAsh Wills operates at the intersection of sound, visual expression, and computer science. As a musician, Ash crafts synth-infused alternative tracks with rich guitar harmonies and electronic textures. As a visual artist, Ash creates vibrant digital art, album cover designs, and generative pieces. As a tech wizard, Ash builds custom web engines, audio visualizers, and AI tools.\n\nWebsite: https://ashwills.com\nContact: ashthewill@gmail.com`);
  });
}

if (downloadPhotosBtn) {
  downloadPhotosBtn.addEventListener('click', () => {
    alert("Downloading high-resolution press photos archive package...");
    triggerDownload('Ash_Wills_HiRes_Photos_Link.txt', `HIGH-RES PRESS PHOTOS DOWNLOAD LINK:\n\n1. Cyberpunk Synth Set (300DPI): https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4\n2. Acoustic Stage Live: https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe\n\nCredit: Ash Wills Creative Studio`);
  });
}

if (downloadRiderBtn) {
  downloadRiderBtn.addEventListener('click', () => {
    triggerDownload('Ash_Wills_Tech_Rider_2026.txt', `ASH WILLS — STAGE & TECH RIDER\n\n- 2 Stereo DI Out (Prophet 6 Synth / Moog)\n- 1 Acoustic Guitar XLR (Hi-Z Input)\n- 1 Vocal Mic (Neumann KMS 105 or Shure SM58)\n- HDMI Video Feed for Live Generative Shaders`);
  });
}

const epkBrowseBtn = document.getElementById('epk-browse-btn');
const epkFileInput = document.getElementById('epk-file-input') as HTMLInputElement | null;
const epkUploadedList = document.getElementById('epk-uploaded-files-list');

if (epkBrowseBtn && epkFileInput) {
  epkBrowseBtn.addEventListener('click', () => epkFileInput.click());
  epkFileInput.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0 && epkUploadedList) {
      const f = files[0];
      const div = document.createElement('div');
      div.style.fontSize = '0.75rem';
      div.style.marginTop = '4px';
      div.innerHTML = `📄 <strong>${escapeHtml(f.name)}</strong> (${(f.size / 1024).toFixed(1)} KB) - Added`;
      epkUploadedList.appendChild(div);
      playChime();
    }
  });
}

// ==========================================
// 7. VISUAL ART GALLERY & SKETCHPAD
// ==========================================
interface Artwork {
  id: string;
  title: string;
  medium: string;
  year: string;
  desc: string;
  imgUrl: string;
}

const ARTWORKS: Artwork[] = [
  {
    id: 'art1',
    title: 'Cybernetic Solitude',
    medium: 'Digital Painting & Generative Shaders',
    year: '2026',
    desc: 'An exploration of human introspection surrounded by neon networks and glowing cyber horizons.',
    imgUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'art2',
    title: 'Circuitry & Cosmos',
    medium: 'Generative Code & Canvas',
    year: '2025',
    desc: 'Algorithmic geometric structures mapping musical octave frequencies into visual spectra.',
    imgUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'art3',
    title: 'Neon Skyline 1995',
    medium: 'Pixel Art & Mixed Vector',
    year: '2025',
    desc: 'A nostalgic homage to mid-90s desktop computing and retro wave aesthetic.',
    imgUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'art4',
    title: 'Analog Frequencies',
    medium: 'Oil on Canvas & High-Res Scan',
    year: '2024',
    desc: 'Physical oil painting capturing fluid soundwaves and acoustic warmth.',
    imgUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80'
  }
];

function renderGalleryGrid() {
  const container = document.getElementById('gallery-cards-container');
  if (!container) return;

  container.innerHTML = ARTWORKS.map(art => `
    <div class="art-card" data-artid="${art.id}">
      <img src="${art.imgUrl}" alt="${escapeHtml(art.title)}" />
      <div class="art-card-title">${escapeHtml(art.title)}</div>
      <div class="art-card-meta">${escapeHtml(art.medium)} (${art.year})</div>
    </div>
  `).join('');

  container.querySelectorAll('.art-card').forEach(card => {
    card.addEventListener('click', () => {
      const artId = card.getAttribute('data-artid');
      const item = ARTWORKS.find(a => a.id === artId);
      if (item) openArtModal(item);
    });
  });
}

const artModal = document.getElementById('art-modal');
const closeArtModalBtn = document.getElementById('close-art-modal-btn');
const inquirePrintBtn = document.getElementById('inquire-print-btn');

function openArtModal(art: Artwork) {
  if (!artModal) return;
  const titleEl = document.getElementById('art-modal-title');
  const imgEl = document.getElementById('art-modal-img') as HTMLImageElement | null;
  const descEl = document.getElementById('art-modal-desc');
  const mediumEl = document.getElementById('art-modal-medium');
  const yearEl = document.getElementById('art-modal-year');

  if (titleEl) titleEl.textContent = art.title;
  if (imgEl) imgEl.src = art.imgUrl;
  if (descEl) descEl.textContent = art.desc;
  if (mediumEl) mediumEl.textContent = art.medium;
  if (yearEl) yearEl.textContent = art.year;

  artModal.style.display = 'flex';
}

if (closeArtModalBtn && artModal) {
  closeArtModalBtn.addEventListener('click', () => {
    artModal.style.display = 'none';
  });
}

if (inquirePrintBtn) {
  inquirePrintBtn.addEventListener('click', () => {
    if (artModal) artModal.style.display = 'none';
    openApp('vipSignup');
  });
}

document.querySelectorAll('.art-subtab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.art-subtab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.art-subtab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-arttab');
    if (tabId) {
      const pane = document.getElementById(tabId);
      if (pane) pane.classList.add('active');
      if (tabId === 'studio-canvas') initArtGalleryCanvas();
    }
  });
});

renderGalleryGrid();

let canvasInitialized = false;
function initArtGalleryCanvas() {
  const canvas = document.getElementById('paint-canvas') as HTMLCanvasElement | null;
  if (!canvas || canvasInitialized) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let isDrawing = false;
  let currentColor = '#000000';
  let currentSize = 3;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  function getPos(e: MouseEvent | TouchEvent) {
    const rect = canvas!.getBoundingClientRect();
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function start(e: MouseEvent | TouchEvent) {
    isDrawing = true;
    const pos = getPos(e);
    ctx!.beginPath();
    ctx!.moveTo(pos.x, pos.y);
    ctx!.strokeStyle = currentColor;
    ctx!.lineWidth = currentSize;
    ctx!.lineCap = 'round';
    ctx!.lineJoin = 'round';
  }

  function draw(e: MouseEvent | TouchEvent) {
    if (!isDrawing) return;
    const pos = getPos(e);
    ctx!.lineTo(pos.x, pos.y);
    ctx!.stroke();
  }

  function stop() { isDrawing = false; }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stop);
  canvas.addEventListener('mouseleave', stop);

  canvas.addEventListener('touchstart', start, { passive: true });
  canvas.addEventListener('touchmove', draw, { passive: true });
  canvas.addEventListener('touchend', stop);

  document.querySelectorAll('.paint-color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.paint-color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      currentColor = swatch.getAttribute('data-color') || '#000000';
    });
  });

  document.querySelectorAll('.paint-size-button').forEach(sizeBtn => {
    sizeBtn.addEventListener('click', () => {
      document.querySelectorAll('.paint-size-button').forEach(s => s.classList.remove('active'));
      sizeBtn.classList.add('active');
      currentSize = parseInt(sizeBtn.getAttribute('data-size') || '3', 10);
    });
  });

  const clearBtn = document.querySelector('.paint-clear-button');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
  }

  canvasInitialized = true;
}

// ==========================================
// 8. TECH WIZARDRY TERMINAL ENGINE
// ==========================================
let terminalInitialized = false;

function initTerminal() {
  if (terminalInitialized) return;
  const terminalInput = document.getElementById('terminal-input') as HTMLInputElement | null;
  const terminalOutput = document.getElementById('terminal-output');

  if (!terminalInput || !terminalOutput) return;

  function printLine(text: string, className: string = 'term-line') {
    const div = document.createElement('div');
    div.className = className;
    div.innerHTML = text;
    terminalOutput!.appendChild(div);
    terminalOutput!.scrollTop = terminalOutput!.scrollHeight;
  }

  function processCommand(cmdRaw: string) {
    const cmd = cmdRaw.trim().toLowerCase();
    printLine(`<span class="prompt">ash@wizard:~$</span> ${escapeHtml(cmdRaw)}`);

    if (cmd === 'help') {
      printLine('<span class="cmd-text">Available Wizard Commands:</span>');
      printLine('  <span class="cmd-text">bio</span>         - Display Ash Wills background & artistic bio');
      printLine('  <span class="cmd-text">music</span>       - Launch LimeWire Music Studio');
      printLine('  <span class="cmd-text">epk</span>         - Open Electronic Press Kit (EPK)');
      printLine('  <span class="cmd-text">kindness</span>    - Open Anonymous Kindness Message Box');
      printLine('  <span class="cmd-text">techstack</span>   - Show studio gear & code architecture');
      printLine('  <span class="cmd-text">vip</span>         - Join the VIP email & phone subscriber list');
      printLine('  <span class="cmd-text">matrix</span>      - Trigger digital cyber matrix stream');
      printLine('  <span class="cmd-text">clear</span>       - Clear terminal screen');
    } else if (cmd === 'bio') {
      printLine('<span class="highlight">ASH WILLS</span> — Musician, Visual Artist, Tech Wizard.');
      printLine('Blending synthwave, acoustic guitar, generative visual arts, and WebAudio code.');
    } else if (cmd === 'music') {
      printLine('Opening LimeWire Music Studio...');
      openApp('musicPlayer');
    } else if (cmd === 'epk') {
      printLine('Opening Electronic Press Kit (EPK)...');
      openApp('epkWindow');
    } else if (cmd === 'kindness') {
      printLine('Opening Anonymous Kindness Box...');
      openApp('kindnessBox');
    } else if (cmd === 'techstack') {
      printLine('<span class="highlight">Tech Stack & Studio Gear:</span>');
      printLine('• Synths: Sequential Prophet-6, Moog Sub 37');
      printLine('• Code: TypeScript, WebAudio API, HTML5 Canvas, Gemini AI');
      printLine('• DAW: Ableton Live 11 Suite');
    } else if (cmd === 'vip' || cmd === 'contact') {
      printLine('Opening VIP Contact & Lead Form...');
      openApp('vipSignup');
    } else if (cmd === 'matrix') {
      printLine('<span class="highlight">01000001 01010011 01001000 00100000 01010111 01001001 01001100 01001100 01010011</span>');
      printLine('WAKE UP, NEO... THE WIZARD CODE HAS YOU.');
    } else if (cmd === 'clear') {
      terminalOutput!.innerHTML = '';
    } else if (cmd === '') {
      // blank
    } else {
      printLine(`Command not found: <span style="color: #ff5555">${escapeHtml(cmdRaw)}</span>. Type <span class="cmd-text">help</span> for commands.`);
    }
  }

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const value = terminalInput.value;
      terminalInput.value = '';
      processCommand(value);
    }
  });

  terminalInitialized = true;
}

document.querySelectorAll('.tech-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tech-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tech-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-tech');
    if (targetId) {
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
      if (targetId === 'tech-terminal-pane') initTerminal();
    }
  });
});

// ==========================================
// 9. MINESWEEPER MINIGAME ENGINE
// ==========================================
type MinesweeperCell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
  element: HTMLDivElement;
  row: number;
  col: number;
};

let msGrid: MinesweeperCell[][] = [];
let msGameOver = false;
let msTimerInterval: number | null = null;
let msTimeElapsed = 0;
let msFlagsPlaced = 0;
const msMineCount = 10;
const msGridSize = { rows: 9, cols: 9 };
let msFirstClick = true;

function initMinesweeper() {
  const boardEl = document.getElementById('minesweeper-board') as HTMLDivElement | null;
  const flagCountEl = document.querySelector('.minesweeper-flag-count');
  const timerEl = document.querySelector('.minesweeper-timer');
  const resetBtn = document.querySelector('.minesweeper-reset-button');
  const hintBtn = document.querySelector('.minesweeper-hint-button');
  const commentaryEl = document.querySelector('.minesweeper-commentary');

  if (!boardEl) return;

  function resetGame() {
    if (msTimerInterval) clearInterval(msTimerInterval);
    msTimerInterval = null;
    msTimeElapsed = 0;
    msFlagsPlaced = 0;
    msGameOver = false;
    msFirstClick = true;

    if (timerEl) timerEl.textContent = '⏱️ 0';
    if (flagCountEl) flagCountEl.textContent = `🚩 ${msMineCount}`;
    if (resetBtn) resetBtn.textContent = '🙂';
    if (commentaryEl) commentaryEl.textContent = 'Take a break & clear the grid!';

    createGrid();
  }

  function createGrid() {
    boardEl!.innerHTML = '';
    msGrid = [];
    boardEl!.style.gridTemplateColumns = `repeat(${msGridSize.cols}, 20px)`;
    boardEl!.style.gridTemplateRows = `repeat(${msGridSize.rows}, 20px)`;

    for (let r = 0; r < msGridSize.rows; r++) {
      const row: MinesweeperCell[] = [];
      for (let c = 0; c < msGridSize.cols; c++) {
        const cellEl = document.createElement('div');
        cellEl.classList.add('minesweeper-cell');
        const cellData: MinesweeperCell = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
          element: cellEl,
          row: r,
          col: c
        };

        cellEl.addEventListener('click', () => handleCellClick(cellData));
        cellEl.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          handleCellRightClick(cellData);
        });

        row.push(cellData);
        boardEl!.appendChild(cellEl);
      }
      msGrid.push(row);
    }
  }

  function placeMines(firstR: number, firstC: number) {
    let placed = 0;
    while (placed < msMineCount) {
      const r = Math.floor(Math.random() * msGridSize.rows);
      const c = Math.floor(Math.random() * msGridSize.cols);
      if ((r === firstR && c === firstC) || msGrid[r][c].isMine) continue;
      msGrid[r][c].isMine = true;
      placed++;
    }

    for (let r = 0; r < msGridSize.rows; r++) {
      for (let c = 0; c < msGridSize.cols; c++) {
        if (!msGrid[r][c].isMine) {
          msGrid[r][c].adjacentMines = countAdjacent(r, c);
        }
      }
    }
  }

  function countAdjacent(row: number, col: number): number {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < msGridSize.rows && nc >= 0 && nc < msGridSize.cols && msGrid[nr][nc].isMine) {
          count++;
        }
      }
    }
    return count;
  }

  function handleCellClick(cell: MinesweeperCell) {
    if (msGameOver || cell.isRevealed || cell.isFlagged) return;

    if (msFirstClick) {
      placeMines(cell.row, cell.col);
      msFirstClick = false;
      startMsTimer();
    }

    if (cell.isMine) {
      gameOver(cell);
    } else {
      revealCell(cell);
    }
  }

  function handleCellRightClick(cell: MinesweeperCell) {
    if (msGameOver || cell.isRevealed) return;
    cell.isFlagged = !cell.isFlagged;
    cell.element.textContent = cell.isFlagged ? '🚩' : '';
    msFlagsPlaced += cell.isFlagged ? 1 : -1;
    if (flagCountEl) flagCountEl.textContent = `🚩 ${msMineCount - msFlagsPlaced}`;
  }

  function revealCell(cell: MinesweeperCell) {
    if (cell.isRevealed || cell.isFlagged || cell.isMine) return;
    cell.isRevealed = true;
    cell.element.classList.add('revealed');

    if (cell.adjacentMines > 0) {
      cell.element.textContent = cell.adjacentMines.toString();
    } else {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = cell.row + dr;
          const nc = cell.col + dc;
          if (nr >= 0 && nr < msGridSize.rows && nc >= 0 && nc < msGridSize.cols) {
            revealCell(msGrid[nr][nc]);
          }
        }
      }
    }
  }

  function startMsTimer() {
    if (msTimerInterval) return;
    msTimeElapsed = 0;
    msTimerInterval = window.setInterval(() => {
      msTimeElapsed++;
      if (timerEl) timerEl.textContent = `⏱️ ${msTimeElapsed}`;
    }, 1000);
  }

  function gameOver(clickedMine: MinesweeperCell) {
    msGameOver = true;
    if (msTimerInterval) clearInterval(msTimerInterval);
    if (resetBtn) resetBtn.textContent = '😵';

    msGrid.forEach(row => row.forEach(c => {
      if (c.isMine) {
        c.element.classList.add('revealed');
        c.element.textContent = '💣';
      }
    }));
    clickedMine.element.textContent = '💥';
  }

  if (resetBtn) resetBtn.addEventListener('click', resetGame);
  if (hintBtn) {
    hintBtn.addEventListener('click', () => {
      if (commentaryEl) commentaryEl.textContent = "Wizard Hint: Try clicking the corners!";
    });
  }

  resetGame();
}

console.log("Ash Wills Desktop Portfolio OS MVP Initialized.");
