import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <p>&copy; 2026 DTAP Team 8</p>
                <nav className="footer-nav">
                    <Link to="/feedback" className="footer-link">
                        Feedback
                    </Link>
                    <Link to="/about" className="footer-link">
                        About
                    </Link>
                </nav>
            </div>
        </footer>
    );
}