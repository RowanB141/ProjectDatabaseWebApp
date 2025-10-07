import Button from '../../components/Button/Button';
import { useNavigate } from 'react-router-dom'
import { useState } from 'react';
import './Dashboard.css';

function Dashboard() {
  const projects = [];
  const navigate = useNavigate();
  const [hardwareSets, setHardwareSets] = useState([
    { id: 1, name: 'HWSet1', capacity: 0, available: 0 },
    { id:1, name: 'HWSet2', capacity: 0, available: 0 },
  ]);

  const handleLogOut = () => {
    navigate('/')
  }

  const createNewProject = () => {
    // Logic to create a new project
  }

  return (
    <div>
      <section className="banner-section">
        <div className="banner-content">
          <h1>HW Resource Manager</h1>

          <Button variant="secondary" onClick={handleLogOut}>
          Log Out
        </Button>
        </div>
      </section>
      
      <div className="dashboard">
        <section className="projects-section">
          <div className="section-header">
            <h2>Your Projects</h2>
            <Button variant="primary" onClick={createNewProject}>
              Create New Project
            </Button>
          </div>
          
          <div className="projects-list">
            {projects.length === 0 ? (
              <div className="empty-state">
                No projects yet.
              </div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="project-item">
                  {/* Project content will go here */}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="resources-section">
          <h2>Resources & Hardware Sets</h2>
          
          <div className="hardware-sets">
            <div className="hardware-card">
              <h3>{hardwareSets[0].name}</h3>
              <p>Capacity: {hardwareSets[0].capacity}</p>
              <p>Available: {hardwareSets[0].available}</p>
            </div>

            <div className="hardware-card">
              <h3>{hardwareSets[1].name}</h3>
              <p>Capacity: {hardwareSets[1].capacity}</p>
              <p>Available: {hardwareSets[1].available}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;