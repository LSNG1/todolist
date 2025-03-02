document.addEventListener('DOMContentLoaded', () => {
	'use strict';

	let draggedId = null;

	function loadUsers() {
		const users = localStorage.getItem('users');
		return users ? JSON.parse(users) : [];
	}
	function saveUsers(users) {
		localStorage.setItem('users', JSON.stringify(users));
	}
	function loadTasks() {
		const tasks = localStorage.getItem('tasks');
		return tasks ? JSON.parse(tasks) : [];
	}
	function saveTasks(tasks) {
		localStorage.setItem('tasks', JSON.stringify(tasks));
	}
	function getCurrentUser() {
		return localStorage.getItem('currentUser');
	}
	function setCurrentUser(username) {
		localStorage.setItem('currentUser', username);
	}
	function removeCurrentUser() {
		localStorage.removeItem('currentUser');
	}
	function displayError(elementId, message) {
		const errorElem = document.getElementById(elementId);
		errorElem.textContent = message;
		setTimeout(() => { errorElem.textContent = ''; }, 3000);
	}

	const showLoginBtn = document.getElementById('showLogin');
	const showSignupBtn = document.getElementById('showSignup');
	const loginFormContainer = document.getElementById('loginFormContainer');
	const signupFormContainer = document.getElementById('signupFormContainer');

	showLoginBtn.addEventListener('click', () => {
		loginFormContainer.style.display = 'block';
		signupFormContainer.style.display = 'none';
		showLoginBtn.classList.add('active');
		showSignupBtn.classList.remove('active');
	});
	showSignupBtn.addEventListener('click', () => {
		loginFormContainer.style.display = 'none';
		signupFormContainer.style.display = 'block';
		showSignupBtn.classList.add('active');
		showLoginBtn.classList.remove('active');
	});

	const signupForm = document.getElementById('signupForm');
	const loginForm = document.getElementById('loginForm');
	const logoutBtn = document.getElementById('logoutBtn');
	const taskForm = document.getElementById('taskForm');
	const searchInput = document.getElementById('searchInput');
	const taskList = document.getElementById('taskList');

	signupForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const username = document.getElementById('signupUsername').value.trim();
		const password = document.getElementById('signupPassword').value.trim();
		if (!username || !password) {
			displayError('signupError', 'Tous les champs sont obligatoires.');
			return;
		}
		const users = loadUsers();
		if (users.find(user => user.username === username)) {
			displayError('signupError', 'Nom d’utilisateur déjà existant.');
			return;
		}
		users.push({ username, password });
		saveUsers(users);
		displayError('signupError', 'Inscription réussie. Connectez-vous.');
		signupForm.reset();
	});

	loginForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const username = document.getElementById('loginUsername').value.trim();
		const password = document.getElementById('loginPassword').value.trim();
		const users = loadUsers();
		const user = users.find(user => user.username === username && user.password === password);
		if (!user) {
			displayError('loginError', 'Identifiants incorrects.');
			return;
		}
		setCurrentUser(username);
		hideAuthShowTodo();
		loginForm.reset();
	});

	logoutBtn.addEventListener('click', () => {
		removeCurrentUser();
		location.reload();
	});

	function hideAuthShowTodo() {
		document.getElementById('authModal').style.display = 'none';
		document.getElementById('todoApp').style.display = 'block';
		renderTasks();
	}

	taskForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const title = document.getElementById('taskTitle').value.trim();
		const description = document.getElementById('taskDescription').value.trim();
		const deadline = document.getElementById('taskDeadline').value;
		if (!title || !description || !deadline) {
			displayError('taskError', 'Tous les champs doivent être remplis.');
			return;
		}
		const allTasks = loadTasks();
		const currentUser = getCurrentUser();
		const userTasks = allTasks.filter(t => t.user === currentUser);
		const newTask = {
			id: Date.now(),
			user: currentUser,
			title,
			description,
			deadline,
			status: 'pending',
			order: userTasks.length
		};
		allTasks.push(newTask);
		saveTasks(allTasks);
		renderTasks();
		taskForm.reset();
	});

	searchInput.addEventListener('input', () => renderTasks());

	function handleDragStart(e) {
		draggedId = e.target.dataset.id;
		e.target.classList.add('dragging');
		e.dataTransfer.effectAllowed = 'move';
	}
	function handleDragOver(e) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	}
	function handleDrop(e) {
		e.preventDefault();
		const targetLi = e.target.closest('li');
		if (!targetLi) return;
		const targetId = targetLi.dataset.id;
		if (draggedId === targetId) return;
		reorderTasks(draggedId, targetId);
	}
	function handleDragEnd(e) {
		e.target.classList.remove('dragging');
	}

	function reorderTasks(draggedId, targetId) {
		const allTasks = loadTasks();
		const currentUser = getCurrentUser();
		let userTasks = allTasks.filter(t => t.user === currentUser);
		const draggedIndex = userTasks.findIndex(t => t.id == draggedId);
		const targetIndex = userTasks.findIndex(t => t.id == targetId);
		if (draggedIndex < 0 || targetIndex < 0) return;
		const [draggedTask] = userTasks.splice(draggedIndex, 1);
		userTasks.splice(targetIndex, 0, draggedTask);
		userTasks.forEach((task, index) => { task.order = index; });
		const updatedTasks = allTasks.filter(t => t.user !== currentUser).concat(userTasks);
		saveTasks(updatedTasks);
		renderTasks();
	}

	function renderTasks() {
		taskList.innerHTML = '';
		const currentUser = getCurrentUser();
		let tasks = loadTasks().filter(task => task.user === currentUser);
		tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
		const searchQuery = searchInput.value.toLowerCase();
		if (searchQuery) {
			tasks = tasks.filter(task =>
				task.title.toLowerCase().includes(searchQuery) ||
				task.description.toLowerCase().includes(searchQuery)
			);
		}
		tasks.forEach(task => {
			const li = document.createElement('li');
			li.className = 'taskItem';
			li.setAttribute('draggable', 'true');
			li.dataset.id = task.id;
			li.addEventListener('dragstart', handleDragStart);
			li.addEventListener('dragover', handleDragOver);
			li.addEventListener('drop', handleDrop);
			li.addEventListener('dragend', handleDragEnd);

			const header = document.createElement('div');
			header.className = 'taskHeader';
			const titleSpan = document.createElement('span');
			titleSpan.textContent = `${task.title} (Deadline: ${task.deadline})`;
			header.appendChild(titleSpan);
			const actions = document.createElement('div');
			actions.className = 'taskActions';
			if (task.status === 'pending') {
				const validateBtn = document.createElement('button');
				validateBtn.textContent = 'Valider';
				validateBtn.addEventListener('click', () => {
					task.status = 'done';
					const allTasks = loadTasks().map(t => t.id === task.id ? task : t);
					saveTasks(allTasks);
					renderTasks();
				});
				actions.appendChild(validateBtn);
				const deleteBtn = document.createElement('button');
				deleteBtn.textContent = 'Supprimer';
				deleteBtn.classList.add('delete');
				deleteBtn.addEventListener('click', () => {
					const allTasks = loadTasks().filter(t => t.id !== task.id);
					saveTasks(allTasks);
					renderTasks();
				});
				actions.appendChild(deleteBtn);
			} else {
				const statusLabel = document.createElement('span');
				statusLabel.textContent = 'Tâche validée';
				actions.appendChild(statusLabel);
			}
			header.appendChild(actions);
			li.appendChild(header);
			const desc = document.createElement('p');
			desc.textContent = task.description;
			li.appendChild(desc);
			taskList.appendChild(li);
		});
	}

	if (getCurrentUser()) {
		hideAuthShowTodo();
	}
});
