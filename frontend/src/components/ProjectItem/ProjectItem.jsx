import Button from '../Button/Button';
import './ProjectItem.css';

function ProjectItem({ project, onJoinLeave, onDelete, onView }) {
  return (
    <div className="project-item">
      <span className="project-name">{project.name}</span>
      <div className="project-actions">
        <Button variant="secondary" onClick={() => onView(project)}>View</Button>
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
