const allIssueApi = "https://phi-lab-server.vercel.app/api/v1/lab/issues";
const singleIssueApi = "https://phi-lab-server.vercel.app/api/v1/lab/issue/"; // Append ID
const searchIssueApi = "https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q="; // Append searchText

let globalIssues = [];
let searchTimeout = null;
let currentFilter = 'all';

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const gridContainer = document.getElementById('x');
const modalOverlay = document.getElementById('issueModal');
const modalContent = document.getElementById('modalContent');

// Initialize
getAllIssues();

// Event Listeners for search
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            if (query.length > 0) {
                searchIssues(query);
            } else {
                getAllIssues(); // If search is cleared, fetch all again
            }
        }, 500); // Debounce search
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            clearTimeout(searchTimeout);
            if (query.length > 0) {
                searchIssues(query);
            } else {
                getAllIssues();
            }
        }
    });
}

if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        const query = searchInput?.value.trim() || '';
        if (query.length > 0) {
            searchIssues(query);
        } else {
            getAllIssues();
        }
    });
}

// Loading States
function showGridLoading() {
    gridContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center py-32 w-full">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p class="text-gray-500 font-medium animate-pulse">Loading issues...</p>
        </div>
    `;
}

// Fetch All Issues
async function getAllIssues() {
    showGridLoading();
    try {
        const response = await fetch(allIssueApi);
        const result = await response.json();
        
        extractData(result);
    } catch (e) {
        console.error("Failed to fetch issues:", e);
        showError("Failed to load repository issues.");
    }
}

// Fetch Search Results
async function searchIssues(query) {
    showGridLoading();
    try {
        const response = await fetch(`${searchIssueApi}${encodeURIComponent(query)}`);
        const result = await response.json();
        
        extractData(result);
    } catch (e) {
        console.error("Search failed:", e);
        showError("An error occurred while searching issues.");
    }
}

// Standardize API response parsing
function extractData(result) {
    let issuesArray = [];
    
    if (Array.isArray(result)) {
        issuesArray = result;
    } else if (result.data && Array.isArray(result.data)) {
        issuesArray = result.data;
    } else if (result.issues && Array.isArray(result.issues)) {
        issuesArray = result.issues;
    } else if (result.results && Array.isArray(result.results)) {
        issuesArray = result.results;
    }
    
    globalIssues = issuesArray;
    displayDashboard(globalIssues);
}

function showError(msg) {
    gridContainer.innerHTML = `<div class="p-8 mt-10 text-center text-red-600 bg-red-50 rounded-lg max-w-2xl mx-auto shadow-sm border border-red-100">${msg}</div>`;
}

// Dashboard rendering
// Format date string
function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function displayDashboard(issues) {
    if (!issues || issues.length === 0) {
        gridContainer.innerHTML = `
            <div class="text-center py-32 text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <p class="text-xl font-medium">No issues found</p>
                <p class="mt-2 text-sm">Try adjusting your search criteria or create a new issue.</p>
            </div>
        `;
        return;
    }

    const openCount = issues.filter(i => i.status === 'open').length;
    const closedCount = issues.filter(i => i.status === 'closed').length;
    const allCount = issues.length;
    
    // Dynamic Header Count based on currentFilter
    let headerCount = allCount;
    if (currentFilter === 'open') headerCount = openCount;
    if (currentFilter === 'closed') headerCount = closedCount;

    // Helper to generate button styles based on active state
    const getBtnStyle = (filterType) => {
        if (currentFilter === filterType) {
            return "bg-[#4f46e5] text-white font-semibold";
        }
        return "bg-white text-gray-600 font-medium hover:bg-gray-50";
    };

    gridContainer.innerHTML = `
        <div class="px-6 py-8">
            <!-- Filter Tabs Section -->
            <div class="flex gap-4 mb-6">
                <!-- Buttons are styled to match the screenshot -->
                <button onclick="handleFilterClick('all')" class="px-8 py-2.5 rounded text-sm transition-colors border border-gray-200 shadow-sm ${getBtnStyle('all')}">
                    All
                </button>
                <button onclick="handleFilterClick('open')" class="px-8 py-2.5 rounded text-sm transition-colors border border-gray-200 shadow-sm ${getBtnStyle('open')}">
                    Open
                </button>
                <button onclick="handleFilterClick('closed')" class="px-8 py-2.5 rounded text-sm transition-colors border border-gray-200 shadow-sm ${getBtnStyle('closed')}">
                    Closed
                </button>
            </div>
            
            <!-- Issues Header Section -->
            <div class="bg-white border rounded shadow-sm p-5 mb-6 flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                        <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-gray-800">${headerCount} Issues</h2>
                        <p class="text-sm text-gray-500 mt-0.5">Track and manage your project issues</p>
                    </div>
                </div>
                
                <div class="flex gap-4 text-sm font-medium text-gray-700">
                    <div class="flex items-center gap-1.5">
                        <span class="w-3 h-3 rounded-full bg-[#10b981]"></span> Open
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="w-3 h-3 rounded-full bg-[#8b5cf6]"></span> Closed
                    </div>
                </div>
            </div>
            
            <!-- Grid -->
            <div id="issues-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            </div>
        </div>
    `;
    
    // Apply initial items
    renderGridFilteredList();
}

function handleFilterClick(status) {
    if (currentFilter === status) return; // Ignore if already selected
    
    currentFilter = status;
    displayDashboard(globalIssues); // Re-render upper components for exact styles
}

function renderGridFilteredList() {
    const gc = document.getElementById("issues-grid");
    if (!gc) return;

    // Filter Logic
    let issuesToRender = globalIssues;
    if (currentFilter !== 'all') {
        issuesToRender = globalIssues.filter(i => i.status === currentFilter);
    }

    // "Loading" Animation for switching sections
    gc.innerHTML = `
        <div class="col-span-full py-20 flex flex-col items-center justify-center">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4f46e5] mb-3"></div>
            <p class="text-gray-500 text-sm">Loading ${currentFilter} issues...</p>
        </div>
    `;

    setTimeout(() => {
        if (issuesToRender.length === 0) {
            gc.innerHTML = `<div class="col-span-full py-16 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">No issues match this filter.</div>`;
            return;
        }
        
        gc.innerHTML = issuesToRender.map(issue => {
            const isOpen = issue.status === 'open';
            const borderColor = isOpen ? 'border-green-500' : 'border-violet-500';
            const labelsHTML = (issue.labels || []).map(l => `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">${l}</span>`).join('');
            
            // Priority Badge highlighting
            const priorityClass = issue.priority === 'high' 
                ? 'bg-red-100 text-red-700 border-red-200' 
                : issue.priority === 'medium' 
                    ? 'bg-orange-100 text-orange-700 border-orange-200' 
                    : 'bg-blue-100 text-blue-700 border-blue-200';
                    
            const priorityHTML = issue.priority 
                ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityClass}">${issue.priority}</span>` 
                : '';
            
            return `
                <div onclick="openIssueModal(${issue.id})" class="cursor-pointer bg-white rounded-xl shadow-sm border border-gray-100 border-t-4 ${borderColor} p-5 flex flex-col h-full hover:shadow-md transition-shadow group relative">
                    <div class="flex justify-between items-start gap-3 mb-2">
                        <h3 class="font-semibold text-gray-900 leading-snug group-hover:text-purple-600 transition-colors line-clamp-2">${issue.title}</h3>
                    </div>
                    
                    <p class="text-sm text-gray-500 mb-4 line-clamp-3 flex-grow">${issue.description}</p>
                    
                    <div class="flex flex-wrap gap-1.5 mb-4 items-center">
                        ${priorityHTML}
                        ${labelsHTML}
                    </div>
                    
                    <div class="mt-auto pt-4 border-t border-gray-50 text-xs text-gray-400 flex flex-col gap-2">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1.5 font-medium text-gray-500">
                                <span class="w-5 h-5 rounded-full bg-gradient-to-br from-[#4f46e5] to-purple-600 text-white flex items-center justify-center text-[10px]">${(issue.author || 'U').charAt(0).toUpperCase()}</span>
                                ${issue.author}
                            </div>
                            <span class="font-medium text-gray-500">#${issue.id}</span>
                        </div>
                        <div class="text-[10px] flex justify-between pt-1 border-t border-gray-50/50">
                            <span>Opened: ${formatDate(issue.createdAt)}</span>
                            <span>Updated: ${formatDate(issue.updatedAt)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }, 400); // 400ms fake loading delay to emulate section transitioning
}

window.filterIssues = function(status) {
    currentFilter = status;
    displayDashboard(globalIssues);
};

// ---------------- SINGLE ISSUE MODAL LOGIC ----------------

function closeModal() {
    modalOverlay.classList.remove('opacity-100', 'pointer-events-auto');
    modalContent.classList.remove('scale-100');
    setTimeout(() => {
        modalContent.innerHTML = '';
    }, 300);
}

// ---------------- CREATE ISSUE MODAL LOGIC ----------------

const newIssueBtn = document.getElementById('newIssueBtn');
const createIssueModal = document.getElementById('createIssueModal');
const closeCreateModalBtn = document.getElementById('closeCreateModalBtn');
const cancelCreateBtn = document.getElementById('cancelCreateBtn');
const createIssueForm = document.getElementById('createIssueForm');
const createIssueError = document.getElementById('createIssueError');
const submitCreateBtn = document.getElementById('submitCreateBtn');

function openCreateModal() {
    createIssueModal.classList.add('opacity-100', 'pointer-events-auto');
    document.getElementById('createModalContent').classList.add('scale-100');
    createIssueError.classList.add('hidden');
    createIssueForm.reset();
}

function closeCreateModal() {
    createIssueModal.classList.remove('opacity-100', 'pointer-events-auto');
    document.getElementById('createModalContent').classList.remove('scale-100');
}

if (newIssueBtn) newIssueBtn.addEventListener('click', openCreateModal);
if (closeCreateModalBtn) closeCreateModalBtn.addEventListener('click', closeCreateModal);
if (cancelCreateBtn) cancelCreateBtn.addEventListener('click', closeCreateModal);

// Close either modal on outside click
window.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
    if (e.target === createIssueModal) closeCreateModal();
});

// Handle Create Submit
if (createIssueForm) {
    createIssueForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('newIssueTitle').value.trim();
        const description = document.getElementById('newIssueDescription').value.trim();
        const priority = document.getElementById('newIssuePriority').value;
        const author = document.getElementById('newIssueAuthor').value.trim() || 'guest_user';
        
        if (!title || !description) return;
        
        // Show loading state on button
        const originalBtnHTML = submitCreateBtn.innerHTML;
        submitCreateBtn.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>';
        submitCreateBtn.disabled = true;
        createIssueError.classList.add('hidden');
        
        try {
            const response = await fetch(allIssueApi, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    description,
                    priority,
                    author,
                    status: 'open', // New issues are open by default
                    labels: []
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create issue. Please try again.');
            }
            
            // Refresh dashboard
            closeCreateModal();
            getAllIssues(); // Refetches all to include new data
            
        } catch (error) {
            createIssueError.textContent = error.message;
            createIssueError.classList.remove('hidden');
        } finally {
            submitCreateBtn.innerHTML = originalBtnHTML;
            submitCreateBtn.disabled = false;
        }
    });
}

function openModalLoading() {
    modalOverlay.classList.add('opacity-100', 'pointer-events-auto');
    modalContent.classList.add('scale-100');
    
    modalContent.innerHTML = `
        <div class="p-16 flex flex-col justify-center items-center">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
            <p class="text-gray-500 font-medium">Fetching issue details...</p>
        </div>
    `;
}

window.openIssueModal = async function(id) {
    openModalLoading();
    
    try {
        const response = await fetch(`${singleIssueApi}${id}`);
        if (!response.ok) throw new Error("Failed to fetch specific issue");
        
        const resJson = await response.json();
        const issue = resJson.data || resJson; 
        
        const isOpen = issue.status === 'open';
        const statusColor = isOpen ? 'bg-green-600' : 'bg-violet-600';
        const labelsHTML = (issue.labels || []).map(l => `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">${l}</span>`).join('');
        
        modalContent.innerHTML = `
            <!-- Header section -->
            <div class="px-6 py-5 border-b border-gray-100 flex justify-between items-start gap-4">
                <div>
                    <div class="flex items-center gap-3 mb-2">
                        <span class="px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5 ${statusColor}">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isOpen ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' : 'M5 13l4 4L19 7'}"></path></svg>
                            ${issue.status}
                        </span>
                        <span class="text-gray-400 text-sm">Issue #${issue.id}</span>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 leading-tight">${issue.title}</h2>
                </div>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-700 transition-colors p-1 bg-gray-50 hover:bg-gray-100 rounded-lg">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <!-- Body section -->
            <div class="p-6 overflow-y-auto bg-gray-50/50">
                <div class="flex flex-wrap gap-2 mb-6">
                    ${labelsHTML}
                </div>
                
                <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm text-gray-700 text-sm leading-relaxed mb-6">
                    ${issue.description || 'No description provided.'}
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div>
                        <p class="text-gray-500 mb-1 text-xs uppercase font-semibold">Assignee</p>
                        <div class="flex items-center gap-2 font-medium text-gray-800">
                            ${issue.assignee ? `<span class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs uppercase">${issue.assignee.charAt(0)}</span> ${issue.assignee}` : '<span class="text-gray-400 italic">Unassigned</span>'}
                        </div>
                    </div>
                    <div>
                        <p class="text-gray-500 mb-1 text-xs uppercase font-semibold">Priority</p>
                        <span class="font-bold text-xs uppercase tracking-wider px-2 py-0.5 rounded ${issue.priority === 'high' ? 'bg-red-100 text-red-700' : issue.priority === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}">${issue.priority || 'None'}</span>
                    </div>
                    <div class="col-span-2 pt-3 mt-1 border-t border-gray-100 flex justify-between text-gray-500 text-xs">
                        <span>Opened by <strong>${issue.author}</strong> on ${formatDate(issue.createdAt)}</span>
                        <span>Updated ${formatDate(issue.updatedAt)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Footer action -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button onclick="closeModal()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">Close</button>
            </div>
        `;
        
    } catch (e) {
        console.error("Failed fetching single issue:", e);
        modalContent.innerHTML = `
            <div class="p-10 text-center">
                <div class="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900 mb-2">Error Loading Issue</h3>
                <p class="text-gray-500 mb-6">We couldn't retrieve the details for this issue right now.</p>
                <button onclick="closeModal()" class="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-colors">Go Back</button>
            </div>
        `;
    }
};
