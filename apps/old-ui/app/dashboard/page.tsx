'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from '../components/LogoutButton';
import { motion } from 'framer-motion';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import styles from './dashboard.module.css';

// Define the Project type based on API response
interface Project {
  id: string;
  name: string;
  created_at: string;
  api_key: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

async function fetchWithErrorHandling(url: string, options?: RequestInit): Promise<any> {
  let response;
  try {
    response = await fetch(url, options);
  } catch (networkError: any) {
    console.error('Network error during fetch:', networkError);
    throw new Error(`Network error: ${networkError.message}`);
  }

  if (!response.ok) {
    let errorPayload: any = { error: `Request failed with status ${response.status}` };
    try {
      // Try to parse the error response body as JSON
      errorPayload = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, use the status text
      console.warn('Failed to parse error response as JSON:', jsonError);
      errorPayload.error = errorPayload.error + `: ${response.statusText}`;
    }
    console.error('API Error Payload:', errorPayload);
    throw new Error(errorPayload.error || errorPayload.details || `API request failed with status ${response.status}`);
  }

  // If response is OK, try to parse JSON body
  try {
    return await response.json();
  } catch (jsonError: any) {
    console.error('Error parsing JSON response:', jsonError);
    throw new Error(`Failed to parse response: ${jsonError.message}`);
  }
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  // Fetch user session
  useEffect(() => {
    const getUser = async () => {
      setLoadingUser(true);
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.error('Error fetching user or no user:', userError?.message);
        router.push('/login');
        return;
      }
      
      setUser(currentUser);
      setLoadingUser(false);
    };
    
    getUser();
  }, [router, supabase.auth]);

  // Fetch projects when user is loaded
  useEffect(() => {
    if (!user) return; // Don't fetch projects until user is loaded

    const fetchProjects = async () => {
      setLoadingProjects(true);
      setError(null);
      try {
        const data: Project[] = await fetchWithErrorHandling(`${API_BASE_URL}/projects`, {
          credentials: 'include',
        });
        setProjects(data);
      } catch (err: any) {
        console.error('Error fetching projects wrapper:', err);
        setError(err.message || 'An unexpected error occurred while fetching projects.');
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [user]);

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || isCreatingProject) return;

    setIsCreatingProject(true);
    setError(null);

    try {
      const newProjectData = await fetchWithErrorHandling(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newProjectName.trim() }),
        credentials: 'include',
      });

      // Fetch projects again to get the new project including its generated API key
      const data: Project[] = await fetchWithErrorHandling(`${API_BASE_URL}/projects`, {
        credentials: 'include',
      });
      setProjects(data); // Update the whole list
      setNewProjectName('');

    } catch (err: any) {
      console.error('Error creating project wrapper:', err);
      setError(err.message || 'An unexpected error occurred while creating the project.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Function to handle copying API key
  const handleCopyKey = (key: string, projectId: string) => {
    if (!navigator.clipboard) {
      setError('Clipboard API not available in this browser or context.');
      console.error('Clipboard API not available.');
      return;
    }
    
    navigator.clipboard.writeText(key).then(() => {
      console.log('API Key copied successfully!');
      setCopiedKeyId(projectId); // Set the ID of the project whose key was copied
      setTimeout(() => setCopiedKeyId(null), 2000); // Reset after 2 seconds
    }).catch(err => {
      // Log the specific error
      console.error('Failed to copy API key due to error:', err);
      // Provide more specific feedback if possible
      let errorMsg = 'Failed to copy API key.';
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        errorMsg = 'Clipboard write permission denied. Ensure the page has focus and try again.';
      } else if (err instanceof Error) {
        errorMsg = `Failed to copy: ${err.message}`;
      }
      setError(errorMsg);
      setCopiedKeyId(null); // Ensure checkmark isn't shown on error
    });
  };

  // Combined loading state
  if (loadingUser) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardWrapper}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.logoLink}>
          <div className={styles.logoCircle}>
            <span>E</span>
          </div>
          <span className={styles.logoText}>Errly</span>
        </Link>
        
        <div className={styles.headerRight}>
          {user && (
            <>
              <span className={styles.userEmail}>
                {user.email}
              </span>
              <Link href="/dashboard/profile" className={styles.profileLink}>
                Profile
              </Link>
            </>
          )}
          <LogoutButton />
        </div>
      </header>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.mainContent}
      >
        {/* Create Project Form */}
        <div className={styles.card}>
          <h2 className={styles.projectsListTitle}>Create New Project</h2>
          <form onSubmit={handleCreateProject} className={styles.createProjectForm}>
            <input
              type="text"
              placeholder="Project Name" 
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className={styles.createProjectInput}
              required
              disabled={isCreatingProject}
            />
            <button 
              type="submit"
              className={`${styles.createProjectButton} button buttonPrimary`}
              disabled={!newProjectName.trim() || isCreatingProject}
            >
              {isCreatingProject ? 'Creating...' : 'Create Project'}
            </button>
          </form>
          {error && <p className={styles.errorMessage}>{error}</p>}
        </div>

        {/* Projects List */}
        <div className={`${styles.card} ${styles.projectsListContainer}`}>
          <h2 className={styles.projectsListTitle}>Your Projects</h2>
          {loadingProjects ? (
            <div className={styles.loadingSpinnerContainer}>
              <div className={styles.loadingSpinner}></div>
            </div>
          ) : error && !loadingProjects ? (
             <p className={styles.errorMessage}>Error loading projects: {error}</p>
          ) : projects.length === 0 ? (
            <p className={styles.noProjectsMessage}>You haven't created any projects yet.</p>
          ) : (
            <ul className={styles.projectsList}>
              {projects.map((project) => (
                <li key={project.id} className={styles.projectItem}>
                  <Link href={`/dashboard/projects/${project.id}`} className={styles.projectLink}>
                    <div className={styles.projectHeader}>
                      <span className={styles.projectName}>{project.name}</span>
                      <span className={styles.projectDate}>
                        Created: {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                  <div className={styles.apiKeySection}>
                    <span className={styles.apiKeyLabel}>API Key:</span>
                    <span className={styles.apiKeyText}>{project.api_key}</span>
                    <button
                      onClick={() => handleCopyKey(project.api_key, project.id)}
                      className={`${styles.copyButton} ${copiedKeyId === project.id ? styles.copied : ''}`}
                      title="Copy API Key"
                    >
                      {copiedKeyId === project.id ? (
                        <CheckIcon />
                      ) : (
                        <ClipboardDocumentIcon />
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
} 