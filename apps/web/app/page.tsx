'use client';

import styles from './page.module.css';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import LogoutButton from './components/LogoutButton';
import { ArrowRight, Terminal, ShieldCheck, Zap, ChevronDown, HelpCircle, Lightbulb } from 'lucide-react';

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

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
                <Link href="/dashboard" className={styles.buttonPrimary}>
                  Dashboard <ArrowRight size={16} className="ml-2" />
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className={styles.buttonSecondary}>Log In</Link>
                <Link href="/login" className={styles.buttonPrimary}>
                  Sign Up <ArrowRight size={16} className="ml-2" />
                </Link>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className={styles.heroTag}>
              <span>New: Browser Support ⚡</span>
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className={styles.heroHeadline}
          >
            <span>Track and Debug Errors</span>
            <span className={styles.heroHeadlineAccent}>10x Faster</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className={styles.heroSubheadline}
          >
            Errly helps development teams monitor errors, debug issues, and improve application
            reliability with real-time monitoring, detailed error context, and AI-powered resolutions.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className={styles.heroButtons}
          >
            {!user ? (
              <>
                <Link href="/login" className={styles.buttonPrimary}>
                  Get Started Free <ArrowRight size={16} className="ml-2" />
                </Link>
                <a href="#features" className={styles.buttonSecondary}>
                  See How It Works <ChevronDown size={16} className="ml-2" />
                </a>
              </>
            ) : (
              <Link href="/dashboard" className={styles.buttonPrimary}>
                Go to Dashboard <ArrowRight size={16} className="ml-2" />
              </Link>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className={styles.heroStats}
          >
            <div className={styles.statItem}>
              <span className={styles.statNumber}>1,200+</span>
              <span className={styles.statLabel}>Active Users</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>250M+</span>
              <span className={styles.statLabel}>Errors Tracked</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>99.9%</span>
              <span className={styles.statLabel}>Uptime</span>
            </div>
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
            Why Teams Choose Errly
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={styles.sectionSubtitle}
          >
            Everything you need to identify and fix errors faster
          </motion.p>
        </div>
        
        <div className={styles.container}>
          <motion.div 
            className={styles.featuresGrid}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                title: 'Real-Time Error Tracking',
                description: 'Monitor errors in production with detailed stack traces, user context, and environment details.',
                icon: <Zap className={styles.featureIcon} />,
              },
              {
                title: 'Smart Error Analysis',
                description: 'AI-powered suggestions help identify root causes and offer potential fixes for faster resolution.',
                icon: <Lightbulb className={styles.featureIcon} />,
              },
              {
                title: 'Secure & Compliant',
                description: 'Enterprise-grade security with data encryption, access controls, and compliance with regulations.',
                icon: <ShieldCheck className={styles.featureIcon} />,
              },
              {
                title: 'Code-Level Integration',
                description: 'Seamless integration with your codebase — works with all popular languages and frameworks.',
                icon: <Terminal className={styles.featureIcon} />,
              },
              {
                title: 'Team Collaboration',
                description: 'Assign errors to team members, add notes, and track resolution progress in one place.',
                icon: <HelpCircle className={styles.featureIcon} />,
              },
              {
                title: 'Custom Alerts',
                description: 'Configure notifications via email, Slack, or webhook when critical errors occur.',
                icon: <Terminal className={styles.featureIcon} />,
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className={styles.card}
                variants={itemVariants}
              >
                <div className={styles.cardIconWrapper}>
                  {feature.icon}
                </div>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardDescription}>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles.testimonialsSection}>
        <div className={styles.container}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className={styles.testimonialHeader}
          >
            <h2 className={styles.sectionTitle}>Loved by Developers</h2>
            <p className={styles.sectionSubtitle}>What our users say about Errly</p>
          </motion.div>

          <div className={styles.testimonialGrid}>
            {[
              {
                quote: "Errly has cut our debugging time in half. The detailed error reports and AI suggestions are game-changers for our team.",
                author: "Sarah Johnson",
                role: "Lead Developer, TechCorp"
              },
              {
                quote: "We deployed Errly across our entire stack and immediately caught critical bugs that had been lurking for months.",
                author: "Michael Chen",
                role: "CTO, StartupX"
              },
              {
                quote: "The integration was seamless and the interface is clean and intuitive. Errly is now an essential part of our workflow.",
                author: "Jessica Williams",
                role: "Senior Engineer, EnterpriseY"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className={styles.testimonialCard}
              >
                <p className={styles.testimonialQuote}>"{testimonial.quote}"</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.authorAvatar}>{testimonial.author.charAt(0)}</div>
                  <div>
                    <h4 className={styles.authorName}>{testimonial.author}</h4>
                    <p className={styles.authorRole}>{testimonial.role}</p>
                  </div>
                </div>
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
              Get started with our free tier today.
            </p>
            {!user ? (
              <Link href="/login" className={styles.buttonPrimary}>
                Start Free Trial <ArrowRight size={16} className="ml-2" />
              </Link>
            ) : (
              <Link href="/dashboard" className={styles.buttonPrimary}>
                Go to Dashboard <ArrowRight size={16} className="ml-2" />
              </Link>
            )}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerLogo}>
              <div className={styles.logoCircle}>
                <span>E</span>
              </div>
              <span className={styles.logoText}>Errly</span>
            </div>
            <p className={styles.footerCopyright}>
              © {new Date().getFullYear()} Errly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 