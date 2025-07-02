interface GitHubCommit {
  sha: string
  message: string
  author: {
    name: string
    email: string
    date: string
  }
  url: string
  stats?: {
    additions: number
    deletions: number
    total: number
  }
}

interface GitHubServiceConfig {
  owner: string
  repo: string
  token?: string // Optional GitHub personal access token for higher rate limits
}

export class GitHubService {
  private config: GitHubServiceConfig
  private lastCheckedCommit: string | null = null
  
  constructor(config: GitHubServiceConfig) {
    this.config = config
    this.lastCheckedCommit = localStorage.getItem('github-last-commit-sha')
  }

  /**
   * Get recent commits from GitHub repository
   */
  async getRecentCommits(since?: string, limit: number = 10): Promise<GitHubCommit[]> {
    try {
      const { owner, repo, token } = this.config
      const baseUrl = `https://api.github.com/repos/${owner}/${repo}/commits`
      
      const params = new URLSearchParams()
      if (since) params.append('since', since)
      if (limit) params.append('per_page', limit.toString())
      
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'KENAL-Admin-Dashboard'
      }
      
      if (token) {
        headers['Authorization'] = `token ${token}`
      }

      const response = await fetch(`${baseUrl}?${params}`, { headers })
      
      if (!response.ok) {
        if (response.status === 403) {
          console.warn('GitHub API rate limit exceeded')
          return []
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      const commits = await response.json()
      
      return commits.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date
        },
        url: commit.html_url,
        stats: commit.stats
      }))
    } catch (error) {
      console.error('Error fetching GitHub commits:', error)
      return []
    }
  }

  /**
   * Check for new commits since last check
   */
  async checkForNewCommits(): Promise<GitHubCommit[]> {
    try {
      const commits = await this.getRecentCommits(undefined, 5)
      
      if (commits.length === 0) {
        return []
      }

      // If this is the first check, just store the latest commit and return empty
      if (!this.lastCheckedCommit) {
        this.lastCheckedCommit = commits[0].sha
        localStorage.setItem('github-last-commit-sha', commits[0].sha)
        return []
      }

      // Find new commits since last check
      const newCommits = []
      for (const commit of commits) {
        if (commit.sha === this.lastCheckedCommit) {
          break
        }
        newCommits.push(commit)
      }

      // Update last checked commit
      if (newCommits.length > 0) {
        this.lastCheckedCommit = commits[0].sha
        localStorage.setItem('github-last-commit-sha', commits[0].sha)
      }

      return newCommits
    } catch (error) {
      console.error('Error checking for new commits:', error)
      return []
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo() {
    try {
      const { owner, repo, token } = this.config
      const url = `https://api.github.com/repos/${owner}/${repo}`
      
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'KENAL-Admin-Dashboard'
      }
      
      if (token) {
        headers['Authorization'] = `token ${token}`
      }

      const response = await fetch(url, { headers })
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching repository info:', error)
      return null
    }
  }

  /**
   * Format commit message for notification
   */
  formatCommitForNotification(commit: GitHubCommit): string {
    const shortSha = commit.sha.substring(0, 7)
    const shortMessage = commit.message.length > 50 
      ? commit.message.substring(0, 50) + '...' 
      : commit.message
    
    return `${shortSha}: ${shortMessage} - ${commit.author.name}`
  }

  /**
   * Start monitoring for new commits
   */
  startMonitoring(onNewCommits: (commits: GitHubCommit[]) => void, intervalMs: number = 5 * 60 * 1000) {
    // Initial check
    this.checkForNewCommits().then(onNewCommits)
    
    // Set up periodic checking
    return setInterval(async () => {
      const newCommits = await this.checkForNewCommits()
      if (newCommits.length > 0) {
        onNewCommits(newCommits)
      }
    }, intervalMs)
  }
}

// Default configuration for KENAL project
export const createKenalGitHubService = () => {
  return new GitHubService({
    owner: 'your-github-username', // Replace with actual GitHub username
    repo: 'kenal-admin', // Replace with actual repository name
    // token: 'your-github-token' // Optional: Add for higher rate limits
  })
}

// Utility function to detect if we should enable GitHub monitoring
export const shouldEnableGitHubMonitoring = (): boolean => {
  // Enable in development or if explicitly configured
  return process.env.NODE_ENV === 'development' || 
         !!process.env.NEXT_PUBLIC_GITHUB_MONITORING ||
         typeof window !== 'undefined' && window.location.hostname === 'localhost'
} 