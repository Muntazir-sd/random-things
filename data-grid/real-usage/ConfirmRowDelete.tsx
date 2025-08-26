import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useModal } from '@/context/ModalContext';
import React from 'react';

export default function ConfirmRowDelete({
  onConfirm,
  subtitle,
}: {
  onConfirm: () => Promise<void> | void;
  subtitle?: React.ReactNode;
}) {
  const { handleClose } = useModal();
  const [busy, setBusy] = React.useState(false);

  const handleDelete = async () => {
    try {
      setBusy(true);
      await onConfirm();
    } finally {
      setBusy(false);
      handleClose();
    }
  };

  return (
    <>
      <DialogTitle fontWeight={'regular'} fontSize={14} component={'div'}>
        Are you sure you want to delete this row?
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">This action cannot be undone.</Typography>
        {subtitle}
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={busy}
        >
          {busy ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </>
  );
}
