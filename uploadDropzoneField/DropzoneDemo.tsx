"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  FormHelperText,
  Grid,
  Button,
} from "@mui/material";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import DropzoneFileField from "@/components/DropzoneFileField";
import { IFileStatus } from "@/types/interface";

export default function DropzoneDemo() {
  const [files, setFiles] = useState<IFileStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Simulated validation (similar to RHF trigger) */
  useEffect(() => {
    if (!files.length) {
      setUploading(false);
      return;
    }

    setUploading(true);
    setError(null);

    const timeout = setTimeout(() => {
      if (files.length === 0) {
        setError("Please upload at least one valid file.");
      }
      setUploading(false);
    }, 600);

    return () => clearTimeout(timeout);
  }, [files]);

  /** Remove selected file */
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /** Simulated upload handler */
  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();

    if (!files.length) {
      setError("Please upload a file before submitting.");
      return;
    }

    alert(`Pretending to upload ${files.length} file(s)...`);
  };

  return (
    <Grid
      container
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      spacing={2}
    >
      <Grid size={12}>
        <Typography variant="h5" fontWeight={700}>
          File Upload Demo – DropzoneFileField
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Try dragging files, selecting files, or switching upload modes.
        </Typography>
      </Grid>

      {/* Upload Area */}
      <Grid size={{ xs: 12, md: 6 }}>
        <DropzoneFileField
          setFiles={setFiles}
          filesArray={files}
          mode="pdf_image" // try "csv", "xlsx", "pdf", "pdf_image"
          multiple={false}
        />

        {error && (
          <FormHelperText error sx={{ marginBlockStart: 1, fontSize: 13 }}>
            {error}
          </FormHelperText>
        )}
      </Grid>

      {/* Preview + Progress */}
      <Grid size={12}>
        {files.length === 0 && !uploading && (
          <Typography variant="body2" color="text.secondary">
            Selected file preview will appear here.
          </Typography>
        )}

        {files.map((fileStatus, index) => (
          <Box
            key={index}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            marginBlockEnd={2}
          >
            <Box flex={1}>
              <Typography variant="body2" fontWeight={600}>
                {fileStatus.file.name}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={fileStatus.progress}
                sx={{ marginBlockStart: 1 }}
              />
            </Box>

            <IconButton
              onClick={() => handleRemoveFile(index)}
              aria-label="remove file"
              sx={{ marginInlineStart: 2 }}
            >
              <CancelOutlinedIcon />
            </IconButton>
          </Box>
        ))}
      </Grid>

      {/* Submit button */}
      <Grid component={"form"} onSubmit={handleUpload} size={12}>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{
            bgcolor: "secondary.dark",
            color: "white",
            fontWeight: 600,
            paddingBlock: 1.2,
          }}
          disabled={uploading}
        >
          Upload
        </Button>
      </Grid>
    </Grid>
  );
}
