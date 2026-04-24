// frontend/src/pages/Todos.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, UNSAFE_DataRouterStateContext } from 'react-router-dom';
import { getTodos, addTodo, deleteTodo, toggleTodo } from '../lib/todos';
import { isAuthenticated, removeAuthToken } from '../lib/auth';
import { getTodoColor, getTimeRemainingText } from '../utils/todoUtils'; // Import from utils
import './Todos.css';

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [duration, setDuration] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const timeOptions = [];

  for (let hour = 0; hour < 24; hour++) {
    for (let minute of ['00', '30']) {
      const time = `${String(hour).padStart(2, '0')}:${minute}`;
      timeOptions.push(time);
    }
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadTodos();
    
    // Refresh todo colors every minute without resetting the todo
    const interval = setInterval(() => {
      setTodos(currentTodos => [...currentTodos]);
    }, 60000);
    
    return () => clearInterval(interval);
  }, [navigate]);


  async function loadTodos() {
    try {
      setLoading(true);
      const data = await getTodos();
      if (!data) {
        setError('No todos found');
        return;
      }
      setTodos(data);
    } catch (err) {
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  }


  async function handleAddTodo(e) {
    e.preventDefault();

    if (!newTask.trim()) {
      setError('Please enter a task name.');
      return;
    }

    if (!duration) {
      setError('Please select a duration.');
      return;
    }

    if (!dueDate) {
      setError('Please select a due date.');
      return;
    }

    if (!dueTime) {
      setError('Please select a due time.');
      return;
    }

    try {
      const finalDueDate = new Date(`${dueDate}T${dueTime}`).toISOString();

      const newTodo = await addTodo(
        newTask.trim(),
        parseInt(duration),
        finalDueDate
      );

      const todoToAdd = newTodo.newTodo || newTodo;

      setTodos(currentTodos => [todoToAdd, ...currentTodos]);

      setNewTask('');
      setDuration('');
      setDueDate('');
      setDueTime('');
      setError('');
    } catch (err) {
      console.error('Failed to add todo:', err);
      setError(err.message || 'Failed to add todo');
    }
  }


  async function handleToggle(todo) {
    try {
      const updated = await toggleTodo(todo);
      setTodos(todos.map(t => t.id === updated.id ? updated : t));
    } catch (err) {
      setError('Failed to update todo');
    }
  }


  async function handleDelete(id) {
    try {
      await deleteTodo(id);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to delete todo');
    }
  }


  function handleLogout() {
    removeAuthToken();
    navigate('/login');
  }

  const activeTodos = todos.filter(todo => todo.completed !== 1);
  const completedTodos = todos.filter(todo => todo.completed === 1);


  if (loading) return <div className="loading-message">Loading...</div>;


  return (
    <div className="todos-wrapper">
      <div className="todos-container">
        <div className="todos-header">
          <h1>My Tasks</h1>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>


        <form onSubmit={handleAddTodo} className="todo-form">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="todo-input"
            required
          />

          <div className="time-options">
            <label className="field-label">
              <span>Duration:</span>
              <select 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)}
                className="duration-select"
                required
              >
                <option value="">Select duration</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="240">4 hours</option>
                <option value="480">8 hours</option>
                <option value="1440">1 day</option>
                <option value="2880">2 days</option>
                <option value="10080">1 week</option>
              </select>
            </label>

            <label className="field-label">
              <span>Due date:</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="date-input"
                required
              />
            </label>

            <label className="field-label">
              <span>Due time:</span>
              <select
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="date-input"
                required
              >
                <option value="">Select time</option>
                {timeOptions.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          <button type="submit" className="add-btn">Add Todo</button>
        </form>


        {error && <p className="error-text">{error}</p>}


        <h2 className="section-title">Active Tasks</h2>

        <ul className="todo-list">
          {activeTodos.length === 0 && (
            <p className="empty-text">No active tasks yet.</p>
          )}

          {activeTodos.map(todo => (
            <li 
              key={todo.id} 
              className="todo-item"
              style={{ backgroundColor: getTodoColor(todo) }}
            >
              <input
                type="checkbox"
                checked={todo.completed === 1}
                onChange={() => handleToggle(todo)}
                className="todo-checkbox"
                onClick={(e) => e.stopPropagation()}
              />

              <Link to={`/todos/${todo.id}`} className="todo-link"> 
                <div className="todo-content">
                  <span className="todo-text">
                    {todo.task}
                  </span>
                  {todo.due_date && (
                    <span className="time-remaining">
                      {getTimeRemainingText(todo.due_date)}
                    </span>
                  )}
                </div>
              </Link>

              <button onClick={(e) => {
                e.preventDefault();
                handleDelete(todo.id);
              }}
              className="delete-btn">
                Delete
              </button>
            </li>
          ))}
        </ul>

        <h2 className="section-title">Completed Tasks</h2>

        <ul className="todo-list completed-list">
          {completedTodos.length === 0 && (
            <p className="empty-text">No completed tasks yet.</p>
          )}

          {completedTodos.map(todo => (
            <li 
              key={todo.id} 
              className="todo-item completed-item"
            >
              <input
                type="checkbox"
                checked={todo.completed === 1}
                onChange={() => handleToggle(todo)}
                className="todo-checkbox"
                onClick={(e) => e.stopPropagation()}
              />

              <Link to={`/todos/${todo.id}`} className="todo-link"> 
                <div className="todo-content">
                  <span className="todo-text completed">
                    {todo.task}
                  </span>
                </div>
              </Link>

              <button onClick={(e) => {
                e.preventDefault();
                handleDelete(todo.id);
              }}
              className="delete-btn">
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}