import Button from '../../components/Button/Button';
import ProjectItem from '../../components/ProjectItem/ProjectItem';
import ProjectModal from '../../components/ProjectModal/ProjectModal';
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react';
import './Dashboard.css';


function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [hardwareSets, setHardwareSets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

      fetch('http://localhost:5000/api/projects/', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(async (r) => {
      if (!r.ok) throw new Error('Failed to load projects');
      return r.json();
    }).then(setProjects).catch(err => console.warn(err));
      // fetch hardware sets
      fetch('http://localhost:5000/api/hardware/', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(async (r) => {
      if (!r.ok) throw new Error('Failed to load hardware');
      return r.json();
    }).then((hw) => {
        console.log('fetched hardware', hw);
      // normalize id field to id (string)
      setHardwareSets(hw.map(h => ({ id: h.id, name: h.name, capacity: h.capacity, available: h.available })));
    }).catch(err => console.warn(err));
  }, []);


  const updateHardware = async (id, action, amount = 1) => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Please login'); return; }
    try {
        console.log('updating hardware', { id, action, amount });
      const res = await fetch(`http://localhost:5000/api/hardware/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, amount })
      });
      const updated = await res.json();
        console.log('update response', updated, res.status);
      if (!res.ok) throw new Error(updated.message || 'Update failed');
      setHardwareSets(prev => prev.map(h => (h.id === updated.id ? updated : h)));
    } catch (err) {
      alert(err.message || 'Error updating hardware');
    }
  };

  const handleToggleMembership = async (projectId) => {
    const token = localStorage.getItem('token');
    const project = projects.find(p => p.id === projectId);
    const isJoining = !project.isMember;
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, isMember: isJoining } : p));
    try {
      const endpoint = isJoining ? 'join' : 'leave';
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Failed to ${endpoint}`);
    } catch (err) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, isMember: !isJoining } : p));
      alert(err.message);
    }
  };

  const handleCreateProject = async (projectData) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/projects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(projectData)
      });
      if (!res.ok) throw new Error('Failed to create project');
      const newProject = await res.json();
      setProjects(prev => [...prev, newProject]);
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete project');
    setProjects(prev => prev.filter(p => p.id !== projectId));
  } catch (err) {
    alert(err.message);
  }
  };


  const handleLogOut = () => {
    localStorage.removeItem('token');
    navigate('/');
  };


  const createNewProject = () => {
    setIsModalOpen(true);
  };


  return (
    <div>
      <section className="banner-section">
        <div className="banner-content">
          <h1>HW Resource Manager</h1>
          <Button variant="secondary" onClick={handleLogOut}>Log Out</Button>
        </div>
      </section>


      <div className="dashboard">
        <section className="projects-section">
          <div className="section-header">
            <h2>Your Projects</h2>
            <Button variant="primary" onClick={createNewProject}>Create New Project</Button>
          </div>

          <div className="projects-list">
            {projects.filter(p => p.isMember).length === 0 ? (
              <div className="empty-state">No projects yet.</div>
            ) : (
              projects.filter(p => p.isMember).map((project) => (
                <ProjectItem 
                  key={project.id} 
                  project={project}
                  onJoinLeave={handleToggleMembership}
                  onDelete={handleDeleteProject}
                />
              ))
            )}
          </div>
        </section>


        <section className="projects-section">
          <div className="section-header">
            <h2>Available Projects</h2>
          </div>

          <div className="projects-list">
            {projects.filter(p => !p.isMember).length === 0 ? (
              <div className="empty-state">No projects yet.</div>
            ) : (
              projects.filter(p => !p.isMember).map((project) => (
                <ProjectItem 
                  key={project.id} 
                  project={project}
                  onJoinLeave={handleToggleMembership}
                />
              ))
            )}
          </div>
        </section>


        <section className="resources-section">
          <h2>Resources & Hardware Sets</h2>

          <div className="hardware-sets">
            {hardwareSets.map(h => (
              <div key={h.id} className="hardware-card">
                <h3>{h.name}</h3>
                <p>Capacity: {h.capacity}</p>
                <p>Available: {h.available}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button onClick={() => updateHardware(h.id, 'checkout', 1)}>Checkout 1</Button>
                  <Button onClick={() => updateHardware(h.id, 'checkin', 1)}>Checkin 1</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>


      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}


export default Dashboard;
