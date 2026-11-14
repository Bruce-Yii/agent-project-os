import React, { useState, useEffect } from 'react';
import { api, ApiError, API } from './api.js';

function modeBadge(mode) {
  const real = mode === 'real';
  return <span className={`badge ${real ? 'real' : 'mock'}`}>{real ? 'REAL (DB)' : 'MOCK (in-memory)'}</span>;
}

function PersonalHome({ onNavigate, mode }) {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api.listProjects();
      setProjects(d.projects || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createProject = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const p = await api.createProject(name.trim(), '');
      setProjects(prev => [...prev, p]);
      setName('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <h1>Personal Home {modeBadge(mode)}</h1>
      <div className="card">
        <h2>Create Project</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Project name" disabled={creating} />
        <button className="btn" onClick={createProject} disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
      </div>
      <div className="card">
        <h2>Projects ({projects.length})</h2>
        {loading && <div className="status">Loading projects...</div>}
        {error && (
          <div className="status" style={{ color: '#f87171' }}>
            Error: {error}
            <button className="btn" onClick={load} style={{ marginLeft: '8px' }}>Retry</button>
          </div>
        )}
        {!loading && !error && projects.map(p => (
          <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid #334155', cursor: 'pointer' }} onClick={() => onNavigate('project', p.id)}>
            <strong>{p.name}</strong> <span className="badge">{p.status}</span>
            <div className="status">{p.goal || 'No goal set'}</div>
          </div>
        ))}
        {!loading && !error && projects.length === 0 && <div className="status">No projects yet. Create one above.</div>}
      </div>
    </div>
  );
}

function ProjectWorkbench({ projectId, onNavigate, mode }) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, t] = await Promise.all([api.getProject(projectId), api.listTasks(projectId)]);
      setProject(p);
      setTasks(t.tasks || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const createTask = async () => {
    if (!taskTitle.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const t = await api.createTask(projectId, taskTitle.trim());
      setTasks(prev => [...prev, t]);
      setTaskTitle('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div>Loading project...</div>;
  if (error) return <div className="status" style={{ color: '#f87171' }}>Error: {error} <button className="btn" onClick={load}>Retry</button></div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div>
      <h1>{project.name} {modeBadge(mode)}</h1>
      <div className="card">
        <h2>Project Details</h2>
        <div>Status: {project.status}</div>
        <div>Goal: {project.goal || 'None'}</div>
      </div>
      <div className="card">
        <h2>Tasks ({tasks.length})</h2>
        <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task title" disabled={creating} />
        <button className="btn" onClick={createTask} disabled={creating}>{creating ? 'Adding...' : 'Add Task'}</button>
        {tasks.map(t => (
          <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid #334155' }}>
            <strong>{t.title}</strong> <span className="badge">{t.status}</span>
          </div>
        ))}
        {tasks.length === 0 && <div className="status">No tasks yet.</div>}
      </div>
      <button className="btn" onClick={() => onNavigate('home')}>Back to Home</button>
    </div>
  );
}

function AgentWorkbench() {
  const [caps, setCaps] = useState(null);
  const [providers, setProviders] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connectMsg, setConnectMsg] = useState(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionProvider, setSessionProvider] = useState('');
  const [sessionCwd, setSessionCwd] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionProjectId, setSessionProjectId] = useState('');
  const [sessionTaskId, setSessionTaskId] = useState('');
  const [sessionAssignmentId, setSessionAssignmentId] = useState('');
  const [sessionMsg, setSessionMsg] = useState(null);

  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState(null);
  const [timelineMeta, setTimelineMeta] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);
  const [sseStatus, setSseStatus] = useState('disconnected');

  const sessionIdOf = (s) => s.id || s.sessionId;

  const load = async () => {
    setLoading(true);
    setError(null);
    setConnectMsg(null);
    try {
      const [c, p] = await Promise.all([api.capabilities(), api.providers()]);
      setCaps(c);
      setProviders(p.providers || []);
      if (!sessionProvider && (p.providers || []).length > 0) {
        const firstAvailable = (p.providers || []).find(x => x.available) || (p.providers || [])[0];
        if (firstAvailable) setSessionProvider(firstAvailable.id || firstAvailable.name);
      }
      try {
        const s = await api.agentSessions();
        const list = s.sessions || s.agents || [];
        setSessions(list);
        if (!selectedSessionId && list.length > 0) {
          setSelectedSessionId(sessionIdOf(list[0]));
        }
      } catch (e) {
        // keep providers even if sessions fail
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async (sid) => {
    const target = sid || selectedSessionId;
    if (!target) return;
    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const t = await api.agentTimeline(target);
      const entries = t.entries || [];
      setTimeline(entries);
      setTimelineMeta(t);
    } catch (e) {
      setTimelineError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setTimelineLoading(false);
    }
  };

  const backfill = async () => {
    // Reconnect/backfill: fetch timeline to recover missed events.
    await fetchTimeline(selectedSessionId);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchTimeline(selectedSessionId);
    } else {
      setTimeline([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId]);

  // Real-time event stream via SSE with reconnect/backfill.
  useEffect(() => {
    if (!selectedSessionId) {
      setLiveEvents([]);
      setSseStatus('disconnected');
      return;
    }
    setLiveEvents([]);
    let es = null;
    let cancelled = false;
    const connect = async () => {
      await fetchTimeline(selectedSessionId);
      if (cancelled) return;
      const url = `${API}/v1/agents/sessions/${encodeURIComponent(selectedSessionId)}/events`;
      const source = new EventSource(url);
      es = source;
      setSseStatus('connecting');
      source.onopen = () => {
        setSseStatus('connected');
        fetchTimeline(selectedSessionId);
      };
      source.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setLiveEvents(prev => [...prev, data]);
        } catch {
          setLiveEvents(prev => [...prev, { type: 'message', payload: e.data }]);
        }
      };
      source.onerror = () => {
        setSseStatus('reconnecting');
      };
    };
    connect();
    return () => {
      cancelled = true;
      if (es) es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId]);

  // Reconnect/backfill on visibility/focus/online changes.
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        backfill();
      }
    };
    const focusHandler = () => backfill();
    const onlineHandler = () => backfill();
    document.addEventListener('visibilitychange', handler);
    window.addEventListener('focus', focusHandler);
    window.addEventListener('online', onlineHandler);
    return () => {
      document.removeEventListener('visibilitychange', handler);
      window.removeEventListener('focus', focusHandler);
      window.removeEventListener('online', onlineHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId]);

  const createSession = async () => {
    if (!sessionProvider.trim()) return;
    setCreatingSession(true);
    setError(null);
    setSessionMsg(null);
    try {
      const s = await api.createAgentSession(sessionProvider.trim(), sessionCwd.trim(), sessionTitle.trim(), sessionProjectId.trim() || null, sessionTaskId.trim() || null, sessionAssignmentId.trim() || null);
      setSessions(prev => [...prev, s]);
      setSessionTitle('');
      setSessionMsg(s.mock ? 'Session created (mock).' : 'Session created (real).');
      const newId = sessionIdOf(s);
      if (newId) setSelectedSessionId(newId);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setCreatingSession(false);
    }
  };

  const connectProvider = async () => {
    setConnecting(true);
    setError(null);
    setConnectMsg(null);
    try {
      const p = await api.providers();
      setProviders(p.providers || []);
      setConnectMsg(p.mock ? 'Providers are mock (WP1-B not connected).' : 'Provider connected.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setConnecting(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedSessionId || !messageText.trim()) return;
    setSending(true);
    setSendMsg(null);
    try {
      const r = await api.sendAgentMessage(selectedSessionId, messageText.trim());
      setSendMsg(r.mock ? 'Sent (mock).' : 'Sent.');
      setMessageText('');
      // backfill after send
      await fetchTimeline(selectedSessionId);
    } catch (e) {
      setSendMsg(e instanceof ApiError ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  const mode = caps?.mode || 'mock';
  const selectedSession = sessions.find(s => sessionIdOf(s) === selectedSessionId);

  return (
    <div>
      <h1>Agent Workbench {modeBadge(mode)}</h1>
      <div className="card">
        <h2>Providers</h2>
        {loading && <div className="status">Loading providers...</div>}
        {error && (
          <div className="status" style={{ color: '#f87171' }}>
            Error: {error}
            <button className="btn" onClick={load} style={{ marginLeft: '8px' }}>Retry</button>
          </div>
        )}
        {!loading && !error && (
          <>
            <button className="btn" onClick={connectProvider} disabled={connecting}>
              {connecting ? 'Connecting...' : 'Connect Provider'}
            </button>
            {connectMsg && <div className="status">{connectMsg}</div>}
            {providers.length === 0 && <div className="status">No providers available.</div>}
            {providers.map((p, i) => (
              <div key={p.id || i} style={{ padding: '8px 0', borderBottom: '1px solid #334155' }}>
                <strong>{p.name}</strong>{' '}
                <span className={`badge ${p.mock ? 'mock' : 'real'}`}>{p.mock ? 'MOCK' : 'REAL'}</span>
                <div className="status">{p.available ? 'Available' : 'Unavailable'}{p.error ? ` — ${p.error}` : ''}</div>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="card">
        <h2>Agent Sessions</h2>
        {loading && <div className="status">Loading sessions...</div>}
        {!loading && !error && (
          <>
            <div style={{ marginBottom: '8px' }}>
              <input value={sessionProvider} onChange={e => setSessionProvider(e.target.value)} placeholder="Provider (e.g. claude)" disabled={creatingSession} />
              <input value={sessionCwd} onChange={e => setSessionCwd(e.target.value)} placeholder="Working directory (optional)" disabled={creatingSession} />
              <input value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} placeholder="Session title (optional)" disabled={creatingSession} />
              <input value={sessionProjectId} onChange={e => setSessionProjectId(e.target.value)} placeholder="Project ID (optional)" disabled={creatingSession} />
               <input value={sessionTaskId} onChange={e => setSessionTaskId(e.target.value)} placeholder="Task ID (optional)" disabled={creatingSession} />
               <input value={sessionAssignmentId} onChange={e => setSessionAssignmentId(e.target.value)} placeholder="Assignment ID (optional)" disabled={creatingSession} />
              <button className="btn" onClick={createSession} disabled={creatingSession || !sessionProvider.trim()}>
                {creatingSession ? 'Creating...' : 'Create Session'}
              </button>
              {sessionMsg && <div className="status">{sessionMsg}</div>}
            </div>
            {sessions.length === 0 && <div className="status">No active sessions.</div>}
            {sessions.map((s, i) => {
              const sid = sessionIdOf(s);
              const selected = sid === selectedSessionId;
              return (
                <div key={sid || i} style={{ padding: '8px 0', borderBottom: '1px solid #334155', background: selected ? '#1e293b' : 'transparent', cursor: 'pointer' }} onClick={() => setSelectedSessionId(sid)}>
                  <strong>{sid || 'session'}</strong>{' '}
                  <span className={`badge ${s.mock ? 'mock' : 'real'}`}>{s.mock ? 'MOCK' : 'REAL'}</span>
                  <span className="badge">{s.status || 'unknown'}</span>
                  {s.resumeType && <span className="badge">{s.resumeType}</span>}
                  {s.provider && <div className="status">Provider: {s.provider}</div>}
                  {s.cwd && <div className="status">CWD: {s.cwd}</div>}
                  {s.projectId && <div className="status">Project: {s.projectId}</div>}
                   {s.taskId && <div className="status">Task: {s.taskId}</div>}
                   {s.assignmentId && <div className="status">Assignment: {s.assignmentId}</div>}
                </div>
              );
            })}
          </>
        )}
      </div>

      {selectedSessionId && (
        <div className="card">
          <h2>Session: {selectedSessionId}</h2>
          {selectedSession && selectedSession.resumeType && (
            <div className="status">resumeType: {selectedSession.resumeType}</div>
          )}
          <div style={{ marginBottom: '8px' }}>
            <textarea value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Type a message..." disabled={sending} rows={3} style={{ width: '100%' }} />
            <button className="btn" onClick={sendMessage} disabled={sending || !messageText.trim()}>
              {sending ? 'Sending...' : 'Send'}
            </button>
            {sendMsg && <div className="status">{sendMsg}</div>}
          </div>

          <h3>Event Stream / Timeline</h3>
          <div className="status">SSE: {sseStatus}</div>
          {liveEvents.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Live events ({liveEvents.length})</strong>
              {liveEvents.map((ev, i) => (
                <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #334155' }}>
                  <strong>{ev.type || 'event'}</strong>
                  {ev.timestamp && <span className="status" style={{ marginLeft: '8px' }}>{ev.timestamp}</span>}
                </div>
              ))}
            </div>
          )}
          {timelineLoading && <div className="status">Loading timeline...</div>}
          {timelineError && <div className="status" style={{ color: '#f87171' }}>Error: {timelineError} <button className="btn" onClick={() => fetchTimeline(selectedSessionId)} style={{ marginLeft: '8px' }}>Retry</button></div>}
          {!timelineLoading && !timelineError && (
            <>
              <button className="btn" onClick={() => fetchTimeline(selectedSessionId)} style={{ marginBottom: '8px' }}>Refresh / Backfill</button>
              {timeline.length === 0 && <div className="status">No timeline entries.</div>}
              {timeline.map((e, i) => (
                <div key={e.id || e.cursor || i} style={{ padding: '6px 0', borderBottom: '1px solid #334155' }}>
                  <strong>{e.type || 'event'}</strong>
                  {e.timestamp && <span className="status" style={{ marginLeft: '8px' }}>{e.timestamp}</span>}
                  <pre className="status" style={{ whiteSpace: 'pre-wrap', margin: '4px 0' }}>{typeof e.payload === 'string' ? e.payload : JSON.stringify(e.payload || e, null, 2)}</pre>
                </div>
              ))}
              {timelineMeta && timelineMeta.gap && (
                <div className="status" style={{ color: '#f59e0b' }}>Event gap detected — timeline may be incomplete.</div>
              )}
            </>
          )}
        </div>
      )}

      <div className="card">
        <h2>Capabilities</h2>
        {caps && (
          <>
            <div className="status">Real: {(caps.real || []).join(', ') || 'none'}</div>
            <div className="status">Mock: {(caps.mock || []).join(', ') || 'none'}</div>
          </>
        )}
      </div>
    </div>
  );
}

function Attention() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api.attention();
      setData(d);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const mode = data?.mode || 'mock';
  const items = data?.items || data?.attention || data?.attentionItems || data?.pending || [];
  const deferred = data?.deferred || data?.label === 'DEFERRED';

  return (
    <div>
      <h1>Attention {modeBadge(mode)} <span className="badge mock">DEFERRED</span></h1>
      <div className="card">
        <h2>Pending Items</h2>
        {loading && <div className="status">Loading attention items...</div>}
        {error && (
          <div className="status" style={{ color: '#f87171' }}>
            Error: {error}
            <button className="btn" onClick={load} style={{ marginLeft: '8px' }}>Retry</button>
          </div>
        )}
        {!loading && !error && items.length === 0 && <div className="status">No pending items</div>}
        {!loading && !error && items.map((item, i) => (
          <div key={item.id || i} style={{ padding: '8px 0', borderBottom: '1px solid #334155' }}>
            <strong>{item.title || item.type || 'Attention item'}</strong>{' '}
            <span className={`badge ${item.mock ? 'mock' : 'real'}`}>{item.mock ? 'MOCK' : 'REAL'}</span>
            {item.description && <div className="status">{item.description}</div>}
          </div>
        ))}
        <div className="status" style={{ color: '#f59e0b' }}>Attention is DEFERRED — requires WP1-C module contract v0.1 (review/approval/attention).</div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('home');
  const [projectId, setProjectId] = useState(null);
  const [mode, setMode] = useState(null);
  const [capError, setCapError] = useState(null);

  const navigate = (p, id = null) => {
    setPage(p);
    setProjectId(id);
  };

  useEffect(() => {
    let cancelled = false;
    api.capabilities()
      .then(c => { if (!cancelled) setMode(c.mode || 'unknown'); })
      .catch(e => { if (!cancelled) setCapError(e instanceof ApiError ? e.message : String(e)); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="app">
      <div className="sidebar">
        <h2>Agent Project OS</h2>
        <div className={`nav-item ${page === 'home' ? 'active' : ''}`} onClick={() => navigate('home')}>Personal Home</div>
        <div className={`nav-item ${page === 'project' ? 'active' : ''}`} onClick={() => projectId && navigate('project', projectId)}>Project Workbench</div>
        <div className={`nav-item ${page === 'agent' ? 'active' : ''}`} onClick={() => navigate('agent')}>Agent Workbench</div>
        <div className={`nav-item ${page === 'attention' ? 'active' : ''}`} onClick={() => navigate('attention')}>Attention</div>
        <div className="status" style={{ marginTop: '16px' }}>Mode: {mode || (capError ? `error: ${capError}` : 'loading...')}</div>
        <div className="status" style={{ color: '#f59e0b' }}>Commands: not implemented (501)</div>
      </div>
      <div className="main">
        {page === 'home' && <PersonalHome onNavigate={navigate} mode={mode} />}
        {page === 'project' && projectId && <ProjectWorkbench projectId={projectId} onNavigate={navigate} mode={mode} />}
        {page === 'project' && !projectId && <div>Select a project from Home</div>}
        {page === 'agent' && <AgentWorkbench />}
        {page === 'attention' && <Attention />}
      </div>
    </div>
  );
}