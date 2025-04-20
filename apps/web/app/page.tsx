'use client';

import styles from './page.module.css';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import LogoutButton from './components/LogoutButton';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    
    getUser();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={styles.navLeft}
          >
            <div className={styles.logoCircle}>
              <span>E</span>
            </div>
            <span className={styles.logoText}>Errly</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={styles.navRight}
          >
            {user ? (
              <>
                <span className={styles.welcomeMessage}>Welcome, {user.email}</span>
                <Link href="/dashboard" className={styles.buttonPrimary}>Dashboard</Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className={styles.buttonPrimary}>Log In</Link>
                <Link href="/login" className={styles.buttonSecondary}>Sign Up</Link>
              </>
            )}
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroBlob1}></div>
        <div className={styles.heroBlob2}></div>
        <div className={`${styles.container} ${styles.heroContent}`}> 
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className={styles.heroHeadline}
          >
            <span>Track and Fix Errors</span>
            <span className={styles.heroHeadlineAccent}>Faster Than Ever</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className={styles.heroSubheadline}
          >
            Errly helps developers identify, track, and fix bugs in your applications with real-time monitoring, detailed reports, and AI-driven suggestions.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className={styles.heroButtons}
          >
            {!user ? (
              <>
                <Link href="/login" className={styles.buttonPrimary}>Get Started for Free</Link>
                <Link href="#features" className={styles.buttonSecondary}>Learn More</Link>
              </>
            ) : (
              <Link href="/dashboard" className={styles.buttonPrimary}>Go to Dashboard</Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={`${styles.container} ${styles.featuresHeader}`}> 
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={styles.sectionTitle}
          >
            Why Choose Errly?
          </motion.h2>
        </div>
        
        <div className={styles.container}>
          <div className={styles.featuresGrid}>
            {[
              {
                title: 'Real-time Monitoring',
                description: 'Get instant notifications when errors occur in your application.',
                icon: '📊',
                delay: 0
              },
              {
                title: 'Detailed Error Reports',
                description: 'Understand exactly what went wrong with comprehensive error context.',
                icon: '🔍',
                delay: 0.2
              },
              {
                title: 'Smart Suggestions',
                description: 'Receive AI-powered suggestions to fix common errors quickly.',
                icon: '💡',
                delay: 0.4
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: feature.delay }}
                className={styles.card}
              >
                <div className={styles.cardIcon}>{feature.icon}</div>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardDescription}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className={styles.ctaSection}
      >
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.sectionTitle}>Ready to get started?</h2>
            <p className={styles.ctaText}>
              Join thousands of developers who use Errly to improve their application reliability.
            </p>
            {!user ? (
              <Link href="/login" className={styles.buttonPrimary}>Sign Up Now</Link>
            ) : (
              <Link href="/dashboard" className={styles.buttonPrimary}>Go to Dashboard</Link>
            )}
          </div>
        </div>
      </motion.section>
    </div>
  );
} 