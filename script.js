// ============================================
// CONFIGURATION
// ============================================
const GOOGLE_SHEET_ID = '10BhRz6XScI_kEro08ZhBvkuyBhbDqJI1IziqOMriqIQ';
const SHEET_GID = '1911912942';
const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit?gid=${SHEET_GID}#gid=${SHEET_GID}`;

// All possible time slots (48 slots, 30-min intervals)
const TIME_SLOTS = [
    '00:00 - 00:30', '00:30 - 01:00', '01:00 - 01:30', '01:30 - 02:00',
    '02:00 - 02:30', '02:30 - 03:00', '03:00 - 03:30', '03:30 - 04:00',
    '04:00 - 04:30', '04:30 - 05:00', '05:00 - 05:30', '05:30 - 06:00',
    '06:00 - 06:30', '06:30 - 07:00', '07:00 - 07:30', '07:30 - 08:00',
    '08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '09:30 - 10:00',
    '10:00 - 10:30', '10:30 - 11:00', '11:00 - 11:30', '11:30 - 12:00',
    '12:00 - 12:30', '12:30 - 13:00', '13:00 - 13:30', '13:30 - 14:00',
    '14:00 - 14:30', '14:30 - 15:00', '15:00 - 15:30', '15:30 - 16:00',
    '16:00 - 16:30', '16:30 - 17:00', '17:00 - 17:30', '17:30 - 18:00',
    '18:00 - 18:30', '18:30 - 19:00', '19:00 - 19:30', '19:30 - 20:00',
    '20:00 - 20:30', '20:30 - 21:00', '21:00 - 21:30', '21:30 - 22:00',
    '22:00 - 22:30', '22:30 - 23:00', '23:00 - 23:30', '23:30 - 00:00'
];

// ============================================
// DOM Elements
// ============================================
const tableBody = document.querySelector('#speedupTable tbody');
const totalPlayersEl = document.getElementById('totalPlayers');
const totalSpeedupsEl = document.getElementById('totalSpeedups');
const allianceNameEl = document.getElementById('allianceName');
const lastUpdateTimeEl = document.getElementById('lastUpdateTime');
const refreshBtn = document.getElementById('refreshBtn');
const typeFilter = document.getElementById('typeFilter');
const playerSearch = document.getElementById('playerSearch');
const allianceFilter = document.getElementById('allianceFilter');
const activityFilter = document.getElementById('activityFilter');
const allianceAvailabilityFilter = document.getElementById('allianceAvailabilityFilter');
const timeSlotsGrid = document.getElementById('timeSlotsGrid');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// ============================================
// Global Variables
// ============================================
let allPlayersData = [];
let allAlliances = [];
let timeSlotData = {};
let refreshInterval;
let countdownSeconds = 180;

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌟 Alliance Speedup Tracker Starting...');
    console.log('📊 Sheet URL:', GOOGLE_SHEET_URL);
    
    // Setup tabs
    setupTabs();
    
    // Load data
    loadData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start auto-refresh
    startAutoRefresh();
});

// ============================================
// Setup Tabs
// ============================================
function setupTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding content
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // If switching to availability tab, refresh availability display
            if (tabId === 'availability') {
                updateTimeSlotAvailability();
            }
        });
    });
}

