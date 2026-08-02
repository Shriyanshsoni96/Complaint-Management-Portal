import Modal from './Modal.jsx';
import Button from './Button.jsx';

function ConfirmDialog({ open, title = 'Are you sure?', message, onConfirm, onCancel, confirming }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={confirming}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={confirming}>
          {confirming ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
