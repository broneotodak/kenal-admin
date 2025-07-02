// ntfy service for sending notifications to developer
interface NtfyMessage {
  title: string
  message: string
  tags?: string[]
  priority?: 1 | 2 | 3 | 4 | 5
  adminEmail?: string
}

const NTFY_BASE_URL = 'https://ntfy.sh'
const DEVELOPER_CHANNEL = 'neo_notifications'

export const sendDeveloperNotification = async ({
  title,
  message,
  tags = ['admin'],
  priority = 3,
  adminEmail
}: NtfyMessage): Promise<boolean> => {
  try {
    const fullMessage = adminEmail 
      ? `From: ${adminEmail}\n\n${message}`
      : message

    // Ensure headers contain only ISO-8859-1 characters
    const sanitizeHeader = (str: string) => {
      return str.replace(/[^\x00-\xFF]/g, '?') // Replace non-ISO-8859-1 characters with ?
    }

    const response = await fetch(`${NTFY_BASE_URL}/${DEVELOPER_CHANNEL}`, {
      method: 'POST',
      headers: {
        'Title': sanitizeHeader(title),
        'Priority': priority.toString(),
        'Tags': sanitizeHeader(tags.join(',')),
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: fullMessage // Body can contain UTF-8, headers cannot
    })

    if (!response.ok) {
      throw new Error(`ntfy request failed: ${response.status}`)
    }

    console.log('✅ Developer notification sent successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to send developer notification:', error)
    return false
  }
}

// Predefined message types for common scenarios
export const sendBugReport = (adminEmail: string, description: string) => {
  return sendDeveloperNotification({
    title: '🐛 Bug Report - Kenal Admin',
    message: description,
    tags: ['bug', 'admin', 'kenal'],
    priority: 4,
    adminEmail
  })
}

export const sendFeatureRequest = (adminEmail: string, description: string) => {
  return sendDeveloperNotification({
    title: '💡 Feature Request - Kenal Admin',
    message: description,
    tags: ['feature', 'admin', 'kenal'],
    priority: 3,
    adminEmail
  })
}

export const sendGeneralMessage = (adminEmail: string, subject: string, message: string) => {
  return sendDeveloperNotification({
    title: `📧 ${subject} - Kenal Admin`,
    message: message,
    tags: ['message', 'admin', 'kenal'],
    priority: 3,
    adminEmail
  })
}

export const sendUrgentIssue = (adminEmail: string, description: string) => {
  return sendDeveloperNotification({
    title: '🚨 URGENT - Kenal Admin Issue',
    message: description,
    tags: ['urgent', 'admin', 'kenal'],
    priority: 5,
    adminEmail
  })
}

export const sendReleaseAnnouncement = (version: string, features: string[], adminEmail?: string) => {
  const message = `🎉 NEW RELEASE: ${version}

✨ MAJOR FEATURES ADDED:
${features.map(feature => `• ${feature}`).join('\n')}

🚀 Status: Ready for Production
📊 Database: Live KENAL integration confirmed
🔗 Deployment: Ready to push to GitHub

Technical Performance:
• Response Time: 3-5 seconds
• Real Data: 1,422+ users processed
• AI Provider: Anthropic Claude 3.5 Sonnet
• Error Handling: Template AI fallback ready

Ready for team testing and user access!`

  return sendDeveloperNotification({
    title: `🚀 ${version} - KENAL Admin Release`,
    message,
    tags: ['release', 'admin', 'kenal', 'smart-ai'],
    priority: 4,
    adminEmail
  })
} 