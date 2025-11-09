import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
    const { user, logoutUser } = useAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logoutUser();
        setIsMobileMenuOpen(false); // Close mobile menu on logout
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Close mobile menu when clicking on a link
    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Check if a link is active
    const isActiveLink = (path) => {
        return location.pathname === path;
    };

    return (
        <header style={{
            backgroundColor: '#fff',
            borderBottom: '1px solid #e0e0e0',
            padding: '0 20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                maxWidth: '1200px',
                margin: '0 auto',
                height: '70px'
            }}>
                {/* Logo/Brand */}
                <Link 
                    to="/" 
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#007bff',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    onClick={closeMobileMenu}
                >
                    <span style={{ 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                    }}>
                        CA
                    </span>
                    CodeAlpha Social
                </Link>

                {/* Desktop Navigation */}
                <nav style={{
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    gap: '20px'
                }} className="desktop-nav">
                    {user ? (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '20px' 
                        }}>
                            <span style={{ 
                                color: '#666',
                                fontSize: '0.95rem'
                            }}>
                                Hello, <strong>{user.name || user.email}</strong>
                            </span>
                            
                            <Link 
                                to={`/profile/${user.user_id}`}
                                style={{
                                    padding: '8px 16px',
                                    color: isActiveLink(`/profile/${user.user_id}`) ? '#007bff' : '#333',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: isActiveLink(`/profile/${user.user_id}`) ? '#f8f9fa' : 'transparent',
                                    fontWeight: isActiveLink(`/profile/${user.user_id}`) ? '600' : '400'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActiveLink(`/profile/${user.user_id}`)) {
                                        e.target.style.backgroundColor = '#f8f9fa';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActiveLink(`/profile/${user.user_id}`)) {
                                        e.target.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                My Profile
                            </Link>
                            
                            <button 
                                onClick={handleLogout}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#c82333';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#dc3545';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '15px' 
                        }}>
                            <Link 
                                to="/login"
                                style={{
                                    padding: '8px 20px',
                                    color: isActiveLink('/login') ? '#007bff' : '#333',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: isActiveLink('/login') ? '#f8f9fa' : 'transparent',
                                    fontWeight: isActiveLink('/login') ? '600' : '400',
                                    border: isActiveLink('/login') ? '1px solid #007bff' : '1px solid transparent'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActiveLink('/login')) {
                                        e.target.style.backgroundColor = '#f8f9fa';
                                        e.target.style.borderColor = '#dee2e6';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActiveLink('/login')) {
                                        e.target.style.backgroundColor = 'transparent';
                                        e.target.style.borderColor = 'transparent';
                                    }
                                }}
                            >
                                Login
                            </Link>
                            
                            <Link 
                                to="/register"
                                style={{
                                    padding: '8px 20px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    border: '1px solid #007bff'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#0056b3';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#007bff';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <button 
                    onClick={toggleMobileMenu}
                    style={{
                        display: { md: 'none' },
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#333',
                        padding: '5px'
                    }}
                    className="mobile-menu-btn"
                >
                    ☰
                </button>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div style={{
                    display: { md: 'none' },
                    backgroundColor: 'white',
                    borderTop: '1px solid #e0e0e0',
                    padding: '20px',
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }} className="mobile-nav">
                    {user ? (
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: '15px' 
                        }}>
                            <div style={{ 
                                padding: '10px',
                                borderBottom: '1px solid #f0f0f0',
                                color: '#666'
                            }}>
                                Hello, <strong>{user.name || user.email}</strong>
                            </div>
                            
                            <Link 
                                to={`/profile/${user.user_id}`}
                                onClick={closeMobileMenu}
                                style={{
                                    padding: '12px 16px',
                                    color: isActiveLink(`/profile/${user.user_id}`) ? '#007bff' : '#333',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    backgroundColor: isActiveLink(`/profile/${user.user_id}`) ? '#f8f9fa' : 'transparent',
                                    fontWeight: '500'
                                }}
                            >
                                My Profile
                            </Link>
                            
                            <button 
                                onClick={handleLogout}
                                style={{
                                    padding: '12px 16px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    textAlign: 'left'
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: '10px' 
                        }}>
                            <Link 
                                to="/login"
                                onClick={closeMobileMenu}
                                style={{
                                    padding: '12px 16px',
                                    color: isActiveLink('/login') ? '#007bff' : '#333',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    backgroundColor: isActiveLink('/login') ? '#f8f9fa' : 'transparent',
                                    fontWeight: '500',
                                    textAlign: 'center',
                                    border: isActiveLink('/login') ? '1px solid #007bff' : '1px solid #e0e0e0'
                                }}
                            >
                                Login
                            </Link>
                            
                            <Link 
                                to="/register"
                                onClick={closeMobileMenu}
                                style={{
                                    padding: '12px 16px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    fontWeight: '500',
                                    textAlign: 'center'
                                }}
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};

export default Header;