import { useEffect, useRef, useState } from 'react';
import Button from '../Button/Button';
import '../ProjectModal/ProjectModal.css';
import './ProjectViewModal.css';

function ProjectViewModal({ isOpen, onClose, project, hardwareSets, onCheckout, onCheckin }) {
  const dialogRef = useRef(null);
  const [amounts, setAmounts] = useState({ HWSet1: '', HWSet2: '' });

  useEffect(() => {
    if (isOpen) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [isOpen]);

  useEffect(() => {
    setAmounts({ HWSet1: '', HWSet2: '' });
  }, [project?.id]);

  const byName = (name) =>
    hardwareSets.find((h) => h.name === name) || { capacity: 0, available: 0 };

  const projectQty = (name) => project?.hardware?.[name] ?? 0;

  const renderCard = (name) => {
    const global = byName(name);
    const qty = amounts[name] ?? '';
    return (
      <div className="hardware-card" key={name}>
        <h3>{name}</h3>
        <p>Capacity: {global.capacity}</p>
        <p>Available: {global.available}</p>
        <p>This project: {projectQty(name)} checked out</p>

        <div className="hardware-actions">
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setAmounts((a) => ({ ...a, [name]: e.target.value }))}
            className="qty-input"
          />
          <Button
            variant="primary"
            onClick={() => onCheckout(name, parseInt(qty || '0', 10))}
          >
            Check out
          </Button>
          <Button onClick={() => onCheckin(name, parseInt(qty || '0', 10))}>
            Check in
          </Button>
        </div>
      </div>
    );
  };

  return (
    <dialog ref={dialogRef} onCancel={onClose}>
      <h2>Project details</h2>

      <div className="project-meta">
        <div><strong>Project Name:</strong> {project?.name}</div>
        <div><strong>Project ID:</strong> {project?.projectId}</div>
        <div><strong>Description: </strong>{project?.description}</div>
      </div>

      <div className="hardware-row">
        {['HWSet1', 'HWSet2'].map(renderCard)}
      </div>

      <div className="dialog-actions">
        <Button onClick={onClose}>Close</Button>
      </div>
    </dialog>
  );
}

export default ProjectViewModal;
