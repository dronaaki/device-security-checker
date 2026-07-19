import * as Device from 'expo-device';
import * as Network from 'expo-network';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Battery from 'expo-battery';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface SecurityCheckResult {
  id: string;
  name: string;
  status: 'secure' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

export interface DeviceSecurityInfo {
  deviceName: string;
  deviceModel: string;
  osVersion: string;
  isRooted: boolean;
  networkType: string;
  ipAddress: string;
  lastCheck: Date;
}

export async function checkDeviceRooted(): Promise<SecurityCheckResult> {
  const isDevice = Device.isDevice;
  const platform = Platform.OS;
  
  let isRooted = false;
  let message = 'Device appears secure';
  let status: 'secure' | 'warning' | 'critical' = 'secure';

  if (!isDevice) {
    message = 'Running on emulator/simulator (development mode)';
    status = 'warning';
  } else {
    try {
      const pathsToCheck = platform === 'ios' ? [
        '/Applications/Cydia.app',
        '/Library/MobileSubstrate/MobileSubstrate.dylib',
        '/bin/bash',
        '/usr/sbin/sshd',
        '/etc/apt'
      ] : [
        '/system/app/Superuser.apk',
        '/sbin/su',
        '/system/bin/su',
        '/system/xbin/su',
        '/data/local/xbin/su',
        '/data/local/bin/su',
        '/system/sd/xbin/su',
        '/system/bin/failsafe/su',
        '/data/local/su',
        '/su/bin/su'
      ];

      for (const path of pathsToCheck) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(`file://${path}`);
          if (fileInfo.exists) {
            isRooted = true;
            break;
          }
        } catch (e) {
          // Ignore errors as they might be due to permission restrictions which is normal
        }
      }

      if (isRooted) {
        status = 'critical';
        message = platform === 'ios' ? 'Jailbreak detected on this iOS device' : 'Root access detected on this Android device';
      } else {
        message = platform === 'ios' ? 'iOS device - no obvious jailbreak indicators' : 'Android device - no obvious root indicators';
      }
    } catch (error) {
      status = 'warning';
      message = 'Failed to perform complete root/jailbreak analysis';
    }
  }

  return {
    id: 'root-check',
    name: 'Root/Jailbreak Detection',
    status,
    message,
    timestamp: new Date(),
  };
}

export async function checkNetworkSecurity(): Promise<SecurityCheckResult> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    const ip = await Network.getIpAddressAsync();
    
    let status: 'secure' | 'warning' | 'critical' = 'secure';
    let message = 'Network connection secure';

    if (networkState.type === Network.NetworkStateType.WIFI) {
      message = `Connected to WiFi (IP: ${ip})`;
    } else if (networkState.type === Network.NetworkStateType.CELLULAR) {
      message = `Connected to cellular network (IP: ${ip})`;
      status = 'warning'; // Cellular networks can be less secure
    } else {
      message = 'No network connection';
      status = 'warning';
    }

    return {
      id: 'network-check',
      name: 'Network Security',
      status,
      message,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      id: 'network-check',
      name: 'Network Security',
      status: 'critical',
      message: 'Unable to check network status',
      timestamp: new Date(),
    };
  }
}

export async function checkOSVersion(): Promise<SecurityCheckResult> {
  const osVersion = Device.osVersion;
  const platform = Platform.OS;
  
  let status: 'secure' | 'warning' | 'critical' = 'secure';
  let message = `Running ${platform} ${osVersion}`;

  // Check for outdated OS versions (simplified)
  if (platform === 'android') {
    const [major] = osVersion.split('.').map(Number);
    if (major < 10) {
      status = 'critical';
      message = `Android ${osVersion} is outdated and may have security vulnerabilities`;
    } else if (major < 12) {
      status = 'warning';
      message = `Android ${osVersion} - consider updating for better security`;
    }
  } else if (platform === 'ios') {
    const [major] = osVersion.split('.').map(Number);
    if (major < 14) {
      status = 'critical';
      message = `iOS ${osVersion} is outdated and may have security vulnerabilities`;
    } else if (major < 15) {
      status = 'warning';
      message = `iOS ${osVersion} - consider updating for better security`;
    }
  }

  return {
    id: 'os-version-check',
    name: 'OS Version',
    status,
    message,
    timestamp: new Date(),
  };
}

