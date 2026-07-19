import { SecurityCheckResult } from './securityChecks';

export interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export function getRecommendations(checks: SecurityCheckResult[]): SecurityRecommendation[] {
  const recommendations: SecurityRecommendation[] = [];

  checks.forEach(check => {
    if (check.status === 'critical' || check.status === 'warning') {
      switch (check.id) {
        case 'root-check':
          if (check.status === 'critical') {
            recommendations.push({
              id: 'rec-root',
              title: 'Device Root/Jailbreak Detected',
              description: 'Your device appears to be rooted or jailbroken. This can significantly reduce security. Consider restoring your device to factory settings.',
              priority: 'high',
              category: 'Device Security',
            });
          }
          break;

        case 'os-version-check':
          if (check.status === 'critical') {
            recommendations.push({
              id: 'rec-os',
              title: 'Update Operating System',
              description: 'Your OS version is outdated and may contain security vulnerabilities. Update to the latest version as soon as possible.',
              priority: 'high',
              category: 'System Updates',
            });
          } else if (check.status === 'warning') {
            recommendations.push({
              id: 'rec-os-warning',
              title: 'Consider OS Update',
              description: 'A newer OS version is available. Updating will provide better security features and bug fixes.',
              priority: 'medium',
              category: 'System Updates',
            });
          }
          break;

        case 'network-check':
          if (check.status === 'warning') {
            recommendations.push({
              id: 'rec-network',
              title: 'Review Network Connection',
              description: 'You are connected to a cellular network. Be cautious when accessing sensitive information on public networks.',
              priority: 'medium',
              category: 'Network Security',
            });
          }
          break;

        case 'biometric-check':
          if (check.status === 'warning') {
            recommendations.push({
              id: 'rec-biometric',
              title: 'Enable Biometric Authentication',
              description: 'Biometric authentication adds an extra layer of security. Enable fingerprint or face recognition in your device settings.',
              priority: 'medium',
              category: 'Authentication',
            });
          }
          break;

        case 'screenlock-check':
          if (check.status === 'critical') {
            recommendations.push({
              id: 'rec-screenlock',
              title: 'Set Up Screen Lock',
              description: 'No screen lock is detected. Set up a strong PIN, pattern, or password to protect your device.',
              priority: 'high',
              category: 'Authentication',
            });
          }
          break;

        case 'encryption-check':
          if (check.status === 'warning') {
            recommendations.push({
              id: 'rec-encryption',
              title: 'Enable Device Encryption',
              description: 'Device encryption may not be enabled. Check your device settings to ensure full disk encryption is active.',
              priority: 'high',
              category: 'Data Protection',
            });
          }
          break;

        case 'battery-check':
          if (check.status === 'warning' || check.status === 'critical') {
            recommendations.push({
              id: 'rec-battery',
              title: 'Charge Your Device',
              description: 'Low battery may affect security checks. Keep your device charged to ensure continuous protection.',
              priority: 'low',
              category: 'Device Health',
            });
          }
          break;

        case 'permissions-check':
          if (check.status === 'warning') {
            recommendations.push({
              id: 'rec-permissions',
              title: 'Review App Permissions',
              description: 'Review your installed apps and their permissions. Remove unnecessary permissions to improve security.',
              priority: 'medium',
              category: 'App Security',
            });
          }
          break;

        case 'suspicious-apps-check':
          if (check.status === 'warning') {
            recommendations.push({
              id: 'rec-suspicious',
              title: 'Scan for Suspicious Apps',
              description: 'Regularly scan your device for suspicious or unknown apps. Only install apps from trusted sources.',
              priority: 'medium',
              category: 'App Security',
            });
          }
          break;

        case 'integrity-check':
          if (check.status === 'critical') {
            recommendations.push({
              id: 'rec-integrity',
              title: 'System Integrity Issue',
              description: 'System integrity check failed. This may indicate a security issue. Consider running a full device scan.',
              priority: 'high',
              category: 'System Security',
            });
          }
          break;
      }
    }
  });

  // Add general security tips
  recommendations.push(
    {
      id: 'rec-general-1',
      title: 'Use Strong Passwords',
      description: 'Use unique, complex passwords for all accounts. Consider using a password manager.',
      priority: 'medium',
      category: 'General Security',
    },
    {
      id: 'rec-general-2',
      title: 'Enable Two-Factor Authentication',
      description: 'Enable 2FA wherever possible for an extra layer of security.',
      priority: 'high',
      category: 'General Security',
    },
    {
      id: 'rec-general-3',
      title: 'Keep Apps Updated',
      description: 'Regularly update your apps to ensure you have the latest security patches.',
      priority: 'medium',
      category: 'App Security',
    },
    {
      id: 'rec-general-4',
      title: 'Avoid Public Wi-Fi',
      description: 'Be cautious when using public Wi-Fi networks. Use a VPN if you must connect.',
      priority: 'medium',
      category: 'Network Security',
    },
    {
      id: 'rec-general-5',
      title: 'Regular Backups',
      description: 'Regularly backup your data to a secure location. This protects against data loss.',
      priority: 'medium',
      category: 'Data Protection',
    }
  );

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

export function getSecurityTips(): string[] {
  return [
    'Always lock your device when not in use',
    'Don\'t click on suspicious links or download unknown attachments',
    'Use official app stores only',
    'Review app permissions before installing',
    'Keep your device and apps updated',
    'Use a VPN when connecting to public Wi-Fi',
    'Be cautious with public USB charging stations',
    'Enable "Find My Device" feature',
    'Regularly check your installed apps list',
    'Don\'t share sensitive information on unsecured networks',
  ];
}
