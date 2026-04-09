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
  const [customDueDate, setCustomDueDate] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();


  if (!isAuthenticated()) {
    return <div className="redirect-message">Redirecting to login...</div>;
  }


  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadTodos();
    
    // Refresh todo colors every minute
    const interval = setInterval(() => {
      setTodos([...todos]); // Force re-render to update colors
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);


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
    if (!newTask.trim()) return;

    // adding debugging
    console.log('Adding todo:', { newTask, duration, useCustomDate, customDueDate });
    
    try {
      let dueDate = null;
      if (useCustomDate && customDueDate) {
        dueDate = new Date(customDueDate).toISOString();
        console.log('Using custom due date:', dueDate);
      } else if (duration) {
        console.log('Using duration:', duration, 'minutes');
      }


      const newTodo = await addTodo(
        newTask, 
        useCustomDate ? null : (duration ? parseInt(duration) : null),
        dueDate
      );

      console.log('Todo added successfully:', newTodo);

      // check if newTodo is the todo object or if its wrapped
      const todoToAdd = newTodo.newTodo || newTodo;
      setTodos([todoToAdd, ...todos]);
      
      //  reset form
      setNewTask('');
      setDuration('');
      setCustomDueDate('');
      setUseCustomDate(false);
      setError('');
    } catch (err) {
      console.error('Failed to add todo:', err);
      setError('Failed to add todo ' + err.message);
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
          />
          
          <div className="time-options">
            <label className="radio-label">
              <input
                type="radio"
                checked={!useCustomDate}
                onChange={() => setUseCustomDate(false)}
              />
              <span>Duration:</span>
              <select 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)}
                disabled={useCustomDate}
                className="duration-select"
              >
                <option value="">No deadline</option>
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


            <label className="radio-label">
              <input
                type="radio"
                checked={useCustomDate}
                onChange={() => setUseCustomDate(true)}
              />
              <span>Due Date:</span>
              <input
                type="datetime-local"
                value={customDueDate}
                onChange={(e) => setCustomDueDate(e.target.value)}
                disabled={!useCustomDate}
                className="date-input"
              />
            </label>
          </div>


          <button type="submit" className="add-btn">Add Todo</button>
        </form>


        {error && <p className="error-text">{error}</p>}


        <ul className="todo-list">
          {todos.map(todo => (
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
                  <span className={`todo-text ${todo.completed === 1 ? 'completed' : ''}`}>
                    {todo.task}
                  </span>
                  {todo.due_date && !todo.completed && (
                    <span className="time-remaining">
                      {getTimeRemainingText(todo.due_date)}
                    </span>
                  )}
                </div>
              </Link>
              <button onClick={(e) => {
                e.preventDefault();
                handleDelete(todo.id)
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