import { getAuthToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL;

async function fetchWithAuth(endpoint, option = {}) {
    const token = getAuthToken();
    // debugging headers
    console.log('Fetching token...');
    const headers = {
        'Content-type': 'application/json',
        ...option.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    else {
        console.log('Token not found');
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...option,
        headers,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Request failed');
    }
    console.log('FetchWithAuth func')
    return res.json();
}

export async function getTodos() {
    return fetchWithAuth('/todos');
}

/*
export async function addTodo(task, duration = null, dueDate = null) {
    console.log('Adding todo with task;', task, 'duration:', defaultExternalConditions, 'due_date:', dueDate);
    return fetchWithAuth('/todos', {
        method: 'POST',
        body: JSON.stringify({
            task,
            duration,
            due_date: dueDate
        }),
    });
}
*/
// Debugging addTodo task
export async function addTodo(task, duration = null, dueDate = null) {
    console.log('AddTodo task starting...');
    console.log('Sending to backend:', { task, duration, dueDate });

    const payload = {
        task,
        duration,
        due_date: dueDate
    }
    console.log('payload:', payload);

    // used to be '/' only, maybe check this later
    const response = await fetchWithAuth('/todos', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    console.log('Backend response:', response);
    return response;
}


export async function updateTodo(id, updates) {
    return fetchWithAuth(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

export async function deleteTodo(id) {
    return fetchWithAuth(`/todos/${id}`, {
        method: 'DELETE',
    });
}

export async function toggleTodo(todo) {
    return updateTodo(todo.id, { completed: !todo.completed });
} 