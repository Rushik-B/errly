'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '../lib/supabaseClient';
import styles from './LogoutButton.module.css';

export default function LogoutButton() {
  const navigate = useNavigate();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <button
      onClick={handleSignOut}
      className={styles.logoutButton}
    >
      Log Out
    </button>
  );
} 