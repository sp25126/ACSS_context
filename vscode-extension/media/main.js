(function () {
    const wsUrl = 'ws://localhost:3000';
    let socket;
    let retryCount = 0;
    const maxRetries = 10;

    // UI Elements
    const badge = document.getElementById('connection-badge');
    const taskIntent = document.getElementById('task-intent');
    const taskStatus = document.getElementById('task-status');
    const decisionsList = document.getElementById('decisions-list');
    const stepsList = document.getElementById('steps-list');

    // Create Retry Button dynamically if not present
    let retryBtn = document.getElementById('retry-btn');
    if (!retryBtn) {
        retryBtn = document.createElement('button');
        retryBtn.id = 'retry-btn';
        retryBtn.innerText = '⟳ Retry Connection';
        retryBtn.style.display = 'none';
        retryBtn.onclick = () => {
            retryCount = 0;
            connect();
        };
        document.body.insertBefore(retryBtn, document.body.firstChild.nextSibling); // Insert under title
    }

    function updateBadge(state) {
        retryBtn.style.display = 'none';

        if (state === 'connected') {
            badge.textContent = 'Connected';
            badge.className = 'connected';
            retryCount = 0;
        } else if (state === 'connecting') {
            badge.textContent = `Connecting... (${retryCount + 1})`;
            badge.className = 'disconnected';
        } else {
            badge.textContent = 'Disconnected';
            badge.className = 'disconnected';
            retryBtn.style.display = 'block';
        }
    }

    function connect() {
        if (socket && socket.readyState !== WebSocket.CLOSED) return;

        updateBadge('connecting');
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('Connected to ACSS stream');
            updateBadge('connected');
        };

        socket.onmessage = (event) => {
            try {
                const session = JSON.parse(event.data);
                updateUI(session);
            } catch (err) {
                console.error('Failed to parse ACSS session:', err);
                taskIntent.textContent = 'Error parsing session data.';
            }
        };

        socket.onclose = () => {
            updateBadge('disconnected');
            // Clear UI to avoid stale state confusion
            taskIntent.textContent = 'Waiting for stream...';
            taskStatus.textContent = 'OFFLINE';
            decisionsList.classList.add('opacity-50'); // Dim the lists
            stepsList.classList.add('opacity-50');

            if (retryCount < maxRetries) {
                const timeout = Math.min(1000 * (retryCount + 1), 5000); // Linear backoff max 5s
                console.log(`ACSS stream disconnected. Retrying in ${timeout}ms...`);
                setTimeout(() => {
                    retryCount++;
                    connect();
                }, timeout);
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
            socket.close(); // Ensure onclose triggers
        };
    }

    function updateUI(session) {
        decisionsList.classList.remove('opacity-50');
        stepsList.classList.remove('opacity-50');

        // Update Task
        taskIntent.textContent = session.currentTask?.intent || 'No active intent.';
        taskStatus.textContent = (session.currentTask?.status || 'unknown').toUpperCase();

        // Update Decisions (latest 5)
        decisionsList.innerHTML = '';
        const recentDecisions = (session.decisions || []).slice(-5).reverse();
        if (recentDecisions.length === 0) {
            decisionsList.innerHTML = '<div class="empty">No decisions logged yet.</div>';
        } else {
            recentDecisions.forEach(d => {
                const div = document.createElement('div');
                div.className = 'decision-item';
                div.textContent = typeof d === 'string' ? d : d.text;
                decisionsList.appendChild(div);
            });
        }

        // Update Next Steps
        stepsList.innerHTML = '';
        const steps = session.nextSteps || [];
        if (steps.length === 0) {
            stepsList.innerHTML = '<div class="empty">No next steps pending.</div>';
        } else {
            steps.forEach(s => {
                const div = document.createElement('div');
                div.className = 'step-item';
                div.textContent = typeof s === 'string' ? s : s.text;
                stepsList.appendChild(div);
            });
        }
    }

    connect();
}());
