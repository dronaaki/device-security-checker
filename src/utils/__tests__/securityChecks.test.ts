import { checkDeviceRooted, checkVPNDetection } from '../securityChecks';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// Mock dependencies
jest.mock('expo-device');
jest.mock('expo-network');
jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn(),
}));
jest.mock('react-native/Libraries/Utilities/Platform', () => {
  const Platform = jest.requireActual('react-native/Libraries/Utilities/Platform');
  return {
    ...Platform,
    OS: 'ios',
    select: Platform.select || (() => {}),
  };
});

describe('Security Checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDeviceRooted', () => {
    it('should return warning when running on emulator', async () => {
      // @ts-ignore
      Device.isDevice = false;
      const result = await checkDeviceRooted();
      expect(result.status).toBe('warning');
      expect(result.message).toContain('emulator');
    });

    it('should detect jailbreak if known paths exist on iOS', async () => {
      // @ts-ignore
      Device.isDevice = true;
      Platform.OS = 'ios';
      // Mock FileSystem to return true for the first path
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
      
      const result = await checkDeviceRooted();
      expect(result.status).toBe('critical');
      expect(result.message).toContain('Jailbreak detected');
    });

    it('should return secure if no root indicators exist', async () => {
      // @ts-ignore
      Device.isDevice = true;
      Platform.OS = 'android';
      // Mock FileSystem to return false for all paths
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
      
      const result = await checkDeviceRooted();
      expect(result.status).toBe('secure');
    });
  });

  describe('checkVPNDetection', () => {
    it('should return warning if network type is VPN', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({
        type: Network.NetworkStateType.VPN,
      });

      const result = await checkVPNDetection();
      expect(result.status).toBe('warning');
      expect(result.message).toContain('VPN connection detected');
    });

    it('should return secure if network type is WIFI', async () => {
      (Network.getNetworkStateAsync as jest.Mock).mockResolvedValue({
        type: Network.NetworkStateType.WIFI,
      });

      const result = await checkVPNDetection();
      expect(result.status).toBe('secure');
      expect(result.message).toContain('standard interface');
    });
  });
});
