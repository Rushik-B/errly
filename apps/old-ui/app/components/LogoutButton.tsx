'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './LogoutButton.module.css';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
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