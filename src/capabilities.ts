export interface Capabilities {
  backendName: string
  canInjectKeyboard: boolean
  canInjectMouse: boolean
  canTypeUnicode: boolean
  canWarpCursor: boolean
  canReadCursorPosition: boolean
  supportsExtraMouseButtons: boolean
  supportsHighResolutionScroll: boolean
  canCaptureScreen: boolean
  canEnumerateMonitors: boolean
  canRecordEvents: boolean
  requiresAccessibilityPermission: boolean
  requiresScreenRecordingPermission: boolean
}
