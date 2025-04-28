import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

/**
 * Reusable dialog component for confirmations and alerts
 */
function DialogComponent({
  open,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  type = 'confirm', // 'confirm', 'info', 'warning', 'error'
  confirmColor = 'primary' // 'primary', 'error', etc.
}) {
  // Get icon based on dialog type
  const getIcon = () => {
    switch (type) {
      case 'info':
        return <InfoIcon sx={{ color: 'info.main', fontSize: 32 }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main', fontSize: 32 }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main', fontSize: 32 }} />;
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <DialogTitle id="dialog-title">
        <Box display="flex" alignItems="center" gap={1}>
          {getIcon()}
          <Typography variant="h6" component="span">
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {type === 'confirm' && (
          <Button onClick={onClose} color="inherit">
            {cancelText}
          </Button>
        )}
        <Button 
          onClick={onConfirm || onClose} 
          color={confirmColor}
          variant={type === 'confirm' ? 'contained' : 'text'}
          autoFocus={type !== 'confirm'}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DialogComponent;
