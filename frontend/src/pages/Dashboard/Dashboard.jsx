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
  // local demo hardware state used when backend returns no hardware
  const demoDefaults = [
    { id: 'demo-hw-1', name: 'Hardware Set 1', capacity: 100, available: 100 },
    { id: 'demo-hw-2', name: 'Hardware Set 2', capacity: 100, available: 100 }
  ];
  const [demoHardware, setDemoHardware] = useState(demoDefaults);
  // map of hardware id -> { checkout: string, checkin: string } for quick inputs
  const [hwAmounts, setHwAmounts] = useState({});
  // map of hardware id -> { checkout: string|null, checkin: string|null } for validation errors
  const [hwErrors, setHwErrors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

      fetch('/api/projects/', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(async (r) => {
      if (!r.ok) throw new Error('Failed to load projects');
      return r.json();
    }).then(setProjects).catch(err => console.warn(err));
      // fetch hardware sets
      fetch('/api/hardware/', {
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
      const res = await fetch(`/api/hardware/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, amount })
      });
      const updated = await res.json();
        console.log('update response', updated, res.status);
      if (!res.ok) throw new Error(updated.message || 'Update failed');
      setHardwareSets(prev => prev.map(h => (h.id === updated.id ? updated : h)));
  // clear the amounts for that id after successful update
  setHwAmounts(prev => ({ ...prev, [id]: { checkout: '', checkin: '' } }));
    } catch (err) {
      alert(err.message || 'Error updating hardware');
    }
  };

  // Local demo-mode updater: mutates `demoHardware` to simulate availability changes
  const performDemoUpdate = (id, action, amount = 1) => {
    setDemoHardware(prev => prev.map(h => {
      if (h.id !== id) return h;
      let available = h.available;
      if (action === 'checkout') {
        available = Math.max(0, available - amount);
      } else if (action === 'checkin') {
        available = Math.min(h.capacity, available + amount);
      }
      return { ...h, available };
    }));
    // clear the amounts for that id after simulated update
    setHwAmounts(prev => ({ ...prev, [id]: { checkout: '', checkin: '' } }));
  };

  const handleToggleMembership = async (projectId) => {
    const token = localStorage.getItem('token');
    const project = projects.find(p => p.id === projectId);
    const isJoining = !project.isMember;
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, isMember: isJoining } : p));
    try {
      const endpoint = isJoining ? 'join' : 'leave';
      const res = await fetch(`/api/projects/${projectId}/${endpoint}`, {
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
    // quick client-side duplicate check before sending to server
  const nameToCheck = String(projectData.name || '').toLowerCase().trim();
  const idToCheck = String(projectData.id || '').toLowerCase().trim();
    const dupByName = projects.some(p => String(p.name || '').toLowerCase().trim() === nameToCheck);
    const dupById = projects.some(p => String(p.id || '').toLowerCase().trim() === idToCheck);
    // Enforce unique Project ID first
    if (dupById) {
      alert('A project with this Project ID already exists. Please choose a different Project ID.');
      return;
    }
    // Optionally warn about duplicate names
    if (dupByName) {
      alert('A project with this name already exists. Consider using a different name.');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/projects/', {
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
    const res = await fetch(`/api/projects/${projectId}`, {
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
          {/* Quick controls for first two hardware sets (if present) */}
          <div className="hardware-quick-row" style={{ display: 'flex', gap: '20px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {(() => {
              const isDemo = hardwareSets.length === 0;
              const displayedHardware = isDemo ? demoHardware : hardwareSets;

              return (
                <>
                  {displayedHardware.slice(0,2).map(h => (
                    <div key={h.id} className="hardware-card" style={{ minWidth: '260px' }}>
                      <h3>{h.name}</h3>
                      <p>Capacity: {h.capacity}</p>
                      <p>Available: {h.available}</p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                        {/* checkout input */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="checkout"
                            value={(hwAmounts[h.id] && hwAmounts[h.id].checkout) || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setHwAmounts(prev => ({ ...prev, [h.id]: { ...(prev[h.id] || {}), checkout: val } }));
                              // validate: allow only digits
                              if (val === '' || /^\d+$/.test(val)) {
                                setHwErrors(prev => ({ ...prev, [h.id]: { ...(prev[h.id] || {}), checkout: '' } }));
                              } else {
                                setHwErrors(prev => ({ ...prev, [h.id]: { ...(prev[h.id] || {}), checkout: 'Invalid input' } }));
                              }
                            }}
                              style={{ width: '100px', padding: '6px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.12)' }}
                          />
                          {hwErrors[h.id] && hwErrors[h.id].checkout ? (
                            <div style={{ color: '#d9534f', fontSize: '12px', marginTop: '4px' }}>{hwErrors[h.id].checkout}</div>
                          ) : null}
                        </div>
                        <Button onClick={() => {
                          const val = (hwAmounts[h.id] && hwAmounts[h.id].checkout) || '';
                          if (!/^\d+$/.test(val)) {
                            setHwErrors(prev => ({ ...prev, [h.id]: { ...(prev[h.id] || {}), checkout: 'Invalid input' } }));
                            return;
                          }
                          const num = Number(val);
                          if (num <= 0) {
                            setHwErrors(prev => ({ ...prev, [h.id]: { ...(prev[h.id] || {}), checkout: 'Must be greater than 0' } }));
                            return;
                          }
                          // Prevent checking out more than available
                          if (num > h.available) {
                            setHwErrors(prev => ({ ...prev, [h.id]: { ...(prev[h.id] || {}), checkout: 'Cannot checkout more than available' } }));
                            return;
                          }
                          if (isDemo) {
                            performDemoUpdate(h.id, 'checkout', num);
                            return;
                          }
                          updateHardware(h.id, 'checkout', num);
                        }}>
                          Checkout
                        </Button>

                        {/* checkin input */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="checkin"
                            value={(hwAmounts[h.id] && hwAmounts[h.id].checkin) || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setHwAmounts(prev => ({ ...prev, [h.id]: { ...(prev[h.id] || {}), checkin: val } }));
                              if (val === '' || /^\d+$/.test(val)) {
                                setHwErrors(prev => ({ ...prev, [h.id]: { ...(prev[h.id] || {}), checkin: '' } }));
                              } else {
                                setHwErrors(prev => ({ ...prev, [h.id]: { ...(prev[h.id] || {}), checkin: 'Invalid input' } }));
                              }
                            }}
                            style={{ width: '100px', padding: '6px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.12)' }}
                          />
                          {hwErrors[h.id] && hwErrors[h.id].checkin ? (
                            <div style={{ color: '#d9534f', fontSize: '12px', marginTop: '4px' }}>{hwErrors[h.id].checkin}</div>
                          ) : null}
                        </div>
                        <Button onClick={() => {
                          const val = (hwAmounts[h.id] && hwAmounts[h.id].checkin) || '';
                          if (!/^\d+$/.test(val)) {
                            setHwErrors(prev => ({ ...prev, [h.id]: { ...(prev[h.id] || {}), checkin: 'Invalid input' } }));
                            return;
                          }
                          const num = Number(val);
                          if (num <= 0) {
                            setHwErrors(prev => ({ ...prev, [h.id]: { ...(prev[h.id] || {}), checkin: 'Must be greater than 0' } }));
                            return;
                          }
                          // Prevent checkin that would exceed capacity (optional guard)
                          if (h.available + num > h.capacity) {
                            setHwErrors(prev => ({ ...prev, [h.id]: { ...(prev[h.id] || {}), checkin: 'Cannot checkin more than capacity' } }));
                            return;
                          }
                          if (isDemo) {
                            performDemoUpdate(h.id, 'checkin', num);
                            return;
                          }
                          updateHardware(h.id, 'checkin', num);
                        }}>
                          Checkin
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}
          </div>

          <div className="hardware-sets">
            {(() => {
              const isDemo = hardwareSets.length === 0;
              const displayedHardware = isDemo ? demoHardware : hardwareSets;

              return (
                <>
                  {displayedHardware.slice(2).map(h => (
                    <div key={h.id} className="hardware-card">
                      <h3>{h.name}</h3>
                      <p>Capacity: {h.capacity}</p>
                      <p>Available: {h.available}</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button onClick={() => {
                          // prevent checkout when nothing available
                          if (h.available < 1) {
                            alert('Not enough available to checkout');
                            return;
                          }
                          if (isDemo) {
                            performDemoUpdate(h.id, 'checkout', 1);
                          } else {
                            updateHardware(h.id, 'checkout', 1);
                          }
                        }}>Checkout 1</Button>
                        <Button onClick={() => {
                          // prevent checkin that would exceed capacity
                          if (h.available >= h.capacity) {
                            alert('Already at full capacity');
                            return;
                          }
                          if (isDemo) {
                            performDemoUpdate(h.id, 'checkin', 1);
                          } else {
                            updateHardware(h.id, 'checkin', 1);
                          }
                        }}>Checkin 1</Button>
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}
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
