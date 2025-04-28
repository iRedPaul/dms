import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Divider,
  useTheme
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

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
  type = 'confirm', // 'confirm', 'info', 'warning', 'error', 'success'
  confirmColor = 'primary', // 'primary', 'error', etc.
  maxWidth = 'sm',
  showCloseIcon = false,
  children
}) {
  const theme = useTheme();
  
  // Get icon and color based on dialog type
  const getIconAndColor = () => {
    switch (type) {
      case 'info':
        return { icon: <InfoIcon sx={{ fontSize: 36 }} />, color: theme.palette.info.main };
      case 'warning':
        return { icon: <WarningIcon sx={{ fontSize: 36 }} />, color: theme.palette.warning.main };
      case 'error':
        return { icon: <ErrorIcon sx={{ fontSize: 36 }} />, color: theme.palette.error.main };
      case 'success':
        return { icon: <CheckCircleIcon sx={{ fontSize: 36 }} />, color: theme.palette.success.main };
      default:
        return { icon: <InfoIcon sx={{ fontSize: 36 }} />, color: theme.palette.primary.main };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle id="dialog-title" sx={{ pb: 2 }}>
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between"
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: `${color}10`,
                color: color
              }}
            >
              {icon}
            </Box>
            <Typography 
              variant="h6" 
              component="span" 
              fontWeight={500}
              sx={{ 
                color: 'text.primary',
                fontFamily: '"Roboto", "Segoe UI", "Helvetica Neue", sans-serif'
              }}
            >
              {title}
            </Typography>
          </Box>
          
          {showCloseIcon && (
            <IconButton 
              aria-label="close" 
              onClick={onClose}
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ pt: 3 }}>
        {message && (
          <DialogContentText 
            id="dialog-description"
            sx={{ 
              color: 'text.primary',
              mb: children ? 2 : 0,
              fontFamily: '"Roboto", "Segoe UI", "Helvetica Neue", sans-serif'
            }}
          >
            {message}
          </DialogContentText>
        )}
        
        {children}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2.5 }}>
        {type === 'confirm' && (
          <Button 
            onClick={onClose} 
            color="inherit"
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              fontFamily: '"Roboto", "Segoe UI", "Helvetica Neue", sans-serif'
            }}
          >
            {cancelText}
          </Button>
        )}
        <Button 
          onClick={onConfirm || onClose} 
          color={confirmColor}
          variant={type === 'confirm' ? 'contained' : 'text'}
          autoFocus={type !== 'confirm'}
          sx={{ 
            borderRadius: 2,
            fontFamily: '"Roboto", "Segoe UI", "Helvetica Neue", sans-serif'
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DialogComponent;
