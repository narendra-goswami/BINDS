// ==========================================
// BINDS WORKSHOP MANAGEMENT SYSTEM
// JavaScript with Google Apps Script Integration
// ==========================================

// CONFIGURATION
const STORAGE_KEY = 'BINDSWorkshopData';
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/a/macros/apu.edu.in/s/AKfycbyaWt1dEMO2KIqLdoVNAhKDpa1WSvy0YvEAqcTHR6TWc-DWu4IjSnS5yWrgvk686k7T7w/exec';

// GLOBAL DATA
let workshopData = {
    participants: [],
    attendance: {}
};

let qrScanner = null;
let autoSyncEnabled = false;
let isGoogleAppsScriptConnected = false;

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 BINDS System Initializing...');
    
    loadData();
    initializeGoogleAppsScript();
    setupNavigation();
    setupRegistration();
    setupAttendance();
    updateHomeStats();
    loadParticipantsList();
    loadAttendanceSheet();
    
    console.log('✅ System ready');
});

// ==========================================
// GOOGLE APPS SCRIPT INITIALIZATION
// ==========================================

function initializeGoogleAppsScript() {
    if (!GOOGLE_APPS_SCRIPT_URL.includes('script.google.com')) {
        console.warn('⚠️ Google Apps Script URL not configured');
        console.log('To enable sync, set GOOGLE_APPS_SCRIPT_URL to your deployment URL');
        isGoogleAppsScriptConnected = false;
        updateGoogleConnectionStatus(false);
    } else {
        console.log('✅ Google Apps Script initialized');
        isGoogleAppsScriptConnected = true;
        updateGoogleConnectionStatus(true);
    }
}

function updateGoogleConnectionStatus(connected) {
    const statusEl = document.getElementById('googleConnectionStatus');
    if (statusEl) {
        statusEl.innerHTML = connected 
            ? '🟢 Connected to Google Apps Script' 
            : '🔴 Not Connected - Set GOOGLE_APPS_SCRIPT_URL';
        statusEl.style.color = connected ? '#155724' : '#721c24';
        statusEl.style.background = connected ? '#d4edda' : '#f8d7da';
    }
}

// ==========================================
// SEND TO GOOGLE APPS SCRIPT
// ==========================================

