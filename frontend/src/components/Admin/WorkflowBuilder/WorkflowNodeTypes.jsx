import React from 'react';
import { Handle } from 'react-flow-renderer';
import { Paper, Typography, Box } from '@mui/material';
import {
  UploadFile as UploadIcon,
  Assignment as FormIcon,
  ThumbUp as ApprovalIcon,
  Notifications as NotificationIcon,
  CallSplit as ConditionIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';

// Basisknoten mit gemeinsamer Styling
const BaseNode = ({ data, children, color }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        padding: 2,
        borderRadius: 2,
        width: 200,
        minHeight: 100,
        borderTop: `4px solid ${color}`,
        '&:hover': {
          boxShadow: 6
        }
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        {data.label}
      </Typography>
      {children}
    </Paper>
  );
};

// Upload-Knotentyp
const UploadNode = ({ data }) => {
  return (
    <BaseNode data={data} color="#2196f3">
      <Handle type="target" position="top" />
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <UploadIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="body2">Dokumenten-Upload</Typography>
      </Box>
      {data.step?.description && (
        <Typography variant="body2" color="text.secondary">
          {data.step.description}
        </Typography>
      )}
      <Handle type="source" position="bottom" />
    </BaseNode>
  );
};

// Formular-Knotentyp
const FormNode = ({ data }) => {
  return (
    <BaseNode data={data} color="#4caf50">
      <Handle type="target" position="top" />
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <FormIcon color="success" sx={{ mr: 1 }} />
        <Typography variant="body2">Formular</Typography>
      </Box>
      {data.step?.description && (
        <Typography variant="body2" color="text.secondary">
          {data.step.description}
        </Typography>
      )}
      {data.step?.formConfig?.fields && (
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          {data.step.formConfig.fields.length} Felder konfiguriert
        </Typography>
      )}
      <Handle type="source" position="bottom" />
    </BaseNode>
  );
};

// Genehmigungs-Knotentyp
const ApprovalNode = ({ data }) => {
  return (
    <BaseNode data={data} color="#ff9800">
      <Handle type="target" position="top" />
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <ApprovalIcon color="warning" sx={{ mr: 1 }} />
        <Typography variant="body2">Genehmigung</Typography>
      </Box>
      {data.step?.description && (
        <Typography variant="body2" color="text.secondary">
          {data.step.description}
        </Typography>
      )}
      {data.step?.assignedTo?.value && (
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Zugewiesen an: {data.step.assignedTo.value}
        </Typography>
      )}
      <Handle type="source" position="bottom" id="approved" />
      <Handle
        type="source"
        position="right"
        id="rejected"
        style={{ top: '70%', background: '#f44336' }}
      />
    </BaseNode>
  );
};

// Benachrichtigungs-Knotentyp
const NotificationNode = ({ data }) => {
  return (
    <BaseNode data={data} color="#9c27b0">
      <Handle type="target" position="top" />
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <NotificationIcon color="secondary" sx={{ mr: 1 }} />
        <Typography variant="body2">Benachrichtigung</Typography>
      </Box>
      {data.step?.description && (
        <Typography variant="body2" color="text.secondary">
          {data.step.description}
        </Typography>
      )}
      <Handle type="source" position="bottom" />
    </BaseNode>
  );
};

// Bedingungs-Knotentyp
const ConditionNode = ({ data }) => {
  return (
    <BaseNode data={data} color="#f44336">
      <Handle type="target" position="top" />
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <ConditionIcon color="error" sx={{ mr: 1 }} />
        <Typography variant="body2">Bedingung</Typography>
      </Box>
      {data.step?.description && (
        <Typography variant="body2" color="text.secondary">
          {data.step.description}
        </Typography>
      )}
      <Handle type="source" position="bottom" id="true" />
      <Handle
        type="source"
        position="right"
        id="false"
        style={{ background: '#f44336' }}
      />
    </BaseNode>
  );
};

// Archivierungs-Knotentyp
const ArchiveNode = ({ data }) => {
  return (
    <BaseNode data={data} color="#795548">
      <Handle type="target" position="top" />
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <ArchiveIcon sx={{ mr: 1, color: '#795548' }} />
        <Typography variant="body2">Archivierung</Typography>
      </Box>
      {data.step?.description && (
        <Typography variant="body2" color="text.secondary">
          {data.step.description}
        </Typography>
      )}
      <Handle type="source" position="bottom" />
    </BaseNode>
  );
};

// Exportieren aller Knotentypen als Objekt
export default {
  upload: UploadNode,
  form: FormNode,
  approval: ApprovalNode,
  notification: NotificationNode,
  condition: ConditionNode,
  archive: ArchiveNode
};