import Button from '../../components/Button/Button';
import ProjectItem from '../../components/ProjectItem/ProjectItem';
import ProjectModal from '../../components/ProjectModal/ProjectModal';
import ProjectViewModal from '../../components/ProjectViewModal/ProjectViewModal';
import JoinProjectModal from '../../components/JoinProjectModal/JoinProjectModal';
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
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const [availableFilter, setAvailableFilter] = useState('');

  
  useEffect(() => {
    const authToken = localStorage.getItem('token');
    if (!authToken) return;

    const loadInitialData = async () => {
      // Fetch projects
      try {
        const projectsResponse = await fetch('/api/projects/', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (!projectsResponse.ok) throw new Error('Failed to load projects');
        const projectsList = await projectsResponse.json();
        setProjects(projectsList);
      } catch (error) {
        console.warn(error);
      }

      // Fetch hardware sets
      try {
        const hardwareResponse = await fetch('/api/hardware/', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (!hardwareResponse.ok) throw new Error('Failed to load hardware');
        const hardwareList = await hardwareResponse.json();
        setHardwareSets(
          hardwareList.map(hwSet => ({
            id: hwSet.id,
            name: hwSet.name,
            capacity: hwSet.capacity,
            available: hwSet.available
          }))
        );
      } catch (error) {
        console.warn(error);
      }
    };

    loadInitialData();
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
    const authToken = localStorage.getItem('token');

    const projectName = String(projectData?.name || '').trim();
    const projectId = String(projectData?.id || '').trim();
    const projectDescription = String(projectData?.description || '');

    if (!projectName || !projectId) {
      alert('Please fill in Project Name and Project ID.');
      return;
    }

    // Check for duplicates (case-insensitive)
    const normalizedName = projectName.toLowerCase();
    const normalizedId = projectId.toLowerCase();
    
    const existingProjectWithSameName = projects.some(
      project => (project.name || '').toLowerCase().trim() === normalizedName
    );
    const existingProjectWithSameId = projects.some(
      project => (project.id || '').toLowerCase().trim() === normalizedId
    );

    if (existingProjectWithSameId) {
      alert('A project with this Project ID already exists. Please choose a unique ID.');
      return;
    }
    if (existingProjectWithSameName) {
      alert('A project with this name already exists. Please choose a different name.');
      return;
    }

    // Create the project
    try {
      const response = await fetch('/api/projects/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${authToken}` 
        },
        body: JSON.stringify({
          name: projectName,
          id: projectId,
          description: projectDescription
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create project');
      }

      const newProject = await response.json();
      setProjects(previousProjects => [...previousProjects, newProject]);
      handleCloseModal();
    } catch (error) {
      alert(error.message || 'Error creating project');
    }
  };


  const reloadHardware = async () => {
    const authToken = localStorage.getItem('token');
    const response = await fetch('/api/hardware/', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!response.ok) return;
    
    const hardwareList = await response.json();
    setHardwareSets(
      hardwareList.map(hardwareSet => ({
        id: hardwareSet.id,
        name: hardwareSet.name,
        capacity: hardwareSet.capacity,
        available: hardwareSet.available
      }))
    );
  };


  const handleDeleteProject = async (projectId) => {
    const authToken = localStorage.getItem('token');
    
    // Save current state for rollback if deletion fails
    const projectsBackup = projects;
    
    // Optimistically remove the project from UI
    setProjects(previousProjects => 
      previousProjects.filter(project => project.id !== projectId)
    );

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (!response.ok) {
        // Restore projects list on failure
        setProjects(projectsBackup);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete project');
      }

      // Refresh hardware availability since deleted project returned its hardware
      await reloadHardware();
    } catch (error) {
      // Restore projects list on error
      setProjects(projectsBackup);
      alert(error.message);
    }
  };


  const handleToggleMembership = async (projectId) => {
    const authToken = localStorage.getItem('token');
    const targetProject = projects.find(project => project.id === projectId);

    const isJoining = !targetProject.isMember;
    
    // Optimistically update membership status
    setProjects(previousProjects =>
      previousProjects.map(project =>
        project.id === projectId 
          ? { ...project, isMember: isJoining } 
          : project
      )
    );

    try {
      const action = isJoining ? 'join' : 'leave';
      const response = await fetch(
        `/api/projects/${projectId}/${action}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} project`);
      }

    } catch (error) {
      // Revert membership status on error
      setProjects(previousProjects =>
        previousProjects.map(project =>
          project.id === projectId 
            ? { ...project, isMember: !isJoining } 
            : project
        )
      );
      alert(error.message || 'Failed to update membership');
    }
  };

  
  const handleLogOut = () => {
    localStorage.removeItem('token');
    navigate('/');
  };


  const setHardwareAmount = (hardwareId, fieldName, value) => {
    setHwAmounts(previousAmounts => ({
      ...previousAmounts,
      [hardwareId]: {
        ...(previousAmounts[hardwareId] || {}),
        [fieldName]: value
      }
    }));
  };


  const setHardwareError = (hardwareId, fieldName, errorMessage) => {
    setHwErrors(previousErrors => ({
      ...previousErrors,
      [hardwareId]: {
        ...(previousErrors[hardwareId] || {}),
        [fieldName]: errorMessage
      }
    }));
  };


  const clearHardwareError = (hardwareId, fieldName) => {
    setHwErrors(previousErrors => ({
      ...previousErrors,
      [hardwareId]: {
        ...(previousErrors[hardwareId] || {}),
        [fieldName]: null
      }
    }));
  };


  const performDemoUpdate = (hardwareId, action, amount) => {
    setDemoHardware(previousHardware =>
      previousHardware.map(hardwareSet =>
        hardwareSet.id === hardwareId
          ? {
              ...hardwareSet,
              available:
                action === 'checkout'
                  ? Math.max(0, hardwareSet.available - amount)
                  : Math.min(hardwareSet.capacity, hardwareSet.available + amount)
            }
          : hardwareSet
      )
    );
  };


  const updateHardware = async (hardwareId, action, amount) => {
    const authToken = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/hardware/${hardwareId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ action, amount })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Hardware update failed');
      }

      // Update the hardware set with new availability from server
      setHardwareSets(previousSets =>
        previousSets.map(hardwareSet =>
          hardwareSet.id === responseData.id
            ? {
                ...hardwareSet,
                available: responseData.available,
                capacity: responseData.capacity,
                name: responseData.name
              }
            : hardwareSet
        )
      );

      return { ok: true, data: responseData };
    } catch (error) {
      return { ok: false, message: error.message || 'Hardware update failed' };
    }
  };


  const handleViewProject = (project) => {
    setSelectedProject(project);
    setIsViewOpen(true);
  };


  const handleOpenJoinModal = () => {
    setIsJoinModalOpen(true);
  };


  const handleCloseJoinModal = () => {
    setIsJoinModalOpen(false);
  };

  
  const handleJoinProjectById = async (projectId) => {
    if (!projectId.trim()) {
      alert('Please enter a project ID');
      return;
    }

    const authToken = localStorage.getItem('token');
    
    // Find the project with this projectId
    const targetProject = projects.find(
      project => project.projectId?.toLowerCase() === projectId.trim().toLowerCase()
    );

    if (!targetProject) {
      alert('Project not found');
      return;
    }

    if (targetProject.isMember) {
      alert('You are already a member of this project');
      handleCloseJoinModal();
      return;
    }

    try {
      const response = await fetch(`/api/projects/${targetProject.id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (!response.ok) throw new Error('Failed to join project');

      // Update the project in state
      setProjects(previousProjects =>
        previousProjects.map(project =>
          project.id === targetProject.id
            ? { ...project, isMember: true }
            : project
        )
      );

      handleCloseJoinModal();
    } catch (error) {
      alert(error.message || 'Error joining project');
    }
  };


  const handleProjectHardware = async (hardwareName, action, amount, projectId) => {
    // Validate inputs
    if (!amount || amount <= 0) {
      alert('Enter a valid amount');
      return;
    }

    const authToken = localStorage.getItem('token');
    if (!authToken) {
      alert('Please login');
      return;
    }

    // Find the hardware set by name
    const targetHardware = hardwareSets.find(
      hardwareSet => hardwareSet.name === hardwareName
    );
    if (!targetHardware) {
      alert('Hardware not found');
      return;
    }

    // Calculate availability change
    const availabilityDelta = action === 'checkout' ? -amount : amount;

    // Optimistically update global hardware availability immediately
    setHardwareSets(previousSets =>
      previousSets.map(hardwareSet => {
        if (hardwareSet.id !== targetHardware.id) return hardwareSet;
        return {
          ...hardwareSet,
          available: hardwareSet.available + availabilityDelta
        };
      })
    );

    try {
      // Update hardware on server
      const response = await fetch(
        `/api/hardware/${targetHardware.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ action, amount, project_id: projectId })
        }
      );

      const updatedHardware = await response.json();
      if (!response.ok) {
        throw new Error(updatedHardware.message || 'Update failed');
      }

      // Reconcile global hardware with server response
      setHardwareSets(previousSets =>
        previousSets.map(hardwareSet =>
          hardwareSet.id === updatedHardware.id
            ? {
                ...hardwareSet,
                available: updatedHardware.available,
                capacity: updatedHardware.capacity,
                name: updatedHardware.name
              }
            : hardwareSet
        )
      );

      // Update project's hardware usage
      const projectHardwareChange = action === 'checkout' ? amount : -amount;
      
      setProjects(previousProjects =>
        previousProjects.map(project =>
          project.projectId === projectId
            ? {
                ...project,
                hardware: {
                  ...project.hardware,
                  [hardwareName]:
                    (project.hardware?.[hardwareName] || 0) + projectHardwareChange
                }
              }
            : project
        )
      );

      // Update the currently selected project in the modal
      setSelectedProject(previousProject =>
        previousProject && {
          ...previousProject,
          hardware: {
            ...previousProject.hardware,
            [hardwareName]:
              (previousProject.hardware?.[hardwareName] || 0) + projectHardwareChange
          }
        }
      );
    } catch (error) {
      // Roll back optimistic update on error
      const rollbackDelta = action === 'checkout' ? amount : -amount;
      
      setHardwareSets(previousSets =>
        previousSets.map(hardwareSet => {
          if (hardwareSet.id !== targetHardware.id) return hardwareSet;
          return {
            ...hardwareSet,
            available: hardwareSet.available + rollbackDelta
          };
        })
      );
      
      alert(error.message || 'Error updating hardware');
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
            <div className="project-buttons">
              <Button variant="primary" onClick={handleOpenModal}>Create New Project</Button>
              <Button variant="secondary" onClick={handleOpenJoinModal}>Join via projectID</Button>
            </div>
          </div>

          <div className="projects-list">
            {projects.filter(project => project.isMember).length === 0 ? (
              <div className="empty-state">No projects yet.</div>
            ) : (
              projects.filter(project => project.isMember).map((project) => (
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
            const searchTerm = availableFilter.trim().toLowerCase();
            const availableProjects = projects.filter(project => !project.isMember);
            const filteredProjects = searchTerm
              ? availableProjects.filter(project =>
                  String(project.projectId || '').toLowerCase().includes(searchTerm)
                )
              : availableProjects;

            return (
              <div className="projects-list">
                {filteredProjects.length === 0 ? (
                  <div className="empty-state">No projects yet.</div>
                ) : (
                  filteredProjects.map((project) => (
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

        <section className="resources-section">
          <h2>Hardware Sets</h2>
          <div className="hardware-sets">
            {(() => {
              const usingDemoData = hardwareSets.length === 0;
              const hardwareToDisplay = usingDemoData ? demoHardware : hardwareSets;

              return (
                <>
                  {hardwareToDisplay.slice(0, 2).map(hardwareSet => (
                    <div key={hardwareSet.id} className="hardware-card" style={{ minWidth: '260px' }}>
                      <h3>{hardwareSet.name}</h3>
                      <p>Capacity: {hardwareSet.capacity}</p>
                      <p>Available: {hardwareSet.available}</p>
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
        onClose={handleCloseModal}
        onSubmit={handleCreateProject}
      />

      <ProjectViewModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        project={selectedProject}
        hardwareSets={hardwareSets}
        onCheckout={(hardwareName, amount) =>
          selectedProject && handleProjectHardware(hardwareName, 'checkout', amount, selectedProject.projectId)
        }
        onCheckin={(hardwareName, amount) =>
          selectedProject && handleProjectHardware(hardwareName, 'checkin', amount, selectedProject.projectId)
        }
      />

      <JoinProjectModal
        isOpen={isJoinModalOpen}
        onClose={handleCloseJoinModal}
        onSubmit={handleJoinProjectById}
      />
    </div>
  );
}

export default Dashboard;