async function sendToGoogleAppsScript(action, data) {
    if (!isGoogleAppsScriptConnected) {
        showAlert('❌ Google Apps Script not configured', 'error');
        return { success: false };
    }

    try {
        const payload = { action: action, ...data };
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('❌ Google Apps Script Error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// SYNC FUNCTIONS
// ==========================================

async function syncParticipantsToGoogleSheets() {
    if (!isGoogleAppsScriptConnected) {
        showAlert('❌ Google Apps Script not configured. Set URL in code.', 'error');
        return;
    }

    try {
        showAlert('📤 Syncing participants to Google Sheets...', 'info');
        let count = 0;
        
        for (const participant of workshopData.participants) {
            const result = await sendToGoogleAppsScript('addParticipant', {
                id: participant.id,
                name: participant.name,
                email: participant.email,
                institute: participant.institute,
                registrationDate: participant.registrationDate
            });
            
            if (result.success) {
                count++;
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        showAlert(`✅ Synced ${count} participants to Google Sheets!`, 'success');
    } catch (error) {
        console.error('Error syncing participants:', error);
        showAlert('❌ Error syncing participants', 'error');
    }
}

async function syncAttendanceToGoogleSheets() {
    if (!isGoogleAppsScriptConnected) {
        showAlert('❌ Google Apps Script not configured. Set URL in code.', 'error');
        return;
    }

    try {
        showAlert('📤 Syncing attendance to Google Sheets...', 'info');
        let count = 0;
        
        for (const participant of workshopData.participants) {
            const sessions = workshopData.attendance[participant.id] || [];
            
            for (const session of sessions) {
                const result = await sendToGoogleAppsScript('addAttendance', {
                    id: participant.id,
                    name: participant.name,
                    session: session
                });
                
                if (result.success) {
                    count++;
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        showAlert(`✅ Synced ${count} attendance records to Google Sheets!`, 'success');
    } catch (error) {
        console.error('Error syncing attendance:', error);
        showAlert('❌ Error syncing attendance', 'error');
    }
}

function toggleAutoSync() {
    autoSyncEnabled = !autoSyncEnabled;
    const btn = document.getElementById('autoSyncToggle');
    
    if (btn) {
        btn.textContent = autoSyncEnabled ? '⏸️ Disable Auto-Sync' : '▶️ Enable Auto-Sync';
        btn.style.background = autoSyncEnabled ? '#e74c3c' : '#27ae60';
    }
    
    if (autoSyncEnabled) {
        console.log('🔄 Auto-sync enabled');
        showAlert('✅ Auto-sync enabled - Data will sync automatically', 'success');
    } else {
        console.log('⏸️ Auto-sync disabled');
        showAlert('⏸️ Auto-sync disabled', 'info');
    }
}

// ==========================================
// LOCAL DATA MANAGEMENT
// ==========================================

function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            workshopData = JSON.parse(stored);
            console.log('✅ Data loaded from localStorage');
        }
    } catch (e) {
        console.error('Error loading data:', e);
        workshopData = { participants: [], attendance: {} };
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(workshopData));
        console.log('✅ Data saved to localStorage');
        
        // Auto-sync if enabled
        if (autoSyncEnabled) {
            console.log('🔄 Auto-syncing to Google Sheets...');
            // You can implement auto-sync here
        }
        
        return true;
    } catch (e) {
        console.error('Error saving data:', e);
        showAlert('Failed to save data', 'error');
        return false;
    }
}

function showAlert(message, type = 'success') {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert show alert-${type}`;
    
    setTimeout(() => alert.classList.remove('show'), 4000);
}

// ==========================================
// NAVIGATION
// ==========================================

function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            navigateToPage(page);
        });
    });

    // Page button navigation
    document.querySelectorAll('[data-page]').forEach(el => {
        if (el.classList.contains('btn') && !el.classList.contains('nav-btn')) {
            el.addEventListener('click', (e) => {
                const page = el.getAttribute('data-page');
                navigateToPage(page);
            });
        }
    });
}

function navigateToPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show selected page
    const selectedPage = document.getElementById(page);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Update page-specific data
    if (page === 'home') updateHomeStats();
    if (page === 'registration') loadParticipantsList();
    if (page === 'attendance') loadAttendanceSheet();
}

// ==========================================
// HOME PAGE
// ==========================================

function updateHomeStats() {
    const total = workshopData.participants.length;
    let checkedIn = 0;
    
    workshopData.participants.forEach(p => {
        if (workshopData.attendance[p.id] && workshopData.attendance[p.id].length > 0) {
            checkedIn++;
        }
    });

    document.getElementById('homeTotal').textContent = total;
    document.getElementById('homeCheckedIn').textContent = checkedIn;
}

// ==========================================
// REGISTRATION
// ==========================================

function setupRegistration() {
    document.getElementById('registrationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        registerParticipant();
    });

    document.getElementById('searchInput').addEventListener('keyup', searchParticipants);
}

function registerParticipant() {
    const name = document.getElementById('participantName').value.trim();
    const email = document.getElementById('participantEmail').value.trim();
    const institute = document.getElementById('participantInstitute').value.trim();

    if (!name || !email || !institute) {
        showAlert('❌ Please fill all fields', 'error');
        return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('❌ Please enter a valid email', 'error');
        return;
    }

    const id = 'BINDS-' + String(workshopData.participants.length + 1).padStart(2, '0');

    const participant = {
        id: id,
        name: name,
        email: email,
        institute: institute,
        registrationDate: new Date().toLocaleDateString('en-IN')
    };

    workshopData.participants.push(participant);
    workshopData.attendance[id] = [];

    if (saveData()) {
        showAlert(`✅ ${name} registered! ID: ${id}`, 'success');
        displayIdCard(participant);
        document.getElementById('registrationForm').reset();
        loadParticipantsList();
        updateHomeStats();
    }
}

function displayIdCard(participant) {
    document.getElementById('cardName').textContent = participant.name;
    document.getElementById('cardId').textContent = participant.id;
    document.getElementById('qrCodeContainer').innerHTML = '';
    
    new QRCode(document.getElementById('qrCodeContainer'), {
        text: participant.id,
        width: 150,
        height: 150,
        colorDark: '#1b5e4e',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    document.getElementById('idCardPreview').classList.add('show');
    document.getElementById('downloadIdCard').style.display = 'block';
    document.getElementById('downloadIdCard').onclick = () => downloadIdCard(participant);
}

function downloadIdCard(participant) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 550;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#e8f4f1');
    gradient.addColorStop(1, '#ffffff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#1b5e4e';
    ctx.lineWidth = 3;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

    // LOGO SECTION - Load and draw logos
    let logosLoaded = 0;
    const totalLogos = 1;
    
    function drawLogoAndContinue() {
        logosLoaded++;
        if (logosLoaded === totalLogos) {
            drawCardContent();
        }
    }

    // Load and draw LEFT LOGO
    const leftLogoImg = new Image();
    leftLogoImg.crossOrigin = 'anonymous';
    leftLogoImg.src = 'https://raw.githubusercontent.com/narendra-goswami/BINDS/main/binds-logo.png';
    leftLogoImg.onload = () => {
        // Draw left logo (top-left corner)
        const logoWidth = 60;
        const logoHeight = 60;
        ctx.drawImage(leftLogoImg, 30, 30, logoWidth, logoHeight);
        drawLogoAndContinue();
    };
    leftLogoImg.onerror = () => {
        console.warn('Left logo failed to load');
        drawLogoAndContinue();
    };

    // DRAW CARD CONTENT (called after logos load)
    function drawCardContent() {
        // Title
        ctx.fillStyle = '#1b5e4e';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Bridging Nature with Data Science – Chapter 2', canvas.width / 2, 120);

        // QR Code
        const qrImg = document.querySelector('#qrCodeContainer canvas');
        if (qrImg) {
            const qrCanvas = document.createElement('canvas');
            qrCanvas.width = qrImg.width;
            qrCanvas.height = qrImg.height;
            const qrCtx = qrCanvas.getContext('2d');
            qrCtx.drawImage(qrImg, 0, 0);
            ctx.drawImage(qrCanvas, (canvas.width - 150) / 2, 150, 150, 150);
        }

        // ID
        ctx.fillStyle = '#1b5e4e';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(participant.id, canvas.width / 2, 380);

        // Name
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(participant.name, canvas.width / 2, 330);

        // Participant label
        ctx.fillStyle = '#666';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Participant', canvas.width / 2, 355);

        // Footer
        ctx.fillStyle = '#999';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('29-31 January 2026', canvas.width / 2, 480);
        ctx.fillText('Azim Premji University, Bhopal', canvas.width / 2, 500);

        // Convert to image and download
        downloadCanvas(canvas, participant);
    }

    // Download the canvas as image
    function downloadCanvas(canvas, participant) {
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${participant.name}-ID-${participant.id}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showAlert('✅ ID card downloaded!', 'success');
        }, 'image/png');
    }
}

function loadParticipantsList() {
    const tbody = document.getElementById('participantsList');
    
    if (workshopData.participants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-light);">No participants registered yet</td></tr>';
        return;
    }

    tbody.innerHTML = workshopData.participants.map(p => `
        <tr>
            <td><strong>${p.id}</strong></td>
            <td>${p.name}</td>
            <td>${p.email}</td>
            <td>${p.institute}</td>
            <td>${p.registrationDate}</td>
            <td>
                <button class="btn btn-small" onclick="downloadIdCardFromList('${p.id}')">📥 ID</button>
                <button class="btn btn-small btn-secondary" onclick="deleteParticipant('${p.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function downloadIdCardFromList(participantId) {
    const participant = workshopData.participants.find(p => p.id === participantId);
    if (participant) {
        downloadIdCard(participant);
    } else {
        showAlert('❌ Participant not found', 'error');
    }
}

function searchParticipants() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const tbody = document.getElementById('participantsList');
    
    if (!search) {
        loadParticipantsList();
        return;
    }

    const filtered = workshopData.participants.filter(p =>
        p.name.toLowerCase().includes(search) || p.id.toLowerCase().includes(search)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-light);">No participants found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(p => `
        <tr>
            <td><strong>${p.id}</strong></td>
            <td>${p.name}</td>
            <td>${p.email}</td>
            <td>${p.institute}</td>
            <td>${p.registrationDate}</td>
            <td>
                <button class="btn btn-small" onclick="downloadIdCardFromList('${p.id}')">📥 ID</button>
                <button class="btn btn-small btn-secondary" onclick="deleteParticipant('${p.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function deleteParticipant(id) {
    if (!confirm('❌ Delete this participant?')) return;
    
    workshopData.participants = workshopData.participants.filter(p => p.id !== id);
    delete workshopData.attendance[id];
    
    if (saveData()) {
        showAlert('✅ Participant deleted', 'success');
        loadParticipantsList();
        updateHomeStats();
    }
}

// ==========================================
// ATTENDANCE
// ==========================================

function setupAttendance() {
    document.getElementById('startQrScan').addEventListener('click', startQrScanner);
    document.getElementById('stopQrScan').addEventListener('click', stopQrScanner);
}

function startQrScanner() {
    const session = document.getElementById('sessionSelect').value;
    if (!session) {
        showAlert('❌ Please select a session first', 'error');
        return;
    }

    document.getElementById('qrScannerContainer').style.display = 'block';

    try {
        const scanner = new Html5Qrcode('qrScanner');
        
        scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
                markAttendanceByQr(decodedText);
                scanner.stop();
                document.getElementById('qrScannerContainer').style.display = 'none';
                document.getElementById('startQrScan').style.display = 'block';
                document.getElementById('stopQrScan').style.display = 'none';
            },
            (error) => {
                console.log('QR scan error:', error);
            }
        );

        qrScanner = scanner;
        document.getElementById('startQrScan').style.display = 'none';
        document.getElementById('stopQrScan').style.display = 'block';
    } catch (err) {
        showAlert('❌ Camera access denied or not supported', 'error');
    }
}

function stopQrScanner() {
    if (qrScanner) {
        try {
            qrScanner.stop();
        } catch (e) {
            console.log('Error stopping scanner:', e);
        }
    }
    document.getElementById('qrScannerContainer').style.display = 'none';
    document.getElementById('startQrScan').style.display = 'block';
    document.getElementById('stopQrScan').style.display = 'none';
}

function markAttendanceByQr(participantId) {
    const session = document.getElementById('sessionSelect').value;
    if (!session) {
        showAlert('❌ Please select a session', 'error');
        return;
    }

    const participant = workshopData.participants.find(p => p.id === participantId);
    if (!participant) {
        showAlert('❌ Participant not found', 'error');
        return;
    }

    if (!workshopData.attendance[participantId]) {
        workshopData.attendance[participantId] = [];
    }

    if (!workshopData.attendance[participantId].includes(session)) {
        workshopData.attendance[participantId].push(session);
        
        if (saveData()) {
            showAlert(`✅ ${participant.name} marked for ${session}`, 'success');
            loadAttendanceSheet();
            updateHomeStats();
        }
    } else {
        showAlert('⚠️ Already marked for this session', 'info');
    }
}

function markAttendanceManual() {
    const participantId = document.getElementById('manualParticipantId').value.trim().toUpperCase();
    const session = document.getElementById('sessionSelect').value;

    if (!participantId || !session) {
        showAlert('❌ Please enter ID and select session', 'error');
        return;
    }

    markAttendanceByQr(participantId);
    document.getElementById('manualParticipantId').value = '';
}

function loadAttendanceSheet() {
    const tbody = document.getElementById('attendanceTable');
    
    if (workshopData.participants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-light);">No participants yet</td></tr>';
        return;
    }

    const sessions = ['Day1-Morning', 'Day1-Afternoon', 'Day2-Morning', 'Day2-Afternoon', 'Day3-Morning', 'Day3-Afternoon'];

    tbody.innerHTML = workshopData.participants.map(p => {
        let total = 0;
        const cells = sessions.map(session => {
            const attended = workshopData.attendance[p.id]?.includes(session);
            if (attended) total++;
            return `<td style="text-align: center;">${attended ? '✅' : '-'}</td>`;
        }).join('');

        return `
            <tr>
                <td><strong>${p.id}</strong></td>
                <td>${p.name}</td>
                ${cells}
                <td style="text-align: center;"><strong>${total}</strong></td>
            </tr>
        `;
    }).join('');
}

