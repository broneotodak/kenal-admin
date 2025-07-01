'use client'

import React, { useState, useEffect } from 'react'
import { 
  Chip, 
  Tooltip, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Typography, 
  Box, 
  Link,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert
} from '@mui/material'
import { 
  Info as InfoIcon,
  GitHub as GitHubIcon,
  Schedule as ScheduleIcon,
  Code as CodeIcon,
  Build as BuildIcon,
  BugReport as BugIcon,
  CloudDone as CloudIcon,
  Computer as ComputerIcon
} from '@mui/icons-material'

interface BuildInfo {
  version: string
  buildTime: string
  gitCommitHash: string
  gitCommitShort: string
  gitBranch: string
  gitCommitMessage: string
  gitCommitDate: string
  gitAuthor: string
  isDirty: boolean
  environment: string
  buildId: string
  repository: string
}

export default function VersionInfo() {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBuildInfo = async () => {
      try {
        const response = await fetch('/build-info.json')
        if (response.ok) {
          const info = await response.json()
          setBuildInfo(info)
        } else {
          // Fallback for development or if build-info.json doesn't exist
          setBuildInfo({
            version: '2.1.0-dev',
            buildTime: new Date().toISOString(),
            gitCommitHash: 'local-development',
            gitCommitShort: 'dev',
            gitBranch: 'main',
            gitCommitMessage: 'Local development version',
            gitCommitDate: new Date().toISOString(),
            gitAuthor: 'Developer',
            isDirty: true,
            environment: 'development',
            buildId: `${Date.now()}`,
            repository: 'BroLanTodak/adminkenal'
          })
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch build info:', error)
        setBuildInfo(null)
      } finally {
        setLoading(false)
      }
    }

    fetchBuildInfo()
  }, [])

  if (loading || !buildInfo) {
    return null
  }

  const isProduction = buildInfo.environment === 'production'
  const isLocal = buildInfo.environment === 'development'
  const commitUrl = `https://github.com/${buildInfo.repository}/commit/${buildInfo.gitCommitHash}`
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getEnvironmentColor = () => {
    if (isProduction) return 'success'
    if (isLocal) return 'warning'
    return 'info'
  }

  const getEnvironmentIcon = () => {
    if (isProduction) return <CloudIcon fontSize="small" />
    if (isLocal) return <ComputerIcon fontSize="small" />
    return <BuildIcon fontSize="small" />
  }

  return (
    <>
      <Tooltip title="Click to view version details" arrow>
        <Chip
          icon={getEnvironmentIcon()}
          label={`v${buildInfo.version} (${buildInfo.gitCommitShort})`}
          color={getEnvironmentColor()}
          variant="outlined"
          size="small"
          onClick={() => setDialogOpen(true)}
          sx={{ cursor: 'pointer' }}
        />
      </Tooltip>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon color="primary" />
          Version Control Information
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              🏷️ Current Deployment
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`Version ${buildInfo.version}`} 
                color="primary" 
                variant="filled"
              />
              <Chip 
                label={buildInfo.environment.toUpperCase()} 
                color={getEnvironmentColor()}
                variant="filled"
              />
              {buildInfo.isDirty && (
                <Chip 
                  icon={<BugIcon />}
                  label="Uncommitted Changes" 
                  color="warning"
                  variant="filled"
                />
              )}
            </Box>
          </Box>

          {buildInfo.isDirty && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This build contains uncommitted changes. The deployed version may differ from the Git repository.
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            📋 Build Details
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <GitHubIcon />
              </ListItemIcon>
              <ListItemText
                primary="Git Commit"
                secondary={
                  <Box>
                    <Link href={commitUrl} target="_blank" rel="noopener">
                      {buildInfo.gitCommitShort} - {buildInfo.gitCommitMessage}
                    </Link>
                    <Typography variant="caption" display="block">
                      by {buildInfo.gitAuthor} • {formatDate(buildInfo.gitCommitDate)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CodeIcon />
              </ListItemIcon>
              <ListItemText
                primary="Branch"
                secondary={buildInfo.gitBranch}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <ScheduleIcon />
              </ListItemIcon>
              <ListItemText
                primary="Build Time"
                secondary={formatDate(buildInfo.buildTime)}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <BuildIcon />
              </ListItemIcon>
              <ListItemText
                primary="Build ID"
                secondary={buildInfo.buildId}
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            🔗 Quick Links
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Link 
              href={`https://github.com/${buildInfo.repository}`}
              target="_blank" 
              rel="noopener"
            >
              <Chip 
                icon={<GitHubIcon />}
                label="Repository" 
                variant="outlined"
                clickable
              />
            </Link>
            
            <Link 
              href={commitUrl}
              target="_blank" 
              rel="noopener"
            >
              <Chip 
                icon={<CodeIcon />}
                label="View Commit" 
                variant="outlined"
                clickable
              />
            </Link>

            <Link 
              href={`https://github.com/${buildInfo.repository}/commits/${buildInfo.gitBranch}`}
              target="_blank" 
              rel="noopener"
            >
              <Chip 
                icon={<GitHubIcon />}
                label="Commit History" 
                variant="outlined"
                clickable
              />
            </Link>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            This information helps track exactly which version is deployed to ensure consistency between environments.
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  )
} 