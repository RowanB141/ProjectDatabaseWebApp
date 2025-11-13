import Button from '../Button/Button';
import './ProjectItem.css';

function ProjectItem({ project, onJoinLeave, onDelete, onView }) {
  return (
    <div className="project-item">
      <div className="project-main">
        <span className="project-name">{project.name}</span>
        {project.projectId && (
          <span className="project-id-badge">{project.projectId}</span>
        )}
      </div>
      <div className="project-actions">
        {project.isMember && (
          <Button variant="secondary" onClick={() => onView(project)}>
            View
          </Button>
        )}
        <Button onClick={() => onJoinLeave(project.id)}>
          {project.isMember ? 'Leave' : 'Join'}
        </Button>
        {project.isMember && (
          <Button variant="danger" onClick={() => onDelete(project.id)}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

export default ProjectItem;
