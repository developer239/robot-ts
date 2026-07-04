export enum ErrorCode {
  Unsupported = 'Unsupported',
  PermissionDenied = 'PermissionDenied',
  BackendUnavailable = 'BackendUnavailable',
  InvalidArgument = 'InvalidArgument',
  MonitorNotFound = 'MonitorNotFound',
  UnmappableInput = 'UnmappableInput',
  CaptureFailed = 'CaptureFailed',
  EncodeFailed = 'EncodeFailed',
  IoError = 'IoError',
  PlatformError = 'PlatformError',
}

const ERROR_CODES = new Set<string>(Object.values(ErrorCode))

export class RobotError extends Error {
  public constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'RobotError'
  }

  public static is(error: unknown): error is RobotError {
    return error instanceof RobotError
  }

  public static fromUnknown(error: unknown): RobotError {
    if (error instanceof RobotError) {
      return error
    }

    if (error instanceof Error) {
      const code = readErrorCode(error)

      return new RobotError(code, error.message)
    }

    return new RobotError(ErrorCode.PlatformError, String(error))
  }
}

const readErrorCode = (error: Error): ErrorCode => {
  const code = (error as Error & { code?: unknown }).code

  if (typeof code === 'string' && ERROR_CODES.has(code)) {
    return code as ErrorCode
  }

  return ErrorCode.PlatformError
}