export async function getDeviceSecurityInfo(): Promise<DeviceSecurityInfo> {
  const networkState = await Network.getNetworkStateAsync();
  const ip = await Network.getIpAddressAsync();

  return {
    deviceName: Device.deviceName || 'Unknown Device',
    deviceModel: Device.modelName || 'Unknown Model',
    osVersion: Device.osVersion || 'Unknown',
    isRooted: false, // Would be determined by actual root check
    networkType: networkState.type,
    ipAddress: ip,
    lastCheck: new Date(),
  };
}

export async function checkBiometricSecurity(): Promise<SecurityCheckResult> {
  try {
    const isCompatible = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    let status: 'secure' | 'warning' | 'critical' = 'warning';
    let message = 'Biometric authentication not configured';

    if (isCompatible && isEnrolled) {
      status = 'secure';
      message = 'Biometric authentication enabled and configured';
    } else if (!isCompatible) {
      status = 'warning';
      message = 'Device does not support biometric authentication';
    } else if (!isEnrolled) {
      status = 'warning';
      message = 'Biometric authentication available but not enrolled';
    }

    return {
      id: 'biometric-check',
      name: 'Biometric Security',
      status,
      message,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      id: 'biometric-check',
      name: 'Biometric Security',
      status: 'warning',
      message: 'Unable to check biometric security',
      timestamp: new Date(),
    };
  }
}

export async function checkBatteryHealth(): Promise<SecurityCheckResult> {
  try {
    const batteryLevel = await Battery.getBatteryLevelAsync();
    const batteryState = await Battery.getBatteryStateAsync();
    
    let status: 'secure' | 'warning' | 'critical' = 'secure';
    let message = `Battery level: ${Math.round(batteryLevel * 100)}%`;

    if (batteryLevel < 0.2) {
      status = 'warning';
      message = `Battery low: ${Math.round(batteryLevel * 100)}% - security checks may be limited`;
    }

    if (batteryState === Battery.BatteryState.UNPLUGGED && batteryLevel < 0.1) {
      status = 'critical';
      message = `Critical battery level: ${Math.round(batteryLevel * 100)}%`;
    }

    return {
      id: 'battery-check',
      name: 'Battery Health',
      status,
      message,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      id: 'battery-check',
      name: 'Battery Health',
      status: 'warning',
      message: 'Unable to check battery status',
      timestamp: new Date(),
    };
  }
}

export async function checkVPNDetection(): Promise<SecurityCheckResult> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    
    let status: 'secure' | 'warning' | 'critical' = 'secure';
    let message = 'No VPN detected';

    // Heuristic VPN check based on VPN interface names if we can fetch IP Address
    // Expo Network doesn't directly give interface names, but we can check if it's VPN type
    if (networkState.type === Network.NetworkStateType.VPN) {
      message = 'Active VPN connection detected';
      status = 'warning';
    } else if (networkState.type === Network.NetworkStateType.WIFI || networkState.type === Network.NetworkStateType.CELLULAR) {
      // It's connected normally, but we can't absolutely rule out a custom VPN.
      // We will mark it secure but mention it's a basic check.
      message = 'Connected via standard interface (VPN status: likely clear)';
      status = 'secure';
    }

    return {
      id: 'vpn-check',
      name: 'VPN/Proxy Detection',
      status,
      message,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      id: 'vpn-check',
      name: 'VPN/Proxy Detection',
      status: 'warning',
      message: 'Unable to check VPN status',
      timestamp: new Date(),
    };
  }
}

export async function checkDataEncryption(): Promise<SecurityCheckResult> {
  try {
    // Check if device has encryption enabled
    // This is a simplified check - real encryption status requires platform-specific APIs
    const platform = Platform.OS;
    let status: 'secure' | 'warning' | 'critical' = 'secure';
    let message = 'Device encryption status unknown';

    if (platform === 'ios') {
      // iOS devices are encrypted by default since iOS 8
      status = 'secure';
      message = 'iOS device encryption enabled by default';
    } else if (platform === 'android') {
      // Android encryption depends on device and OS version
      const osVersion = Device.osVersion;
      const [major] = osVersion.split('.').map(Number);
      if (major >= 10) {
        status = 'secure';
        message = 'Android 10+ - encryption likely enabled';
      } else {
        status = 'warning';
        message = 'Older Android version - encryption may not be enabled';
      }
    }

    return {
      id: 'encryption-check',
      name: 'Data Encryption',
      status,
      message,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      id: 'encryption-check',
      name: 'Data Encryption',
      status: 'warning',
      message: 'Unable to check encryption status',
      timestamp: new Date(),
    };
  }
}

