import Button from '../../components/Button/Button';
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [hardwareSets, setHardwareSets] = useState([]);

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

  const handleLogOut = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const createNewProject = () => {
    // TODO: open modal or navigate to create project page
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
            {projects.length === 0 ? (
              <div className="empty-state">No projects yet.</div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="project-item">{project.name}</div>
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
    </div>
  );
}

export default Dashboard;