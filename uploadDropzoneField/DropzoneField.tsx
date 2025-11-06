import React from 'react';
import { Box, Typography, styled, Button } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { AppActionType } from '@/types/appContext';
import useSnakberContext from '@/context/AppProvider/useSnakberContext';
import { IFileStatus } from '@/types/interface';
import {
  buildAcceptAttribute,
  computeFileFingerprint,
  HUMAN_LABEL_BY_MODE,
  isFileAllowedForMode,
  UploadMode,
} from '@/utils/uploadSpec';

interface DropZoneProps {
  isDragging: boolean;
}

const DropZone = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragging',
})<DropZoneProps>(({ theme, isDragging }) => ({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
  textAlign: 'center',
  padding: theme.spacing(3),
  border: `2px dashed ${theme.palette.primary.dark}`,
  backgroundColor: isDragging ? theme.palette.common.white : 'transparent',
}));

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

function DropzoneFileField({
  setFiles,
  filesArray,
  mode = 'csv',
  multiple = true,
}: {
  filesArray: IFileStatus[];
  setFiles: React.Dispatch<React.SetStateAction<IFileStatus[]>>;
  mode?: UploadMode;
  multiple?: boolean;
}) {
  const { dispatch } = useSnakberContext();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [inputKey, setInputKey] = React.useState(0);

  const timersRef = React.useRef<Set<number>>(new Set());

  const acceptAttr = React.useMemo(() => buildAcceptAttribute(mode), [mode]);

  const simulateProgress = React.useCallback(
    (target: File) => {
      if (typeof window === 'undefined') return; // SSR safety
      let progress = 0;
      const baseMsPerTick = Math.min(120, Math.max(30, target.size / 25000)); // heuristic

      const step = () => {
        progress = Math.min(100, progress + 100 / Math.max(12, Math.log2(target.size + 64)));
        setFiles((prev) => prev.map((f) => (f.file === target ? { ...f, progress } : f)));
        if (progress < 100) {
          const id = window.setTimeout(step, baseMsPerTick);
          timersRef.current.add(id);
        }
      };

      const id = window.setTimeout(step, baseMsPerTick);
      timersRef.current.add(id);
    },
    [setFiles]
  );

  /** Clear any pending timers when component unmounts. */
  React.useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current.clear();
    };
  }, []);

  const handleFiles = (fileList: FileList) => {
    const all = Array.from(fileList);
    const validFiles = all.filter((file) => isFileAllowedForMode(file, mode));

    if (validFiles.length === 0) {
      dispatch({
        type: AppActionType.ADD_ALERT,
        payload: {
          message: `Invalid file type. Allowed: ${HUMAN_LABEL_BY_MODE[mode]}.`,
          type: 'error',
        },
      });
      return;
    }

    const newFiles = validFiles.map((file) => ({ file, progress: 0 }));

    if (!multiple) {
      setFiles(() => newFiles.slice(0, 1));
      simulateProgress(newFiles[0].file);
      setInputKey((k) => k + 1);
      return;
    }

    const existingKeys = new Set(filesArray.map((x) => computeFileFingerprint(x.file)));

    const filesWithNoDuplicates = newFiles.filter(
      (newFile) => !existingKeys.has(computeFileFingerprint(newFile.file))
    );

    if (newFiles.length > filesWithNoDuplicates.length) {
      dispatch({
        type: AppActionType.ADD_ALERT,
        payload: {
          message: 'Duplicate files detected. Please upload unique files.',
          type: 'warning',
        },
      });
    }

    setFiles((prev) => {
      const updatedFiles = [...prev, ...filesWithNoDuplicates];
      filesWithNoDuplicates.forEach((files) => simulateProgress(files.file));
      return updatedFiles;
    });
    setInputKey((k) => k + 1);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const { files } = event.dataTransfer;
    handleFiles(files);
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  return (
    <DropZone
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      isDragging={isDragging}
      paddingBlock={10}
    >
      <Box
        sx={{
          pointerEvents: isDragging ? 'none' : 'auto',
          paddingBlock: 0,
        }}
      >
        <CloudUploadIcon
          color={isDragging ? 'inherit' : 'primary'}
          sx={{ height: 50, width: 50 }}
        />
        <Typography variant="h6" gutterBottom>
          {isDragging
            ? 'Drop files here'
            : `Drag & Drop or Choose ${HUMAN_LABEL_BY_MODE[mode]} to upload`}
        </Typography>
        <Button
          component="label"
          variant="contained"
          startIcon={<CloudUploadIcon />}
          sx={{ marginBlock: { xs: 1, lg: 2 } }}
        >
          Select Files
          <VisuallyHiddenInput
            key={inputKey}
            ref={fileInputRef}
            type="file"
            accept={acceptAttr}
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
            }}
            multiple={multiple}
          />
        </Button>
      </Box>
    </DropZone>
  );
}

export default DropzoneFileField;
