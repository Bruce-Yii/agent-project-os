import React, { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

function PersonalHome({ onNavigate }) {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    fetch(`${API}/v1/projects`).then(r => r.json()).then(d => setProjects(d.projects || [])).catch(() => {});
  }, []);

  const createProject = async () => {
    if (!name) return;
    const res = await fetch(`${API}/v1/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, goal: '' }) });
    const p = await res.json();
    setProjects([...projects, p]);
    setName('');
  };

  return (
    <div>
      <h1>Personal Home <span className="badge mock">MOCK</span></h1>
      <div className="card">
        <h2>Create Project</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Project name" />
        <button className="btn" onClick={createProject}>Create</button>
      </div>
      <div className="card">
        <h2>Projects ({projects.length})</h2>
        {projects.map(p => (
          <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid #334155', cursor: 'pointer' }} onClick={() => onNavigate('project', p.id)}>
            <strong>{p.name}</strong> <span className="badge">{p.status}</span>
            <div className="status">{p.goal || 'No goal set'}</div>
          </div>
        ))}
        {projects.length === 0 && <div className="status">No projects yet. Create one above.</div>}
      </div>
    </div>
  );
}

function ProjectWorkbench({ projectId, onNavigate }) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');

  useEffect(() => {
    fetch(`${API}/v1/projects/${projectId}`).then(r => r.json()).then(setProject).catch(() => {});
    fetch(`${API}/v1/projects/${projectId}/tasks`).then(r => r.json()).then(d => setTasks(d.tasks || [])).catch(() => {});
  }, [projectId]);

  const createTask = async () => {
    if (!taskTitle) return;
    const res = await fetch(`${API}/v1/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, title: taskTitle }) });
    const t = await res.json();
    setTasks([...tasks, t]);
    setTaskTitle('');
  };

  if (!project) return <div>Loading...</div>;

  return (
    <div>
      <h1>{project.name} <span className="badge mock">MOCK</span></h1>
      <div className="card">
        <h2>Project Details</h2>
        <div>Status: {project.status}</div>
        <div>Goal: {project.goal || 'None'}</div>
      </div>
      <div className="card">
        <h2>Tasks ({tasks.length})</h2>
        <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task title" />
        <button className="btn" onClick={createTask}>Add Task</button>
        {tasks.map(t => (
          <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid #334155' }}>
            <strong>{t.title}</strong> <span className="badge">{t.status}</span>
          </div>
        ))}
      </div>
      <button className="btn" onClick={() => onNavigate('home')}>Back to Home</button>
    </div>
  );
}

function AgentWorkbench() {
  return (
    <div>
      <h1>Agent Workbench <span className="badge mock">MOCK</span></h1>
      <div className="card">
        <h2>Agent Session</h2>
        <div className="status">Agent-first direct entry. Create or connect to a Session without a Task.</div>
        <div className="status">Real Provider integration requires WP1-B turn completion.</div>
      </div>
    </div>
  );
}

function Attention() {
  return (
    <div>
      <h1>Attention <span className="badge mock">MOCK</span></h1>
      <div className="card">
        <h2>Pending Items</h2>
        <div className="status">No pending reviews, permissions, or failures.</div>
        <div className="status">Real attention items require WP1-C integration with Run/Review/Event systems.</div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('home');
  const [projectId, setProjectId] = useState(null);

  const navigate = (p, id = null) => {
    setPage(p);
    setProjectId(id);
  };

  return (
    <div className="app">
      <div className="sidebar">
        <h2>Agent Project OS</h2>
        <div className={`nav-item ${page === 'home' ? 'active' : ''}`} onClick={() => navigate('home')}>Personal Home</div>
        <div className={`nav-item ${page === 'project' ? 'active' : ''}`} onClick={() => projectId && navigate('project', projectId)}>Project Workbench</div>
        <div className={`nav-item ${page === 'agent' ? 'active' : ''}`} onClick={() => navigate('agent')}>Agent Workbench</div>
        <div className={`nav-item ${page === 'attention' ? 'active' : ''}`} onClick={() => navigate('attention')}>Attention</div>
        <div className="status" style={{ marginTop: '16px' }}>Mode: MOCK (in-memory)</div>
      </div>
      <div className="main">
        {page === 'home' && <PersonalHome onNavigate={navigate} />}
        {page === 'project' && projectId && <ProjectWorkbench projectId={projectId} onNavigate={navigate} />}
        {page === 'project' && !projectId && <div>Select a project from Home</div>}
        {page === 'agent' && <AgentWorkbench />}
        {page === 'attention' && <Attention />}
      </div>
    </div>
  );
}