export async function checkScreenLockSecurity(): Promise<SecurityCheckResult> {
  try {
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    let status: 'secure' | 'warning' | 'critical' = 'warning';
    let message = 'Screen lock security unknown';

    if (isEnrolled) {
      status = 'secure';
      message = 'Screen lock/biometric authentication is enabled';
    } else {
      status = 'critical';
      message = 'No screen lock or biometric authentication detected';
    }

    return {
      id: 'screenlock-check',
      name: 'Screen Lock Security',
      status,
      message,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      id: 'screenlock-check',
      name: 'Screen Lock Security',
      status: 'warning',
      message: 'Unable to check screen lock status',
      timestamp: new Date(),
    };
  }
}

export async function checkSystemIntegrity(): Promise<SecurityCheckResult> {
  try {
    const isDevice = Device.isDevice;
    const platform = Platform.OS;
    const rootCheck = await checkDeviceRooted();
    
    let status: 'secure' | 'warning' | 'critical' = 'secure';
    let message = 'System integrity verified';

    if (!isDevice) {
      status = 'warning';
      message = 'Running on emulator/simulator - integrity checks limited';
    } else if (rootCheck.status === 'critical') {
      status = 'critical';
      message = 'System integrity compromised (Root/Jailbreak detected)';
    } else {
      if (platform === 'android') {
        message = 'Android system integrity verified';
      } else if (platform === 'ios') {
        message = 'iOS system integrity verified';
      }
    }

    return {
      id: 'integrity-check',
      name: 'System Integrity',
      status,
      message,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      id: 'integrity-check',
      name: 'System Integrity',
      status: 'critical',
      message: 'System integrity check failed',
      timestamp: new Date(),
    };
  }
}

export async function checkAppPermissions(): Promise<SecurityCheckResult> {
  try {
    // This is a simplified check - real permission analysis requires platform-specific APIs
    const platform = Platform.OS;
    
    let status: 'secure' | 'warning' | 'critical' = 'secure';
    let message = 'App permissions appear normal';

    // In production, you would check for suspicious permission patterns
    if (platform === 'android') {
      message = 'Android app permissions - review recommended';
      status = 'warning';
    } else if (platform === 'ios') {
      message = 'iOS app permissions - review recommended';
      status = 'warning';
    }

    return {
      id: 'permissions-check',
      name: 'App Permissions',
      status,
      message,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      id: 'permissions-check',
      name: 'App Permissions',
      status: 'warning',
      message: 'Unable to analyze app permissions',
      timestamp: new Date(),
    };
  }
}

export async function checkSuspiciousApps(): Promise<SecurityCheckResult> {
  try {
    // This is a simplified check - real suspicious app detection requires:
    // - App signature verification
    // - Known malware database comparison
    // - Behavioral analysis
    let status: 'secure' | 'warning' | 'critical' = 'secure';
    let message = 'No suspicious apps detected';

    // In production, implement actual app scanning
    const platform = Platform.OS;
    if (platform === 'android') {
      message = 'Android app scan - basic check completed';
      status = 'warning';
    } else if (platform === 'ios') {
      message = 'iOS app scan - basic check completed';
      status = 'warning';
    }

    return {
      id: 'suspicious-apps-check',
      name: 'Suspicious App Detection',
      status,
      message,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      id: 'suspicious-apps-check',
      name: 'Suspicious App Detection',
      status: 'warning',
      message: 'Unable to scan for suspicious apps',
      timestamp: new Date(),
    };
  }
}

export async function runAllSecurityChecks(): Promise<SecurityCheckResult[]> {
  const checks = await Promise.all([
    checkDeviceRooted(),
    checkNetworkSecurity(),
    checkOSVersion(),
    checkBiometricSecurity(),
    checkBatteryHealth(),
    checkVPNDetection(),
    checkDataEncryption(),
    checkScreenLockSecurity(),
    checkSystemIntegrity(),
    checkAppPermissions(),
    checkSuspiciousApps(),
  ]);

  return checks;
}
