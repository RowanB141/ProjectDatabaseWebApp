import { useEffect, useRef, useState } from 'react';
import Button from '../Button/Button';
import './ProjectModal.css';

function ProjectModal({ isOpen, onClose, onSubmit }) {
  const dialogRef = useRef(null);
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, id, description });
    setName('');
    setId('');
    setDescription('');
  };

  return (
    <dialog ref={dialogRef} onCancel={onClose}>
      <h2>Create New Project</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Project Name:</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Project ID:</label>
          <input 
            type="text" 
            value={id} 
            onChange={(e) => setId(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required 
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <Button type="submit" variant="primary">Create</Button>
          <Button type="button" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </dialog>
  );
}

export default ProjectModal;
