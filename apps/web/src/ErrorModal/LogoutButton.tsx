'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabaseClient';
import styles from './LogoutButton.module.css';

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();
  const supabase = getSupabaseClient();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      console.log('Logout successful, navigating to home.');
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={styles.logoutButton}
    >
      Logout
    </button>
  );
};

export default LogoutButton; 