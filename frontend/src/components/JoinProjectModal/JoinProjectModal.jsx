import { useEffect, useRef, useState } from 'react';
import Button from '../Button/Button';
import '../ProjectModal/ProjectModal.css'; // reuse existing modal styles

function JoinProjectModal({ isOpen, onClose, onSubmit }) {
  const dialogRef = useRef(null);
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(projectId);
    setProjectId('');
  };

  return (
    <dialog ref={dialogRef} onCancel={onClose}>
      <h2>Join Project</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Project ID:</label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Enter project ID"
            required
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">Join</Button>
        </div>
      </form>
    </dialog>
  );
}

export default JoinProjectModal;
