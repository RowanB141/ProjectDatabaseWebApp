import Button from '../../components/Button/Button';
import ProjectItem from '../../components/ProjectItem/ProjectItem';
import ProjectModal from '../../components/ProjectModal/ProjectModal';
import ProjectViewModal from '../../components/ProjectViewModal/ProjectViewModal';
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react';
import './Dashboard.css';


function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [hardwareSets, setHardwareSets] = useState([]);

  const demoDefaults = [
    { id: 'demo-hw-1', name: 'Hardware Set 1', capacity: 100, available: 100 },
    { id: 'demo-hw-2', name: 'Hardware Set 2', capacity: 100, available: 100 }
  ];
  const [demoHardware, setDemoHardware] = useState(demoDefaults);
  
  const [hwAmounts, setHwAmounts] = useState({});
  
  const [hwErrors, setHwErrors] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', id: '', description: '' });

  const [selectedProject, setSelectedProject] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [availableFilter, setAvailableFilter] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const loadData = async () => {
      try {
        const projRes = await fetch('http://localhost:5000/api/projects/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!projRes.ok) throw new Error('Failed to load projects');
        const projData = await projRes.json();
        setProjects(projData);
      } catch (e) {
        console.warn(e);
      }

      try {
        const hwRes = await fetch('http://localhost:5000/api/hardware/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!hwRes.ok) throw new Error('Failed to load hardware');
        const hw = await hwRes.json();
        setHardwareSets(hw.map(h => ({ id: h.id, name: h.name, capacity: h.capacity, available: h.available })));
      } catch (e) {
        console.warn(e);
      }
    };

    loadData();
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewProject({ name: '', id: '', description: '' });
  };

  const handleInputChange = (field, value) => {
    setNewProject(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateProject = async (projectData) => {
    const token = localStorage.getItem('token');

    const name = String(projectData?.name || '').trim();
    const projId = String(projectData?.id || '').trim();
    if (!name || !projId) {
      alert('Please fill in Project Name and Project ID.');
      return;
    }

    const nameToCheck = name.toLowerCase();
    const idToCheck = projId.toLowerCase();
    const dupByName = projects.some(p => (p.name || '').toLowerCase().trim() === nameToCheck);
    const dupById = projects.some(p => (p.id || '').toLowerCase().trim() === idToCheck);
    if (dupById) {
      alert('A project with this Project ID already exists. Please choose a unique ID.');
      return;
    }
    if (dupByName) {
      alert('A project with this name already exists. Please choose a different name.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/projects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          id: projId,
          description: String(projectData?.description || '')
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create project');
      }

      const created = await res.json();
      setProjects(prev => [...prev, created]);
      handleCloseModal();
    } catch (err) {
      alert(err.message || 'Error creating project');
    }
  };


  const reloadHardware = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/hardware/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const hw = await res.json();
    setHardwareSets(hw.map(h => ({
      id: h.id,
      name: h.name,
      capacity: h.capacity,
      available: h.available
    })));
  };

  const handleDeleteProject = async (projectId) => {
    const token = localStorage.getItem('token');
    const backup = projects;
    setProjects(prev => prev.filter(p => p.id !== projectId));

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        setProjects(backup);
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete project');
      }

      await reloadHardware();
    } catch (err) {
      setProjects(backup);
      alert(err.message);
    }
  };


  const handleToggleMembership = async (projectId) => {
    const token = localStorage.getItem('token');
    const project = projects.find(p => p.id === projectId);

    const isJoining = !project.isMember;
    setProjects(prev =>
      prev.map(p => p.id === projectId ? { ...p, isMember: isJoining } : p)
    );

    try {
      const endpoint = isJoining ? 'join' : 'leave';
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Failed to ${endpoint}`);
    } catch (err) {
      // revert on error
      setProjects(prev =>
        prev.map(p => p.id === projectId ? { ...p, isMember: !isJoining } : p)
      );
      alert(err.message || 'Failed to update membership');
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const setHwAmount = (hid, field, value) => {
    setHwAmounts(prev => ({ ...prev, [hid]: { ...(prev[hid] || {}), [field]: value } }));
  };

  const setHwError = (hid, field, message) => {
    setHwErrors(prev => ({ ...prev, [hid]: { ...(prev[hid] || {}), [field]: message } }));
  };

  const clearHwError = (hid, field) => {
    setHwErrors(prev => ({ ...prev, [hid]: { ...(prev[hid] || {}), [field]: null } }));
  };

  const performDemoUpdate = (hid, action, amount) => {
    setDemoHardware(prev =>
      prev.map(h => h.id === hid
        ? {
            ...h,
            available:
              action === 'checkout'
                ? Math.max(0, h.available - amount)
                : Math.min(h.capacity, h.available + amount)
          }
        : h
      )
    );
  };

  const updateHardware = async (hid, action, amount) => {
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://localhost:5000/api/hardware/${hid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, amount })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Hardware update failed');
      }

      setHardwareSets(prev =>
        prev.map(h => h.id === data.id ? { ...h, available: data.available, capacity: data.capacity, name: data.name } : h)
      );

      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: err.message || 'Hardware update failed' };
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setIsViewOpen(true);
  };

  const handleProjectHardware = async (hardwareName, action, amount, projectHumanId) => {
    if (!amount || amount <= 0) { alert('Enter a valid amount'); return; }
    const token = localStorage.getItem('token');
    if (!token) { alert('Please login'); return; }

    const hw = hardwareSets.find(h => h.name === hardwareName);
    if (!hw) { alert('Hardware not found'); return; }

    try {
      const res = await fetch(`http://localhost:5000/api/hardware/${hw.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, amount, project_id: projectHumanId })
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || 'Update failed');

      setHardwareSets(prev => prev.map(h => h.id === updated.id
        ? { ...h, available: updated.available, capacity: updated.capacity, name: updated.name }
        : h
      ));
      
      setProjects(prev => prev.map(p => p.projectId === projectHumanId
        ? {
            ...p,
            hardware: {
              ...p.hardware,
              [hardwareName]: (p.hardware?.[hardwareName] || 0) + (action === 'checkout' ? amount : -amount)
            }
          }
        : p
      ));
      setSelectedProject(prev => prev && {
        ...prev,
        hardware: {
          ...prev.hardware,
          [hardwareName]: (prev.hardware?.[hardwareName] || 0) + (action === 'checkout' ? amount : -amount)
        }
      });
    } catch (err) {
      alert(err.message || 'Error updating hardware');
    }
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
            <Button variant="primary" onClick={handleOpenModal}>Create New Project</Button>
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
                  onView={handleViewProject}
                />
              ))
            )}
          </div>
        </section>

        <section className="projects-section">
          <div className="section-header">
            <h2>Available Projects</h2>
            <input
              type="text"
              className="projectid-search"
              placeholder="Search by Project ID…"
              value={availableFilter}
              onChange={(e) => setAvailableFilter(e.target.value)}
            />
          </div>

          {(() => {
            const needle = availableFilter.trim().toLowerCase();
            const list = projects.filter(p => !p.isMember);
            const filtered = needle
              ? list.filter(p => String(p.projectId || '').toLowerCase().includes(needle))
              : list;

            return (
              <div className="projects-list">
                {filtered.length === 0 ? (
                  <div className="empty-state">No projects yet.</div>
                ) : (
                  filtered.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      onJoinLeave={handleToggleMembership}
                      onView={handleViewProject}
                    />
                  ))
                )}
              </div>
            );
          })()}
        </section>
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateProject}
      />


      <ProjectViewModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        project={selectedProject}
        hardwareSets={hardwareSets}
        onCheckout={(name, amt) => selectedProject && handleProjectHardware(name, 'checkout', amt, selectedProject.projectId)}
        onCheckin={(name, amt) => selectedProject && handleProjectHardware(name, 'checkin', amt, selectedProject.projectId)}
      />
    </div>
  );
}

export default Dashboard;
