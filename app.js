// app.js - Consolidated functionality
window.app = window.app || {};
// Database Configuration
const DB_VERSION = 1.1;
//const baseArticles = [ /* Paste all articles from database.json here */ ];
//const initialClients = [ /* Paste all clients from database.json here */ ];

// Session Management
function checkSession(shouldRedirect = false) {
    try {
        const session = sessionStorage.getItem('currentUser');
        if (!session) throw new Error('No active session');
        
        const user = JSON.parse(session);
        
        // Additional check for admin pages
        if (window.location.pathname.includes('admin.html') && !user.isAdmin) {
            throw new Error('Admin access required');
        }
        
        return user;
    } catch (error) {
        console.error('Session check failed:', error);
        
        // Only redirect if explicitly requested and not already on index page
        if (shouldRedirect && !window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
        
        return null;
    }
}

function startSession(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

function endSession() {
    sessionStorage.removeItem('currentUser');
}



// Database Management
async function initDatabase() {
    let db = JSON.parse(localStorage.getItem('database') || '{"version":0}');
    // Load initial data from database.json only once
    if(db.version < DB_VERSION) {
        try {
            const response = await fetch('database.json');
            const initialData = await response.json();
            
            // First-time initialization
            if(!db.version) {
                db = {
                    version: DB_VERSION,
                    articles: initialData.articles
                };
            }
            // Version update logic
            else {
                // Merge new articles
                initialData.articles.forEach(newArticle => {
                    if(!db.articles.some(a => a.id === newArticle.id)) {
                        db.articles.push(newArticle);
                    }
                });
                db.version = DB_VERSION;
            }
            
            localStorage.setItem('database', JSON.stringify(db));
        } catch(error) {
            console.error('Failed to initialize database:', error);
        }
    }
    
    return db;
}

// Database Management
async function initMemberDatabase() {
    let mdb = JSON.parse(localStorage.getItem('member_db') || '{"version":0}');
    if (mdb.version < DB_VERSION) {
        try {
            const response = await fetch('member_db.json');
            const initialData = await response.json();
            
            // First-time initialization
            if (!mdb.version) {
                mdb = {
                    version: DB_VERSION,
                    articles: initialData.member_articles,
                    clients: initialData.members // Correctly initialize clients
                };
            } else {
                // Merge new articles
                initialData.member_articles.forEach(newArticle => {
                    if (!mdb.articles.some(a => a.id === newArticle.id)) {
                        mdb.articles.push(newArticle);
                    }
                });
                // Merge new clients (CORRECTED)
                initialData.members.forEach(newClient => {
                    if (!mdb.clients.some(c => c.id === newClient.id)) {
                        mdb.clients.push(newClient);
                    }
                });
                mdb.version = DB_VERSION;
            }
            localStorage.setItem('member_db', JSON.stringify(mdb));
        } catch (error) {
            console.error('Failed to initialize database:', error);
        }
    }
    return mdb;
}

async function initTaskDatabase() {
    const TASK_DB_VERSION = 1.2; // Match version from task_db.json
    
    // Get existing task DB or initialize empty structure
    let taskDb = JSON.parse(localStorage.getItem('task_db')) || {
        version: 0,
        tasks: [],
        admin: [] // For admin users
    };

    // Only load initial data if version is outdated or doesn't exist
    if (taskDb.version < TASK_DB_VERSION) {
        try {
            const response = await fetch('task_db.json');
            const initialData = await response.json();

            // First-time initialization
            if (!taskDb.version) {
                taskDb = {
                    version: TASK_DB_VERSION,
                    tasks: initialData.tasks || [],
                    admin: initialData.admin || []
                };
            } 
            // Version update logic
            else {
                // Merge new tasks
                initialData.tasks.forEach(newTask => {
                    if (!taskDb.tasks.some(t => t.id === newTask.id)) {
                        taskDb.tasks.push(newTask);
                    }
                });

                // Merge admin users
                initialData.admin.forEach(newAdmin => {
                    if (!taskDb.admin.some(a => a.id === newAdmin.id)) {
                        taskDb.admin.push(newAdmin);
                    }
                });

                taskDb.version = TASK_DB_VERSION;
            }

            localStorage.setItem('task_db', JSON.stringify(taskDb));
        } catch (error) {
            console.error('Failed to initialize task database:', error);
            // Fallback to existing or empty DB
            if (!taskDb.tasks) taskDb.tasks = [];
            if (!taskDb.admin) taskDb.admin = [];
        }
    }

    return taskDb;
}

function updateNavigation() {
    const currentUser = checkSession();
    const nav = document.querySelector('nav');
    
    if(currentUser.isAdmin) {
        nav.innerHTML = `
            <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="membership.html">Membership</a></li>
                <li><a href="club.html">Cluber's Desktop</a></li>
                <li><a href="round_table.html">Round Table</a></li>
                <li><a href="tasks.html">My Tasks</a></li>
                <li><a href="admin.html">Admin Panel</a></li>
                <li><a href="#" onclick="app.handleLogout()">Log Out</a></li>
            </ul>
        `;
    }else if(currentUser){
        nav.innerHTML = `
            <ul>
                <div class="nav-links">
                    <li><a href="index.html">Home</a></li>
                    <li><a href="club.html">Cluber's Desktop</a></li>
                    <li><a href="round_table.html">Round Table</a></li>
                    <li><a href="tasks.html">My Tasks</a></li>
                    <li><a href="#" data-section="member-reading">Members' Reading</a></li>
                </div>
                <li class="profile-dropdown">
                    <div class="profile-icon">👤</div>
                    <div class="dropdown-content">
                        <a href="round_table.html">Members' Round Table</a>
                        <a href="#" onclick="app.handleLogout()">Log Out</a>
                    </div>
                </li>
            </ul>
        `;
        
        // Add dropdown interaction
        const dropdown = document.querySelector('.profile-dropdown');
        dropdown.addEventListener('mouseenter', () => {
            document.querySelector('.dropdown-content').style.display = 'block';
        });
        dropdown.addEventListener('mouseleave', () => {
            document.querySelector('.dropdown-content').style.display = 'none';
        });
    }else{
        nav.innerHTML = `
        <ul>
            <div class="nav-links">
                <li><a href="index.html">Home</a></li>
                <li><a href="membership.html">Membership</a></li>
                <li><a href="index.html#contact">Contact</a></li>
            </div>
            <li><a href="login.html" class="login-btn">Login/Register</a></li>
        </ul>
        `
    }
}


function handlePublicAccess() {
    // For login page - redirect if already logged in
    if (window.location.pathname.includes('login.html')) {
        const user = checkSession();
        if (user.isAdmin) {
            window.location.href = 'admin.html';
        }else{
            window.location.href = 'club.html';
        }
    }
    
    // For all public pages - just update UI
    updateNavigation();
}

// Common Functions
function redirectUnauthenticated() {
    if(!checkSession()) {
        window.location.href = 'index.html';
    }
}

function createTask(userId, taskData) {
    const db = initDatabase();
    const user = db.clients.find(c => c.id === userId);
    const taskId = `TASK-${Date.now()}`;
    
    user.tasks.push({
        id: taskId,
        ...taskData,
        status: 'ordered',
        paymentStatus: 'pending',
        created: new Date().toISOString()
    });
    
    localStorage.setItem('database', JSON.stringify(db));
    return taskId;
}

function validatePaymentPhrase(phrase, confirm) {
    return phrase === confirm && phrase.length >= 6;
}

function handleLogout() {
    endSession();
    //localStorage.clear();
    window.location.href = 'index.html';
}

// Update buildTasksSection
async function buildTasksSection(db, user) {
    const client = db.clients.find(c => c.id === user.id);
            const tasks = client?.tasks || [];
    console.log(user)
    return `
        <div class="tasks-section">
            <div class="tasks-header">
                <h2>My Legal Tasks <span class="tasks-count">(${tasks.length})</span></h2>
                <button class="order-task-button" onclick="showTaskOrderModal()">
                    Order New Task
                </button>
            </div>
                ${tasks.length > 0 ? tasks.map(task => `
                    <div class="task-item" data-id="${task.id}">
                        <div class="task-header">
                            <h3 class="task-title">📋 ${task.title}</h3>
                            <span class="task-status ${task.status.toLowerCase()}">
                                ${task.status}
                            </span>
                        </div>
                        <div class="task-details">
                            <p class="task-description">${task.description}</p>
                            <div class="task-meta">
                                <span class="task-due">📅 Due: ${new Date(task.dueDate).toLocaleDateString()}</span>
                                <span class="task-priority">⚠️ Priority: ${task.priority}</span>
                            </div>
                        </div>
                    </div>
                `).join('') : `
                <div class="empty-state">
                    <p>No outstanding tasks found. Ready to create your first task?</p>
                    <button class="order-task-button" onclick="showTaskOrderModal()">
                        Order Your First Task
                    </button>
                </div>
            `}
        </div>
    `;
}

// Add modal handlers
// Replace the existing modal handlers with:
function initializeModalHandlers() {
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeTaskModal);
    }
    
    window.onclick = (e) => {
        if (e.target === document.getElementById('task-order-modal')) {
            closeTaskModal();
        }
    };

    const taskForm = document.getElementById('task-order-form');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskSubmit);
    }
}



