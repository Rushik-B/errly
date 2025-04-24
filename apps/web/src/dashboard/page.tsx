'use client';

import { useEffect, useState, FormEvent } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ClipboardIcon, CheckIcon, PlusIcon, EyeIcon, EyeSlashIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { LogOut } from 'lucide-react';

// Define the NAV_LINKS constant
const NAV_LINKS = [
  { label: 'Use Cases', href: '/coming-soon' },
  { label: 'Pricing', href: '/coming-soon' },
  { label: 'Manifesto', href: '/coming-soon' },
  { label: 'Help Center', href: '/coming-soon' },
];

// Define the Project type based on API response
interface Project {
  id: string;
  name: string;
  created_at: string;
  api_key: string;
}

// Use import.meta.env for Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Update fetchWithErrorHandling to accept and use an auth token
async function fetchWithErrorHandling(url: string, options?: RequestInit, token?: string | null): Promise<any> {
  let response;
  
  // Prepare headers, adding Authorization if token is provided
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    response = await fetch(url, {
      ...options,
      headers: headers, // Use the potentially modified headers
    });
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
  const [scrolled, setScrolled] = useState(false);
  const [visibleApiKeyId, setVisibleApiKeyId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = getSupabaseClient();
  const { user: authUser, signOut, loading: loadingAuth, session } = useAuth();

  // Detect scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    handleScroll(); // Check initial scroll position
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect if not authenticated after loading is complete
  useEffect(() => {
    if (!loadingAuth) {
        if (!authUser) {
            console.log('Auth state loaded, user not found. Redirecting to login.');
            // Construct the redirect path including search params
            const redirectPath = location.pathname + location.search;
            // Navigate to login, passing the original path as a query parameter
            navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
        } else {
            setUser(authUser);
            setLoadingUser(false);
        }
    } else {
        setLoadingUser(true);
    }
  }, [authUser, loadingAuth, navigate, location.pathname, location.search]);

  // Fetch projects only when authenticated and session is available
  useEffect(() => {
    if (loadingAuth || !session) {
      setLoadingProjects(false);
      return;
    }

    const fetchProjects = async () => {
      setLoadingProjects(true);
      setError(null);
      try {
        const data: Project[] = await fetchWithErrorHandling(
          'https://errly-api.vercel.app/api/projects',
          {},
          session.access_token
        );
        setProjects(data);
      } catch (err: any) {
        console.error('Error fetching projects wrapper:', err);
        setError(err.message || 'An unexpected error occurred while fetching projects.');
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [loadingAuth, session]);

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || isCreatingProject || !session) return;

    setIsCreatingProject(true);
    setError(null);

    try {
      const newProjectData = await fetchWithErrorHandling(
        'https://errly-api.vercel.app/api/projects',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newProjectName.trim() }),
        },
        session.access_token
      );

      const data: Project[] = await fetchWithErrorHandling(
        'https://errly-api.vercel.app/api/projects',
        {},
        session.access_token
      );
      setProjects(data);
      setNewProjectName('');
      setShowCreateForm(false);

    } catch (err: any) {
      console.error('Error creating project wrapper:', err);
      setError(err.message || 'An unexpected error occurred while creating the project.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleCopyKey = (key: string, projectId: string) => {
    if (!navigator.clipboard) {
      setError('Clipboard API not available.');
      return;
    }
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKeyId(projectId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    }).catch(err => {
      console.error('Failed to copy API key:', err);
      setError('Failed to copy API key.');
    });
  };

  const toggleApiKeyVisibility = (projectId: string) => {
    setVisibleApiKeyId(prevId => (prevId === projectId ? null : projectId));
  };

  // Dynamic navbar classes from NavBar.tsx
  const navWrapperClasses = scrolled
    ? 'mx-auto w-[1100px] max-w-full rounded-full bg-black/60 backdrop-blur-xl px-8 py-3 shadow-lg'
    : 'w-full px-8';
  // Add listGap for the links
  const listGap = scrolled ? 'gap-4' : 'gap-6';

  if (loadingAuth) {
    return (
       <div className="flex h-screen items-center justify-center bg-gradient-to-b from-background to-background-muted">
         <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-white"></div>
       </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <div className="min-h-screen text-white bg-[url('/lovable-uploads/dash.png')] bg-cover bg-center bg-fixed relative">
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      
      <nav className={`fixed top-0 left-0 z-40 w-full transition-all duration-300 ${scrolled ? 'pt-3' : 'pt-6'}`}>
        <div className={`flex items-center justify-between transition-all duration-300 ${navWrapperClasses}`}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="bg-white/10 rounded-full p-2">
              <span className="sr-only">Logo</span>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#101015" />
                <circle cx="16" cy="16" r="7" stroke="#fff" strokeWidth="2" />
                <rect x="7" y="23" width="18" height="3" rx="1.5" fill="#fff" />
              </svg>
            </span>
            <span className="ml-1 text-2xl font-semibold tracking-tight text-white">
              Errly
            </span>
          </Link>

          {/* === Navigation Links (Added Back) === */}
          <ul className={`mx-auto hidden md:flex ${listGap} transition-all duration-300`}>
            {NAV_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.href} // Use Link from react-router-dom
                  className="rounded-full px-4 py-2 text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* === End Navigation Links === */}

          {/* User Info / Auth Buttons */}
          <div className="flex items-center gap-3">
            {loadingAuth ? (
              <div className="h-8 w-24 rounded-full bg-white/10 animate-pulse"></div>
            ) : authUser ? (
              <>
                <span className="text-sm text-white/80 hidden sm:block">{authUser.email}</span>
                <Link
                  to="/dashboard/profile"
                  className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Profile
                </Link>
                <button
                  onClick={signOut}
                  title="Logout"
                  className="flex items-center justify-center rounded-full p-2 font-medium text-white/70 transition-all hover:bg-white/10"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full px-6 py-2 font-medium text-white/70 transition-all hover:bg-white/10"
                >
                  Log&nbsp;In
                </Link>
                <Link
                  to="/login"
                  className="rounded-full bg-white px-6 py-2 font-semibold text-black shadow-[0_4px_20px_rgba(0,0,0,0.30)] transition-all hover:bg-white/90"
                >
                  Sign&nbsp;Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-5xl px-8 pb-24 pt-28 sm:pt-32 md:pt-36">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-5xl font-bold">Projects</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 rounded-full bg-[#1e1e2e] px-5 py-2.5 font-medium transition hover:bg-[#282838]"
            disabled={showCreateForm}
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Project</span>
          </button>
        </div>

        {/* Projects List */}
        {loadingProjects ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-white"></div>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-lg bg-red-900/20 p-4 text-red-400">
            <p>{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-white/60">
            <p>You haven't created any projects yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg bg-white/5 px-6 py-4 shadow-sm transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-lg font-semibold text-white">{project.name}</p>
                  <p className="text-sm text-white/60">
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-2 sm:mt-0 self-end sm:self-center">
                  <span className="text-sm text-white/60 mr-2 hidden md:inline">API Key:</span>
                  <span className={`font-mono text-sm rounded px-1 py-0.5 ${visibleApiKeyId === project.id ? 'bg-white/20' : 'bg-transparent'}`}>
                    {visibleApiKeyId === project.id ? project.api_key : '\u2022'.repeat(16)}
                  </span>
                  <button
                    onClick={() => toggleApiKeyVisibility(project.id)}
                    className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label={visibleApiKeyId === project.id ? "Hide API Key" : "Show API Key"}
                  >
                    {visibleApiKeyId === project.id ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleCopyKey(project.api_key, project.id)}
                    className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Copy API Key"
                  >
                    {copiedKeyId === project.id ? <CheckIcon className="h-4 w-4 text-green-400" /> : <ClipboardIcon className="h-4 w-4" />}
                  </button>
                </div>

                <div className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0 self-end sm:self-center">
                  <Link
                    to={`/dashboard/projects/${project.id}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
                  >
                    <ListBulletIcon className="h-4 w-4" aria-hidden="true" />
                    View Logs
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Conditionally render the New Project Form */}
        {showCreateForm && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="flex items-center gap-3">
              <input
                id="projectNameInput"
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name"
                className="flex-1 rounded-lg border border-white/10 bg-[#111116] px-4 py-3 text-white focus:border-white/30 focus:outline-none"
                disabled={isCreatingProject}
                autoFocus
              />
              <button
                type="submit"
                disabled={!newProjectName.trim() || isCreatingProject}
                className="rounded-lg bg-white px-6 py-3 font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingProject ? 'Creating...' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg px-4 py-3 font-medium text-white/70 transition hover:bg-white/10"
              >
                Cancel
              </button>
            </form>
            {error && !isCreatingProject && <p className="mt-3 text-red-400">Error: {error}</p>}
          </div>
        )}
      </div>
    </div>
  );
} 