// ============================================
// Load Data from Google Sheets
// ============================================
async function loadData() {
    try {
        showLoading(true);
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        
        console.log('🔄 Loading data from your Google Sheet...');
        
        const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;
        console.log('📡 Fetching from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const text = await response.text();
        
        // Handle the JSONP response
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        
        if (jsonStart < 0 || jsonEnd <= jsonStart) {
            throw new Error('Invalid response format');
        }
        
        const jsonText = text.substring(jsonStart, jsonEnd);
        const data = JSON.parse(jsonText);
        
        processSheetData(data);
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        lastUpdateTimeEl.textContent = `Last updated: ${timeString}`;
        
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Now';
        refreshBtn.disabled = false;
        
        console.log('✅ Data loaded successfully!');
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div style="text-align: center; padding: 40px; color: #ff6b8b;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                        <h3>Connection Error</h3>
                        <p>Could not connect to your Google Sheet</p>
                        <p style="margin: 10px 0; font-size: 0.9rem;">Error: ${error.message}</p>
                        <a href="${GOOGLE_SHEET_URL}" 
                           target="_blank" 
                           style="display: inline-block; background: #6a8cff; color: white; padding: 10px 20px; border-radius: 10px; text-decoration: none; margin: 10px 0;">
                           🔗 Open Your Google Sheet
                        </a>
                        <p style="margin-top: 10px; font-size: 0.9rem;">
                            Make sure: Share → Anyone with the link → Viewer
                        </p>
                    </div>
                </td>
            </tr>`;
        
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Now';
        refreshBtn.disabled = false;
    } finally {
        showLoading(false);
    }
}

// ============================================
// Process Sheet Data & Track Time Slots
// ============================================
function processSheetData(data) {
    if (!data.table || !data.table.rows) {
        console.error('No data found in sheet');
        showNoDataMessage();
        return;
    }
    
    const rows = data.table.rows;
    console.log(`📊 Found ${rows.length} rows in sheet`);
    
    // Initialize time slot tracking
    initializeTimeSlotData();
    
    // Skip header row (row 0)
    const playerRows = rows.slice(1);
    const players = [];
    
    playerRows.forEach((row, index) => {
        const cells = row.c;
        
        // Ensure we have enough columns (at least 9 for all data)
        if (cells && cells.length >= 9) {
            try {
                // Column mapping from your sheet:
                // 0: Timestamp, 1: Username, 2: Alliance
                // 3: Construction Time, 4: Construction Days
                // 5: Research Time, 6: Research Days
                // 7: Training Time, 8: Training Days
                
                const playerName = cells[1] && cells[1].v ? String(cells[1].v).trim() : `Player ${index + 1}`;
                const alliance = cells[2] && cells[2].v ? String(cells[2].v).trim() : 'Unknown';
                
                // Get time slots from sheet
                const constructionTimeSlot = cells[3] && cells[3].v ? String(cells[3].v).trim() : 'Not set';
                const researchTimeSlot = cells[5] && cells[5].v ? String(cells[5].v).trim() : 'Not set';
                const trainingTimeSlot = cells[7] && cells[7].v ? String(cells[7].v).trim() : 'Not set';
                
                // Parse days (convert to numbers)
                const constructionDays = parseNumber(cells[4] ? cells[4].v : 0);
                const researchDays = parseNumber(cells[6] ? cells[6].v : 0);
                const trainingDays = parseNumber(cells[8] ? cells[8].v : 0);
                
                const totalDays = constructionDays + researchDays + trainingDays;
                
                // Track time slots for availability (ONE PLAYER PER SLOT PER MINISTRY)
                if (constructionTimeSlot && constructionTimeSlot !== 'Not set') {
                    trackTimeSlot('construction', constructionTimeSlot, playerName, alliance);
                }
                if (researchTimeSlot && researchTimeSlot !== 'Not set') {
                    trackTimeSlot('research', researchTimeSlot, playerName, alliance);
                }
                if (trainingTimeSlot && trainingTimeSlot !== 'Not set') {
                    trackTimeSlot('training', trainingTimeSlot, playerName, alliance);
                }
                
                players.push({
                    id: index + 1,
                    name: playerName,
                    alliance: alliance,
                    construction: {
                        timeSlot: constructionTimeSlot,
                        days: constructionDays
                    },
                    research: {
                        timeSlot: researchTimeSlot,
                        days: researchDays
                    },
                    training: {
                        timeSlot: trainingTimeSlot,
                        days: trainingDays
                    },
                    totalDays: totalDays
                });
                
            } catch (error) {
                console.error(`Error processing row ${index + 1}:`, error);
            }
        }
    });
    
    if (players.length === 0) {
        showNoDataMessage();
        return;
    }
    
    // Sort players by total days (HIGHEST to LOWEST)
    players.sort((a, b) => b.totalDays - a.totalDays);
    
    console.log(`👥 Processed ${players.length} players`);
    console.log('🕒 Time slot data:', timeSlotData);
    
    allPlayersData = players;
    updateAlliancesList(players);
    renderTable(players);
    updateStats(players);
    updateTimeSlotAvailability();
}

// ============================================
// Initialize Time Slot Data Structure
// ============================================
function initializeTimeSlotData() {
    timeSlotData = {
        construction: {},
        research: {},
        training: {}
    };
    
    // Initialize all time slots for each ministry
    ['construction', 'research', 'training'].forEach(ministry => {
        TIME_SLOTS.forEach(slot => {
            timeSlotData[ministry][slot] = {
                player: null,       // Only ONE player per slot per ministry
                alliance: null
            };
        });
    });
}

// ============================================
// Track Time Slot Usage (ONE PLAYER PER SLOT)
// ============================================
function trackTimeSlot(ministry, timeSlot, playerName, alliance) {
    if (!timeSlot || !TIME_SLOTS.includes(timeSlot)) {
        return;
    }
    
    // Only track if the slot is not already taken
    if (timeSlotData[ministry] && timeSlotData[ministry][timeSlot]) {
        // If slot is empty, assign player
        if (!timeSlotData[ministry][timeSlot].player) {
            timeSlotData[ministry][timeSlot] = {
                player: playerName,
                alliance: alliance
            };
        }
        // If slot is already taken, we don't override (first come, first served)
    }
}

// ============================================
// Update Time Slot Availability Display
// ============================================
function updateTimeSlotAvailability() {
    if (!timeSlotsGrid) return;
    
    const ministry = activityFilter ? activityFilter.value : 'construction';
    const alliance = allianceAvailabilityFilter ? allianceAvailabilityFilter.value : 'all';
    
    let html = '';
    
    // Get ministry name and icon
    const ministryNames = {
        construction: { name: 'Construction', icon: '🏗️' },
        research: { name: 'Research', icon: '🔬' },
        training: { name: 'Training', icon: '⚔️' }
    };
    
    const ministryInfo = ministryNames[ministry];
    
    // Show ministry header
    html += `
        <div class="time-slot-category">
            <h4>${ministryInfo.icon} ${ministryInfo.name} Ministry Slots</h4>
            <div class="time-slots-container">
    `;
    
    // Group slots by time of day
    const timeGroups = [
        { name: 'Night', start: 0, end: 12 },
        { name: 'Morning', start: 12, end: 24 },
        { name: 'Afternoon', start: 24, end: 36 },
        { name: 'Evening', start: 36, end: 48 }
    ];
    
    // Show all 48 slots
    TIME_SLOTS.forEach((slot, index) => {
        // Check if this slot is taken for the selected ministry
        let slotTaken = false;
        let slotPlayer = null;
        let slotAlliance = null;
        
        if (timeSlotData[ministry] && timeSlotData[ministry][slot]) {
            const slotInfo = timeSlotData[ministry][slot];
            if (slotInfo.player) {
                slotTaken = true;
                slotPlayer = slotInfo.player;
                slotAlliance = slotInfo.alliance;
                
                // Check alliance filter
                if (alliance !== 'all' && slotAlliance !== alliance) {
                    slotTaken = false;
                    slotPlayer = null;
                    slotAlliance = null;
                }
            }
        }
        
        // Determine slot status
        const statusClass = slotTaken ? 'time-slot-taken' : 'time-slot-available';
        const statusText = slotTaken ? 'Taken' : 'Available';
        const statusColor = slotTaken ? 'status-taken' : 'status-available';
        
        // Create slot HTML
        html += `
            <div class="time-slot-item ${statusClass}">
                <div class="time-slot-time">${slot}</div>
                <div class="time-slot-status ${statusColor}">${statusText}</div>
                ${slotTaken ? `
                    <div class="time-slot-player">
                        <strong>${slotPlayer}</strong>
                        <div style="font-size: 0.8rem; color: #8a8ab5; margin-top: 3px;">
                            ${slotAlliance}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Add separator between time groups
        if ((index + 1) % 12 === 0 && index < 47) {
            const groupIndex = (index + 1) / 12;
            const groupName = ['Night', 'Morning', 'Afternoon', 'Evening'][groupIndex];
            const groupIcon = ['🌙', '🌅', '☀️', '🌆'][groupIndex];
            
            html += `
                </div>
                <h4 style="margin-top: 30px;">${groupIcon} ${groupName} (${TIME_SLOTS[index + 1]} - ${TIME_SLOTS[index + 12]})</h4>
                <div class="time-slots-container">
            `;
        }
    });
    
    html += `
            </div>
        </div>
    `;
    
    timeSlotsGrid.innerHTML = html;
}

// ============================================
// Render Players Table
// ============================================
function renderTable(players) {
    if (!players || players.length === 0) {
        showNoDataMessage();
        return;
    }
    
    // Get filter values
    const filterType = typeFilter ? typeFilter.value : 'all';
    const searchTerm = playerSearch ? playerSearch.value.toLowerCase() : '';
    const selectedAlliance = allianceFilter ? allianceFilter.value : 'all';
    
    // Apply filters
    let filteredData = players.filter(player => {
        // Search filter
        if (searchTerm && !player.name.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Alliance filter
        if (selectedAlliance !== 'all' && player.alliance !== selectedAlliance) {
            return false;
        }
        
        return true;
    });
    
    // If no players after filtering
    if (filteredData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div style="text-align: center; padding: 40px; color: #8a8ab5;">
                        <i class="fas fa-filter" style="font-size: 3rem; margin-bottom: 15px;"></i>
                        <h3>No players match your filters</h3>
                        <p>Try changing search or alliance filter</p>
                    </div>
                </td>
            </tr>`;
        return;
    }
    
    // Build table HTML
    let html = '';
    
    filteredData.forEach((player, index) => {
        // Determine what to show based on activity type filter
        const showAll = filterType === 'all';
        const showConstruction = showAll || filterType === 'construction';
        const showResearch = showAll || filterType === 'research';
        const showTraining = showAll || filterType === 'training';
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="player-cell">
                        <div class="player-avatar">${player.name.charAt(0).toUpperCase()}</div>
                        <div>
                            <strong>${player.name}</strong>
                            <div style="font-size: 0.8rem; color: #8a8ab5; margin-top: 3px;">
                                ${player.alliance}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="alliance-badge" data-alliance="${player.alliance}">
                        ${player.alliance}
                    </span>
                </td>
                <td>
                    <div class="time-slot-info">⏰ ${player.construction.timeSlot || 'Not set'}</div>
                    <div class="speedup-amount">
                        <i class="fas fa-hammer" style="margin-right: 5px;"></i>
                        ${showConstruction ? formatDays(player.construction.days) : '<span style="color: #ccc; font-style: italic;">—</span>'}
                    </div>
                </td>
                <td>
                    <div class="time-slot-info">⏰ ${player.research.timeSlot || 'Not set'}</div>
                    <div class="speedup-amount">
                        <i class="fas fa-flask" style="margin-right: 5px;"></i>
                        ${showResearch ? formatDays(player.research.days) : '<span style="color: #ccc; font-style: italic;">—</span>'}
                    </div>
                </td>
                <td>
                    <div class="time-slot-info">⏰ ${player.training.timeSlot || 'Not set'}</div>
                    <div class="speedup-amount">
                        <i class="fas fa-running" style="margin-right: 5px;"></i>
                        ${showTraining ? formatDays(player.training.days) : '<span style="color: #ccc; font-style: italic;">—</span>'}
                    </div>
                </td>
                <td class="total-cell">
                    <i class="fas fa-calendar-alt" style="margin-right: 5px;"></i>
                    ${formatDays(player.totalDays)}
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// ============================================
// Helper Functions
// ============================================
function parseNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : Math.max(0, num);
}

function formatDays(days) {
    if (days === 0) return '0 days';
    if (days === 1) return '1 day';
    return `<strong>${days.toLocaleString()} days</strong>`;
}

function updateStats(players) {
    totalPlayersEl.textContent = players.length;
    
    const totalDays = players.reduce((sum, player) => sum + player.totalDays, 0);
    
    if (totalDays >= 1000) {
        const thousands = (totalDays / 1000).toFixed(1);
        totalSpeedupsEl.innerHTML = `${thousands}<small>k</small>`;
        totalSpeedupsEl.title = `${totalDays.toLocaleString()} total speedup days`;
    } else {
        totalSpeedupsEl.textContent = totalDays.toLocaleString();
    }
    
    // Update alliance info
    if (players.length > 0) {
        const alliances = [...new Set(players.map(p => p.alliance))];
        
        if (alliances.length === 1) {
            allianceNameEl.textContent = alliances[0];
            allianceNameEl.title = `${players.length} players`;
        } else {
            allianceNameEl.textContent = `${alliances.length} Alliances`;
            allianceNameEl.title = `Alliances: ${alliances.join(', ')}`;
        }
    } else {
        allianceNameEl.textContent = '—';
    }
}

function updateAlliancesList(players) {
    if (!players || players.length === 0) {
        allAlliances = [];
        updateAlliancesDropdown([]);
        return;
    }
    
    // Get unique alliances
    const alliances = [...new Set(players.map(p => p.alliance).filter(a => a && a.trim() !== ''))].sort();
    allAlliances = alliances;
    
    updateAlliancesDropdown(allianceFilter, alliances);
    updateAlliancesDropdown(allianceAvailabilityFilter, alliances);
}

function updateAlliancesDropdown(dropdown, alliances) {
    if (!dropdown) return;
    
    const currentValue = dropdown.value;
    
    let options = '<option value="all">All Alliances</option>';
    alliances.forEach(alliance => {
        const selected = currentValue === alliance ? 'selected' : '';
        options += `<option value="${alliance}" ${selected}>${alliance}</option>`;
    });
    
    dropdown.innerHTML = options;
}

function showLoading(show) {
    if (show) {
        const loadingRow = document.createElement('tr');
        loadingRow.id = 'loadingRow';
        loadingRow.innerHTML = `
            <td colspan="7">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i> Loading from Google Sheets...
                </div>
            </td>`;
        tableBody.innerHTML = '';
        tableBody.appendChild(loadingRow);
    } else {
        const loadingRow = document.getElementById('loadingRow');
        if (loadingRow && loadingRow.parentNode) {
            loadingRow.remove();
        }
    }
}

function showNoDataMessage() {
    tableBody.innerHTML = `
        <tr>
            <td colspan="7">
                <div style="text-align: center; padding: 40px; color: #8a8ab5;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <h3>No data yet</h3>
                    <p>Submit data using the form above</p>
                    <p style="font-size: 0.9rem; margin-top: 10px;">The sheet will update automatically</p>
                </div>
            </td>
        </tr>`;
    
    totalPlayersEl.textContent = '0';
    totalSpeedupsEl.textContent = '0';
    allianceNameEl.textContent = '—';
}

// ============================================
// Setup Event Listeners
// ============================================
function setupEventListeners() {
    // Refresh button
    refreshBtn.addEventListener('click', loadData);
    
    // Players tab filters
    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            console.log('🎯 Activity filter changed to:', typeFilter.value);
            renderTable(allPlayersData);
        });
    }
    
    if (playerSearch) {
        playerSearch.addEventListener('input', () => {
            renderTable(allPlayersData);
        });
    }
    
    if (allianceFilter) {
        allianceFilter.addEventListener('change', () => {
            renderTable(allPlayersData);
        });
    }
    
    // Availability tab filters
    if (activityFilter) {
        activityFilter.addEventListener('change', () => {
            updateTimeSlotAvailability();
        });
    }
    
    if (allianceAvailabilityFilter) {
        allianceAvailabilityFilter.addEventListener('change', () => {
            updateTimeSlotAvailability();
        });
    }
}

// ============================================
// Auto-Refresh System
// ============================================
function startAutoRefresh() {
    updateCountdown();
    
    refreshInterval = setInterval(() => {
        countdownSeconds--;
        updateCountdown();
        
        if (countdownSeconds <= 0) {
            console.log('⏰ Auto-refresh triggered');
            loadData();
        }
    }, 1000);
}

function updateCountdown() {
    const minutes = Math.floor(countdownSeconds / 60);
    const seconds = countdownSeconds % 60;
    
    const nextRefreshEl = document.getElementById('nextRefresh');
    if (nextRefreshEl) {
        nextRefreshEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function resetCountdown() {
    countdownSeconds = 180;
    updateCountdown();
}

// ============================================
// Initialization Complete
// ============================================
console.log('🚀 Alliance Speedup Tracker with Time Slot Availability loaded!');
console.log('📊 Features:');
console.log('   • ONE player per 30-min slot per ministry');
console.log('   • Separate availability for Construction/Research/Training');
console.log('   • Tabs: Players List & Time Slot Availability');
console.log('   • Sorted by total days (highest first)');
console.log('   • Shows which player has each slot');
console.log('   • Auto-refresh every 3 minutes');