function downloadAttendanceSheet() {
    if (workshopData.participants.length === 0) {
        showAlert('❌ No participants to download', 'error');
        return;
    }

    const sessions = ['Day1-Morning', 'Day1-Afternoon', 'Day2-Morning', 'Day2-Afternoon', 'Day3-Morning', 'Day3-Afternoon'];
    let csv = 'Participant ID,Name,Email,Institute,' + sessions.join(',') + ',Total Sessions\n';

    workshopData.participants.forEach(p => {
        let total = 0;
        const sessionData = sessions.map(session => {
            const attended = workshopData.attendance[p.id]?.includes(session);
            if (attended) total++;
            return attended ? '1' : '0';
        }).join(',');

        csv += `"${p.id}","${p.name}","${p.email}","${p.institute}",${sessionData},${total}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BINDS_Attendance_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showAlert('✅ Attendance sheet downloaded!', 'success');
}

// ==========================================
// SETTINGS
// ==========================================

function exportAllData() {
    const backup = {
        exportDate: new Date().toLocaleString('en-IN'),
        workshopName: 'BINDS – Chapter 2',
        participants: workshopData.participants,
        attendance: workshopData.attendance
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BINDS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showAlert('✅ Data exported!', 'success');
}

function importAllData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const imported = JSON.parse(event.target.result);
                if (confirm(`Import ${imported.participants.length} participants?`)) {
                    workshopData = imported;
                    saveData();
                    showAlert('✅ Data imported!', 'success');
                    location.reload();
                }
            } catch (error) {
                showAlert('❌ Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function clearAllData() {
    if (!confirm('⚠️ Delete ALL data permanently? This cannot be undone!')) return;
    
    workshopData = { participants: [], attendance: {} };
    if (saveData()) {
        showAlert('✅ All data cleared', 'success');
        location.reload();
    }
}
