import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Feedback.css';

export default function Feedback() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
        type: 'suggestion'
    });
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here implement sending to backend!
        console.log('Feedback submitted:', formData);
        setSubmitted(true);
        setTimeout(() => {
            navigate('/todos');
        }, 3000);
    };

    if (submitted) {
        return (
            <div className="feedback-wrapper">
                <div className="feedback-container">
                    <h2>Thank You!</h2>
                    <p>Your feedback has been received. We appreciate your input!</p>
                    <p>Redirecting back to todos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="feedback-wrapper">
            <div className="feedback-container">
                <h1>Feedback & Suggestions</h1>
                <p>Help us improve your todo experience!</p>
                
                <form onSubmit={handleSubmit} className="feedback-form">
                    <div className="form-group">
                        <label htmlFor="type">Feedback Type:</label>
                        <select 
                            id="type" 
                            name="type" 
                            value={formData.type}
                            onChange={handleChange}
                        >
                            <option value="suggestion">Suggestion</option>
                            <option value="bug">Bug Report</option>
                            <option value="feature">Feature Request</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Name (optional):</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Your name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email (optional):</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="message">Message:</label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Tell us what you think..."
                            rows="5"
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate('/todos')} className="cancel-btn">
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn">
                            Submit Feedback
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}