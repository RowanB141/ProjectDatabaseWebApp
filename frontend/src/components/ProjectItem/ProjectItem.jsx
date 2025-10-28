import Button from '../Button/Button';
import './ProjectItem.css';

function ProjectItem({ project, onJoinLeave, onDelete }) {
  return (
    <div className="project-item">
      <span className="project-name">{project.name}</span>
      <div className="project-actions">
        <Button onClick={() => onJoinLeave(project.id)}>
          {project.isMember ? 'Leave' : 'Join'}
        </Button>
        {project.isMember && (
          <Button variant="secondary" onClick={() => onDelete(project.id)}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

export default ProjectItem;