// Add this function to handle form submissions
function handleTaskSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const user = app.checkSession();
    
    if (!user) {
        alert('Session expired. Please login again.');
        app.handleLogout();
        return;
    }

    const newTask = {
        id: `task-${Date.now()}`,
        userId: user.id,
        title: formData.get('title'),
        details: formData.get('details'),
        category: formData.get('category'),
        contact: {
            method: formData.get('contact_method'),
            days: formData.getAll('days'),
            time: formData.get('preferred_time')
        },
        status: "Pending Review",
        created: new Date().toISOString()
    };

    // Update database
    app.initTaskDatabase().then(taskDb => {
        taskDb.tasks.unshift(newTask);
        localStorage.setItem('task_db', JSON.stringify(taskDb));
        app.closeTaskModal();
        if(typeof loadSection === 'function') loadSection('tasks');
    }).catch(error => {
        console.error('Task submission failed:', error);
        alert('Failed to submit task. Please try again.');
    });
}

// Word counter implementation
document.querySelector('textarea[name="details"]')?.addEventListener('input', (e) => {
    const wordCount = e.target.value.trim().split(/\s+/).length;
    document.querySelector('.word-counter span').textContent = wordCount;
    e.target.parentElement.classList.toggle('over-limit', wordCount > 500);
});

function showTaskOrderModal() {
    const modal = document.getElementById('task-order-modal');
    if (modal) {
        modal.style.display = 'block';
        // Reset form on show
        document.getElementById('task-order-form')?.reset();
        // Update word counter
        document.querySelector('.word-counter span').textContent = '0';
    }
}

function closeTaskModal() {
    const modal = document.getElementById('task-order-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Add this initialization call at the end of app.js
document.addEventListener('DOMContentLoaded', initializeModalHandlers);

// Update initialization call
(async () => {
    await initDatabase();
    window.app = Object.assign(window.app || {}, {
        //Core functions
        checkSession,
        startSession,
        endSession,
        //Database handlers
        initDatabase,
        initMemberDatabase, 
        initTaskDatabase,
        //Modal Controls
        showTaskOrderModal,
        closeTaskModal,
        //Task management
        buildTasksSection,
        handleTaskSubmit,
        //UI functions
        updateNavigation,
        handleLogout,
        redirectUnauthenticated,
        handlePublicAccess,

    });
    window.app.initialized = true;
    document.dispatchEvent(new Event('appInitialized'));
})();

