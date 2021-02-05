import { Error } from 'mongoose'

export function getDotSeperatedPropertyValue(
  search: Record<string, unknown>,
  path: string
): unknown {
  const pathParts = path.split(".");
  let currentProp = search;
  for (let i = 0; i < pathParts.length; i++) {
    if (currentProp[pathParts[i]] !== undefined) {
      currentProp = currentProp[pathParts[i]] as Record<string, unknown>;
    } else {
      throw new Error(`${path} does not exist on object`);
    }
  }
  return currentProp;
}

export function setDotSeperatedPropertyValue(
  search: Record<string, unknown>,
  path: string,
  setValue: unknown
): void {
  const pathParts = path.split(".");
  let currentProp = search;
  for (let i = 0; i < pathParts.length; i++) {
    if (i === pathParts.length - 1) {
      currentProp[pathParts[i]] = setValue;
      return;
    }

    if (currentProp[pathParts[i]] !== undefined) {
      currentProp = currentProp[pathParts[i]] as Record<string, unknown>;
    } else {
      throw new Error(`${path} does not exist on object`);
    }
  }
}

export function isMongooseValidationError(value: unknown): value is Error.ValidationError {
  const error = (value as Error.ValidationError);
  return error.name === 'ValidationError' && error.errors !== undefined;
}
