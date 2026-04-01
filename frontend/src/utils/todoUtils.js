// frontend/src/utils/todoUtils.js

export function getTodoColor(todo) {
    if (todo.completed === 1) return '#808080';
    
    if (!todo.due_date) return '#ffffff';
    
    const now = new Date();
    const due = new Date(todo.due_date);
    const timeLeft = due - now;
    const hoursLeft = timeLeft / (1000 * 60 * 60);
    
    if (timeLeft < 0) return '#ff142c';
    if (hoursLeft < 1) return 'hsl(19, 100%, 56%)';
    if (hoursLeft < 3) return '#ff8e37';
    if (hoursLeft < 6) return '#ffd037';
    if (hoursLeft < 24) return '#d4ff37';
    return '#6aff00';
}

export function getTimeRemainingText(dueDate) {
    if (!dueDate) return '';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due - now;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMs < 0) return 'Overdue!';
    if (diffMins < 60) return `${diffMins} min left`;
    if (diffHours < 24) return `${diffHours} hours left`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
}

export function formatEuropeanDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}