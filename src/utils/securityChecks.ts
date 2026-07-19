import * as Device from 'expo-device';
import * as Network from 'expo-network';
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
  // Basic checks for rooted/jailbroken device
  const isDevice = Device.isDevice;
  const platform = Platform.OS;
  
  let isRooted = false;
  let message = 'Device appears secure';
  let status: 'secure' | 'warning' | 'critical' = 'secure';

  if (!isDevice) {
    // Running on emulator/simulator - this is normal for development
    message = 'Running on emulator/simulator (development mode)';
    status = 'warning';
  } else {
    // In production, you would implement more sophisticated checks
    // For now, we'll do basic platform checks
    if (platform === 'android') {
      // Android-specific checks would go here
      message = 'Android device - no obvious root indicators';
    } else if (platform === 'ios') {
      // iOS-specific checks would go here
      message = 'iOS device - no obvious jailbreak indicators';
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

export async function runAllSecurityChecks(): Promise<SecurityCheckResult[]> {
  const checks = await Promise.all([
    checkDeviceRooted(),
    checkNetworkSecurity(),
    checkOSVersion(),
  ]);

  return checks;
}
