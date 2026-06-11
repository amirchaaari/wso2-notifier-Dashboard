import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { notificationsApi } from '../api/notificationsApi';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const data = await notificationsApi.getUnreadNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification) => {
        try {
            await notificationsApi.markAsRead(notification.id);
            setNotifications(notifications.filter(n => n.id !== notification.id));
            setIsOpen(false);
            navigate('/incidents');
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications([]);
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    return (
        <div style={{ position: 'fixed', top: '1.5rem', right: '2rem', zIndex: 1000 }} ref={popoverRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-secondary"
                style={{ position: 'relative', padding: '0.5rem', borderRadius: '50%' }}
            >
                <Bell size={20} />
                {notifications.length > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        background: 'var(--status-critical)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%'
                    }}>
                        {notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="glass-panel" style={{
                    position: 'absolute',
                    top: '3rem',
                    right: 0,
                    width: '320px',
                    maxHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    overflow: 'hidden',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        padding: '1rem',
                        borderBottom: '1px solid var(--border-glass)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Notifications</h4>
                        {notifications.length > 0 && (
                            <button 
                                onClick={handleMarkAllRead}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    
                    <div style={{ overflowY: 'auto', flex: 1, maxHeight: '340px' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                No new notifications
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid var(--border-glass)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        background: 'var(--bg-glass-hover)',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass-active)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-glass-hover)'}
                                >
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                        {n.message}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                        {new Date(n.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
